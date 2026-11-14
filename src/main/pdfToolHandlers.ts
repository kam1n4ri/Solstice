import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  PdfMergePayload,
  PdfMergeResult,
  PdfSplitPayload,
  PdfSplitResult,
  PdfOrganizePayload,
  PdfOrganizeResult,
  PdfSelectFilesResult,
} from '../shared/types';
import { getSolsticePdfDir, getUniquePdfPath } from './pdfFileIoHelper';
import { recentFilesStore } from './recentFilesStore';
import { executePdfSplit } from './pdfSplitHelper';

export function registerPdfToolHandlers(): void {
  // 1. Select Multiple PDF Files Dialog
  ipcMain.handle(
    'pdf:select-files',
    async (event, options?: { multiple?: boolean; title?: string }): Promise<PdfSelectFilesResult> => {
      const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
      const result = await dialog.showOpenDialog(parentWin as BrowserWindow, {
        title: options?.title || 'Select PDF Documents',
        properties: options?.multiple !== false ? ['openFile', 'multiSelections'] : ['openFile'],
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true, files: [] };
      }

      const files = await Promise.all(
        result.filePaths.map(async (filePath) => {
          const stat = await fs.stat(filePath);
          return {
            filePath,
            fileName: path.basename(filePath),
            fileSize: stat.size,
          };
        })
      );

      return { canceled: false, files };
    }
  );

  // 2. Merge Multiple PDFs
  ipcMain.handle(
    'pdf:merge',
    async (_event, payload: PdfMergePayload): Promise<PdfMergeResult> => {
      try {
        if (!payload.filePaths || payload.filePaths.length < 2) {
          return { success: false, error: 'At least 2 PDF files are required to merge.' };
        }

        const mergedDoc = await PDFDocument.create();

        for (const filePath of payload.filePaths) {
          const fileBytes = await fs.readFile(filePath);
          const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
          const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
          copiedPages.forEach((page) => mergedDoc.addPage(page));
        }

        const mergedBytes = await mergedDoc.save();
        const pageCount = mergedDoc.getPageCount();

        let targetPath = payload.outputPath;
        let fileName = '';
        if (!targetPath) {
          const defaultDir = getSolsticePdfDir();
          const defaultName = payload.defaultName || `Merged_Document_${Date.now()}.pdf`;
          const unique = await getUniquePdfPath(defaultDir, defaultName);
          targetPath = unique.filePath;
          fileName = unique.fileName;
        } else {
          fileName = path.basename(targetPath);
        }

        await fs.writeFile(targetPath, Buffer.from(mergedBytes));

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName,
          tool: 'pdf',
        });

        return {
          success: true,
          filePath: targetPath,
          fileName,
          pageCount,
          data: Array.from(mergedBytes),
        };
      } catch (err) {
        console.error('[PDF-IPC] Merge failed:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to merge PDF files.',
        };
      }
    }
  );

  // 3. Split PDF by Ranges or Extract All Pages
  ipcMain.handle(
    'pdf:split',
    async (_event, payload: PdfSplitPayload): Promise<PdfSplitResult> => {
      try {
        let srcBytes: Uint8Array;
        let baseName = payload.baseName || 'Document';

        if (payload.filePath) {
          srcBytes = new Uint8Array(await fs.readFile(payload.filePath));
          baseName = path.basename(payload.filePath).replace(/\.pdf$/i, '');
        } else if (payload.fileData) {
          srcBytes = new Uint8Array(payload.fileData);
        } else {
          return { success: false, error: 'No source PDF provided.' };
        }

        const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });

        let outputDir = payload.outputDir;
        if (!outputDir) {
          outputDir = getSolsticePdfDir();
          await fs.mkdir(outputDir, { recursive: true });
        }

        const { outputPaths, outputFiles } = await executePdfSplit(
          srcDoc,
          baseName,
          outputDir,
          payload
        );

        return { success: true, outputPaths, outputFiles };
      } catch (err) {
        console.error('[PDF-IPC] Split failed:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to split PDF.',
        };
      }
    }
  );

  // 4. Organize Pages (Reorder, Rotate, Delete, Multi-File)
  ipcMain.handle(
    'pdf:organize',
    async (_event, payload: PdfOrganizePayload): Promise<PdfOrganizeResult> => {
      try {
        const loadedDocs: PDFDocument[] = [];
        if (payload.files && payload.files.length > 0) {
          for (const f of payload.files) {
            const raw = f.filePath ? await fs.readFile(f.filePath) : f.fileData;
            if (raw) {
              const b = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
              loadedDocs.push(await PDFDocument.load(b, { ignoreEncryption: true }));
            }
          }
        } else {
          const raw = payload.filePath ? await fs.readFile(payload.filePath) : payload.fileData;
          if (raw) {
            const b = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
            loadedDocs.push(await PDFDocument.load(b, { ignoreEncryption: true }));
          }
        }

        if (loadedDocs.length === 0 || !payload.pageActions?.length) {
          return { success: false, error: 'Document must contain at least 1 valid page.' };
        }

        const newDoc = await PDFDocument.create();
        for (const action of payload.pageActions) {
          const srcDoc = loadedDocs[action.fileIndex ?? 0] || loadedDocs[0];
          const [copied] = await newDoc.copyPages(srcDoc, [action.originalPageIndex]);
          if (action.rotationDelta) {
            const angle = (copied.getRotation().angle + action.rotationDelta) % 360;
            copied.setRotation(degrees(angle));
          }
          newDoc.addPage(copied);
        }

        const organizedBytes = await newDoc.save();
        const defaultDir = getSolsticePdfDir();
        const isSolsticeDir =
          payload.filePath &&
          path.resolve(path.dirname(payload.filePath)) === path.resolve(defaultDir);

        let targetPath: string;
        let fileName: string;

        if (payload.saveAsCopy || !payload.filePath || !isSolsticeDir) {
          const defaultName = payload.defaultName || `Organized_${Date.now()}.pdf`;
          const unique = await getUniquePdfPath(defaultDir, defaultName);
          targetPath = unique.filePath;
          fileName = unique.fileName;
        } else {
          targetPath = payload.filePath;
          fileName = path.basename(targetPath);
        }

        await fs.writeFile(targetPath, Buffer.from(organizedBytes));

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName,
          tool: 'pdf',
        });

        return {
          success: true,
          filePath: targetPath,
          fileName,
          pageCount: newDoc.getPageCount(),
          data: Array.from(organizedBytes),
        };
      } catch (err) {
        console.error('[PDF-IPC] Organize failed:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to organize pages.',
        };
      }
    }
  );
}
