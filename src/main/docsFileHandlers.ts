import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as mammoth from 'mammoth';
import {
  DocsOpenResult,
  DocsSavePayload,
  DocsSaveResult,
  DocsAutoSavePayload,
  DocsAutoSaveResult,
  DocsExportPayload,
  DocsExportResult,
} from '../shared/types';
import { recentFilesStore } from './recentFilesStore';
import {
  getSolsticeDocumentsDir,
  writeContentByExtension,
  getUniqueDocPath,
} from './docsFileIoHelper';
import { markdownToHtml, plainTextToHtml } from '../shared/formatConverter';
import { generatePdfFromHtml } from './pdfExporter';

export function registerDocsFileHandlers(): void {
  // 1. Open File via Native OS Dialog (or direct path)
  ipcMain.handle('docs:open-file', async (event, requestedPath?: string): Promise<DocsOpenResult> => {
    try {
      let filePath = requestedPath;

      if (!filePath) {
        const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
        const result = await dialog.showOpenDialog(parentWin as BrowserWindow, {
          title: 'Open Document',
          properties: ['openFile'],
          filters: [
            { name: 'Supported Documents', extensions: ['docx', 'md', 'html', 'txt'] },
            { name: 'Word Document', extensions: ['docx'] },
            { name: 'Markdown Document', extensions: ['md'] },
            { name: 'HTML Document', extensions: ['html'] },
            { name: 'Text Document', extensions: ['txt'] },
          ],
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, canceled: true };
        }
        filePath = result.filePaths[0];
      }

      const ext = path.extname(filePath).toLowerCase().replace('.', '');
      const title = path.basename(filePath, path.extname(filePath));
      let content = '';

      if (ext === 'docx') {
        const docxResult = await mammoth.convertToHtml({ path: filePath });
        content = docxResult.value?.trim() || '<p></p>';
      } else if (ext === 'md') {
        const raw = await fs.readFile(filePath, 'utf-8');
        content = markdownToHtml(raw);
      } else if (ext === 'txt') {
        const raw = await fs.readFile(filePath, 'utf-8');
        content = plainTextToHtml(raw);
      } else {
        content = await fs.readFile(filePath, 'utf-8');
      }

      await recentFilesStore.addRecentFile({
        filePath,
        fileName: path.basename(filePath),
        tool: 'docs',
      });

      const validFormat = (['docx', 'md', 'html', 'txt'].includes(ext)
        ? ext === 'htm'
          ? 'html'
          : ext
        : 'html') as DocsSavePayload['format'];

      return {
        success: true,
        title,
        content,
        filePath,
        format: validFormat,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // 2. Real-time Auto-Save with collision-safe title renaming
  ipcMain.handle(
    'docs:auto-save',
    async (_event, payload: DocsAutoSavePayload): Promise<DocsAutoSaveResult> => {
      try {
        const { title, content } = payload;
        let targetPath = payload.filePath;
        const draftId = payload.draftId || `draft-${Date.now()}`;
        const docsDir = getSolsticeDocumentsDir();
        await fs.mkdir(docsDir, { recursive: true });

        const isCustomTitle = Boolean(
          title && title.trim() !== '' && title.trim() !== 'Untitled document'
        );
        let safeBaseTitle: string;
        if (isCustomTitle) {
          const cleanTitle = (title || '')
            .trim()
            .replace(/\.(html|docx|md|txt)$/i, '')
            .replace(/[/\\?%*:|"<>]/g, '-')
            .trim();
          safeBaseTitle = cleanTitle || `Untitled_${draftId.slice(-6)}`;
        } else if (targetPath) {
          safeBaseTitle = path.basename(targetPath, path.extname(targetPath));
        } else {
          safeBaseTitle = `Untitled_${draftId.slice(-6)}`;
        }

        if (!targetPath) {
          targetPath = await getUniqueDocPath(docsDir, safeBaseTitle, '.html');
        } else if (path.dirname(targetPath) === docsDir) {
          const currentExt = path.extname(targetPath) || '.html';
          const desiredFilename = `${safeBaseTitle}${currentExt}`;
          if (path.basename(targetPath) !== desiredFilename) {
            const uniquePath = await getUniqueDocPath(docsDir, safeBaseTitle, currentExt, targetPath);
            if (uniquePath !== targetPath) {
              try {
                await fs.access(targetPath);
                await fs.rename(targetPath, uniquePath);
              } catch {
                // targetPath didn't exist yet on disk
              }
              await recentFilesStore.removeRecentFile(targetPath);
              targetPath = uniquePath;
            }
          }
        }

        await writeContentByExtension(targetPath, content);

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName: path.basename(targetPath),
          tool: 'docs',
        });

        return { success: true, filePath: targetPath, draftId };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  // 3. Save File via Native OS Dialog / Direct Overwrite / Save As
  ipcMain.handle('docs:save-file', async (event, payload: DocsSavePayload): Promise<DocsSaveResult> => {
    try {
      const { filePath, title, content, format = 'html', isSaveAs } = payload;
      let targetPath = filePath;

      if (!targetPath || isSaveAs) {
        const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
        const ext = format === 'docx' ? 'docx' : format === 'md' ? 'md' : format === 'txt' ? 'txt' : 'html';
        const cleanTitle = (title || 'Untitled document').replace(/\.(html|docx|md|txt)$/i, '').trim();
        const defaultPath = targetPath || `${cleanTitle || 'Untitled document'}.${ext}`;
        const saveResult = await dialog.showSaveDialog(parentWin as BrowserWindow, {
          title: isSaveAs ? 'Save Document As' : 'Save Document',
          defaultPath,
          filters: [
            { name: 'Document', extensions: [ext] },
            { name: 'Supported Documents', extensions: ['html', 'docx', 'md', 'txt'] },
            { name: 'HTML Document', extensions: ['html'] },
            { name: 'Word Document', extensions: ['docx'] },
            { name: 'Markdown Document', extensions: ['md'] },
            { name: 'Plain Text', extensions: ['txt'] },
          ],
        });

        if (saveResult.canceled || !saveResult.filePath) {
          return { success: false, canceled: true };
        }
        targetPath = saveResult.filePath;
      }

      await writeContentByExtension(targetPath, content);

      await recentFilesStore.addRecentFile({
        filePath: targetPath,
        fileName: path.basename(targetPath),
        tool: 'docs',
      });

      return {
        success: true,
        filePath: targetPath,
        title: path.basename(targetPath, path.extname(targetPath)),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // 4. Export File via Native OS Dialog
  ipcMain.handle('docs:export-file', async (event, payload: DocsExportPayload): Promise<DocsExportResult> => {
    try {
      const { format, title, content, htmlContent } = payload;
      const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;

      const filtersMap: Record<string, { name: string; extensions: string[] }> = {
        pdf: { name: 'PDF Document', extensions: ['pdf'] },
        docx: { name: 'Word Document', extensions: ['docx'] },
        md: { name: 'Markdown Document', extensions: ['md'] },
        html: { name: 'HTML Document', extensions: ['html'] },
        txt: { name: 'Plain Text', extensions: ['txt'] },
      };

      const filter = filtersMap[format] || { name: 'Document', extensions: [format] };
      const cleanTitle = (title || 'Untitled document').replace(/\.(html|docx|md|txt|pdf)$/i, '').trim();
      const saveResult = await dialog.showSaveDialog(parentWin as BrowserWindow, {
        title: `Export as ${format.toUpperCase()}`,
        defaultPath: `${cleanTitle || 'Untitled document'}.${format}`,
        filters: [filter],
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, canceled: true };
      }

      const targetPath = saveResult.filePath;

      if (format === 'pdf') {
        const rawHtml = htmlContent || content;
        const pdfBuffer = await generatePdfFromHtml(rawHtml);
        await fs.writeFile(targetPath, pdfBuffer);
      } else {
        await writeContentByExtension(targetPath, htmlContent || content);
      }

      return { success: true, filePath: targetPath };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // 5. Query Drafts / Documents Directory
  ipcMain.handle('docs:get-drafts-path', async (): Promise<string> => {
    const docsDir = getSolsticeDocumentsDir();
    await fs.mkdir(docsDir, { recursive: true });
    return docsDir;
  });
}
