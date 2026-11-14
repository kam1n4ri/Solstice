import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  WhiteboardOpenResult,
  WhiteboardSavePayload,
  WhiteboardSaveResult,
  WhiteboardAutoSavePayload,
  WhiteboardAutoSaveResult,
  WhiteboardExportPayload,
  WhiteboardExportResult,
} from '../shared/types';
import { recentFilesStore } from './recentFilesStore';

function getSolsticeWhiteboardsDir(): string {
  try {
    return path.join(app.getPath('documents'), 'Solstice', 'Whiteboards');
  } catch {
    return path.join(app.getPath('userData'), 'whiteboards');
  }
}

async function getUniqueWhiteboardPath(
  directory: string,
  baseName: string,
  ext: string,
  currentPath?: string
): Promise<string> {
  let candidate = path.join(directory, `${baseName}${ext}`);
  if (currentPath && candidate === currentPath) return candidate;
  let counter = 1;
  while (true) {
    try {
      await fs.access(candidate);
      if (currentPath && candidate === currentPath) return candidate;
      candidate = path.join(directory, `${baseName} (${counter})${ext}`);
      counter++;
    } catch {
      return candidate;
    }
  }
}

export function registerWhiteboardFileHandlers(): void {
  // 1. Get Whiteboards Directory Path
  ipcMain.handle('whiteboard:get-drafts-path', async (): Promise<string> => {
    const dir = getSolsticeWhiteboardsDir();
    await fs.mkdir(dir, { recursive: true });
    return dir;
  });

  // 2. Open Whiteboard via Native Dialog or Path
  ipcMain.handle(
    'whiteboard:open-file',
    async (event, requestedPath?: string): Promise<WhiteboardOpenResult> => {
      try {
        let filePath = requestedPath;

        if (!filePath) {
          const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
          const result = await dialog.showOpenDialog(parentWin as BrowserWindow, {
            title: 'Open Whiteboard',
            properties: ['openFile'],
            filters: [
              { name: 'Solstice Whiteboard', extensions: ['excalidraw', 'tldr', 'json'] },
              { name: 'All Files', extensions: ['*'] },
            ],
          });

          if (result.canceled || result.filePaths.length === 0) {
            return { success: false, canceled: true };
          }
          filePath = result.filePaths[0];
        }

        const content = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(filePath);
        const title = path.basename(filePath, ext);

        await recentFilesStore.addRecentFile({
          filePath,
          fileName: path.basename(filePath),
          tool: 'whiteboard',
        });

        return { success: true, title, content, filePath };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  // 3. Continuous Background Auto-Save with safe collision handling
  ipcMain.handle(
    'whiteboard:auto-save',
    async (_event, payload: WhiteboardAutoSavePayload): Promise<WhiteboardAutoSaveResult> => {
      try {
        const { filePath, title, content, draftId = `board_${Date.now()}` } = payload;
        const whiteboardsDir = getSolsticeWhiteboardsDir();
        await fs.mkdir(whiteboardsDir, { recursive: true });

        let targetPath = filePath;
        const rawTitle =
          title && title !== 'Untitled whiteboard' ? title.trim() : `Untitled_${draftId.slice(-6)}`;
        const cleanTitle = rawTitle.replace(/\.(excalidraw|tldr|json)$/i, '').replace(/[/\\?%*:|"<>]/g, '-').trim();
        const safeBaseTitle = cleanTitle || `Untitled_${draftId.slice(-6)}`;

        if (!targetPath) {
          targetPath = await getUniqueWhiteboardPath(whiteboardsDir, safeBaseTitle, '.excalidraw');
        } else if (path.resolve(path.dirname(targetPath)) === path.resolve(whiteboardsDir)) {
          const currentExt = path.extname(targetPath) || '.excalidraw';
          const desiredFilename = `${safeBaseTitle}${currentExt}`;
          if (path.basename(targetPath) !== desiredFilename) {
            const uniquePath = await getUniqueWhiteboardPath(whiteboardsDir, safeBaseTitle, currentExt, targetPath);
            if (uniquePath !== targetPath) {
              try {
                await fs.rename(targetPath, uniquePath);
                await recentFilesStore.removeRecentFile(targetPath);
                targetPath = uniquePath;
              } catch (renameErr) {
                console.warn('Auto-save safe rename deferred:', renameErr);
              }
            }
          }
        }

        await fs.writeFile(targetPath, content, 'utf-8');

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName: path.basename(targetPath),
          tool: 'whiteboard',
        });

        return {
          success: true,
          filePath: targetPath,
          title: safeBaseTitle,
          lastSaved: Date.now(),
        };
      } catch (err) {
        return {
          success: false,
          filePath: payload.filePath || '',
          title: payload.title || 'Untitled',
          lastSaved: Date.now(),
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  );

  // 4. Save Whiteboard As via Native OS Dialog
  ipcMain.handle(
    'whiteboard:save-file',
    async (event, payload: WhiteboardSavePayload): Promise<WhiteboardSaveResult> => {
      try {
        const { filePath, title, content } = payload;
        const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
        const cleanTitle = (title || 'Untitled whiteboard')
          .replace(/\.(excalidraw|tldr|json)$/i, '')
          .replace(/[/\\?%*:|"<>]/g, '-')
          .trim();

        const defaultSavePath =
          filePath || path.join(getSolsticeWhiteboardsDir(), `${cleanTitle || 'Untitled whiteboard'}.excalidraw`);

        const result = await dialog.showSaveDialog(parentWin as BrowserWindow, {
          title: 'Save Whiteboard As',
          defaultPath: defaultSavePath,
          filters: [
            { name: 'Solstice Whiteboard (*.excalidraw)', extensions: ['excalidraw'] },
            { name: 'JSON Snapshot (*.json)', extensions: ['json'] },
          ],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true };
        }

        const targetPath = result.filePath;
        await fs.writeFile(targetPath, content, 'utf-8');
        const finalTitle = path.basename(targetPath, path.extname(targetPath));

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName: path.basename(targetPath),
          tool: 'whiteboard',
        });

        return { success: true, filePath: targetPath, title: finalTitle };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  // 5. Export Whiteboard Image (PNG, SVG, or JSON)
  ipcMain.handle(
    'whiteboard:export-file',
    async (event, payload: WhiteboardExportPayload): Promise<WhiteboardExportResult> => {
      try {
        const { defaultName = 'whiteboard', format, data } = payload;
        const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;

        const extMap: Record<string, string> = { png: 'png', svg: 'svg', json: 'json' };
        const ext = extMap[format] || 'png';

        const result = await dialog.showSaveDialog(parentWin as BrowserWindow, {
          title: `Export Whiteboard as ${format.toUpperCase()}`,
          defaultPath: path.join(app.getPath('downloads'), `${defaultName}.${ext}`),
          filters: [
            format === 'png'
              ? { name: 'PNG Image (*.png)', extensions: ['png'] }
              : format === 'svg'
              ? { name: 'SVG Vector Image (*.svg)', extensions: ['svg'] }
              : { name: 'JSON Document (*.json)', extensions: ['json'] },
          ],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true };
        }

        if (format === 'png') {
          const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          await fs.writeFile(result.filePath, buffer);
        } else {
          await fs.writeFile(result.filePath, data, 'utf-8');
        }

        return { success: true, filePath: result.filePath };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }
  );
}
