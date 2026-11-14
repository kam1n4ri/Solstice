import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  PdfOpenResult,
  PdfSavePayload,
  PdfSaveResult,
  PdfReadResult,
} from '../shared/types';
import { recentFilesStore } from './recentFilesStore';
import {
  getSolsticePdfDir,
  ensureWorkingCopy,
  createWorkingCopyFromData,
  renameWorkingPdf,
  exportPdfViaDialog,
  saveWorkingPdf,
} from './pdfWorkingCopy';

async function loadWorkingCopyResponse(filePath: string): Promise<PdfOpenResult> {
  const buffer = await fs.readFile(filePath);
  const stat = await fs.stat(filePath);
  const fileName = path.basename(filePath);

  await recentFilesStore.addRecentFile({
    filePath,
    fileName,
    tool: 'pdf',
  });

  return {
    success: true,
    filePath,
    fileName,
    data: Array.from(new Uint8Array(buffer)),
    fileSize: stat.size,
  };
}

export function registerPdfFileHandlers(): void {
  // 1. Get Default PDF Directory Path
  ipcMain.handle('pdf:get-directory', async (): Promise<string> => {
    return getSolsticePdfDir();
  });

  // 2. Open PDF File (Ensures a working copy is safely created in Solstice/PDFs)
  ipcMain.handle(
    'pdf:open-file',
    async (event, requestedPath?: string): Promise<PdfOpenResult> => {
      try {
        let sourcePath = requestedPath;

        if (!sourcePath) {
          const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
          const result = await dialog.showOpenDialog(parentWin as BrowserWindow, {
            title: 'Open PDF Document',
            properties: ['openFile'],
            filters: [
              { name: 'PDF Documents', extensions: ['pdf'] },
              { name: 'All Files', extensions: ['*'] },
            ],
          });

          if (result.canceled || result.filePaths.length === 0) {
            return { success: false, canceled: true };
          }
          sourcePath = result.filePaths[0];
        }

        const workingPath = await ensureWorkingCopy(sourcePath);
        return await loadWorkingCopyResponse(workingPath);
      } catch (error) {
        console.error('[PDF-IPC] Failed to open PDF file:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read PDF document',
        };
      }
    }
  );

  // 3. Create Working Copy (for dropped files, blank notes, or external imports)
  ipcMain.handle(
    'pdf:create-working-copy',
    async (
      _event,
      payload: { sourcePath?: string; data?: Uint8Array | number[]; fileName?: string }
    ): Promise<PdfOpenResult> => {
      try {
        if (payload.sourcePath) {
          const workingPath = await ensureWorkingCopy(payload.sourcePath);
          return await loadWorkingCopyResponse(workingPath);
        }

        if (payload.data) {
          const buffer = Buffer.from(payload.data);
          const { filePath } = await createWorkingCopyFromData(
            buffer,
            payload.fileName || 'Untitled-Note.pdf'
          );
          return await loadWorkingCopyResponse(filePath);
        }

        return { success: false, error: 'No source path or data provided' };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );

  // 4. Read PDF File from Specific Disk Path
  ipcMain.handle(
    'pdf:read-file',
    async (_event, filePath: string): Promise<PdfReadResult> => {
      try {
        if (!filePath) {
          return { success: false, filePath: '', error: 'No path specified' };
        }
        const buffer = await fs.readFile(filePath);
        const stat = await fs.stat(filePath);

        return {
          success: true,
          filePath,
          data: Array.from(new Uint8Array(buffer)),
          fileSize: stat.size,
        };
      } catch (error) {
        return {
          success: false,
          filePath,
          error: error instanceof Error ? error.message : 'Failed to read PDF file',
        };
      }
    }
  );

  // 5. Rename Working PDF File
  ipcMain.handle(
    'pdf:rename-file',
    async (
      _event,
      payload: { oldPath: string; newTitle: string }
    ): Promise<{ success: boolean; newPath?: string; newFileName?: string; error?: string }> => {
      return renameWorkingPdf(payload.oldPath, payload.newTitle);
    }
  );

  // 6. Direct Save / Auto-Save PDF File
  ipcMain.handle(
    'pdf:save-file',
    async (_event, payload: PdfSavePayload): Promise<PdfSaveResult> => {
      try {
        return await saveWorkingPdf(
          payload.filePath,
          payload.fileName,
          payload.title,
          payload.data
        );
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to write PDF document',
        };
      }
    }
  );

  // 7. Export PDF File (Native OS Save Dialog to choose destination)
  ipcMain.handle(
    'pdf:export-file',
    async (
      event,
      payload: { data: Uint8Array | number[] | string; defaultName?: string }
    ): Promise<PdfSaveResult> => {
      const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
      return exportPdfViaDialog(parentWin, payload.data, payload.defaultName);
    }
  );

  // 8. Native OS Print Dialog
  ipcMain.handle('pdf:print', async (event): Promise<{ success: boolean; error?: string }> => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return { success: false, error: 'Window not found' };

      await new Promise<void>((resolve, reject) => {
        win.webContents.print(
          { silent: false, printBackground: true },
          (success, failureReason) => {
            if (success) resolve();
            else reject(new Error(failureReason || 'Print canceled or failed'));
          }
        );
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // 9. Save Multiple Files into a User-Selected Folder
  ipcMain.handle(
    'pdf:save-files-to-folder',
    async (
      event,
      payload: { files: { fileName: string; data: Uint8Array | number[] }[] }
    ): Promise<{ success: boolean; canceled?: boolean; folderPath?: string; error?: string }> => {
      try {
        if (!payload.files || payload.files.length === 0) {
          return { success: false, error: 'No files provided to save.' };
        }
        const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
        const dirRes = await dialog.showOpenDialog(parentWin as BrowserWindow, {
          title: 'Select Destination Folder for Split PDFs',
          properties: ['openDirectory', 'createDirectory'],
          defaultPath: getSolsticePdfDir(),
        });

        if (dirRes.canceled || dirRes.filePaths.length === 0) {
          return { success: false, canceled: true };
        }

        const outputDir = dirRes.filePaths[0];
        for (const item of payload.files) {
          const outPath = path.join(outputDir, item.fileName);
          const buf =
            item.data instanceof Uint8Array
              ? Buffer.from(item.data)
              : Buffer.from(new Uint8Array(item.data));
          await fs.writeFile(outPath, buf);
        }

        return { success: true, folderPath: outputDir };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to save files to folder.',
        };
      }
    }
  );
}
