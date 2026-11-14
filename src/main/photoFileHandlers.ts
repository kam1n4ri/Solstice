import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PhotoOpenResult, PhotoSavePayload, PhotoSaveResult } from '../shared/types';
import { recentFilesStore } from './recentFilesStore';
import {
  getSolsticePhotoDir,
  getPhotoWorkingCopyMap,
  savePhotoWorkingCopyMap,
  unmapPhotoWorkingCopy,
  getUniquePhotoPath,
} from './photoWorkingCopyHelper';

export { getSolsticePhotoDir, unmapPhotoWorkingCopy };

/**
 * Ensures an isolated working copy exists in Solstice Photos directory.
 * External originals are NEVER mutated or deleted.
 */
export async function ensurePhotoWorkingCopy(sourcePath: string): Promise<string> {
  const photoDir = getSolsticePhotoDir();
  await fs.mkdir(photoDir, { recursive: true });

  const normalizedSource = path.normalize(sourcePath);
  const normalizedPhotoDir = path.normalize(photoDir);

  if (normalizedSource.startsWith(normalizedPhotoDir)) {
    return normalizedSource;
  }

  const map = await getPhotoWorkingCopyMap();
  const existingWorking = map[normalizedSource];
  if (existingWorking) {
    try {
      await fs.access(existingWorking);
      return existingWorking;
    } catch {
      delete map[normalizedSource];
    }
  }

  const ext = path.extname(normalizedSource) || '.png';
  const baseName = path.basename(normalizedSource, ext);
  const defaultTarget = path.join(photoDir, `${baseName}${ext}`);

  let targetPath = defaultTarget;
  try {
    await fs.access(defaultTarget);
    const isClaimedByOther = Object.entries(map).some(
      ([src, dest]) => src !== normalizedSource && path.normalize(dest) === path.normalize(defaultTarget)
    );
    if (isClaimedByOther) {
      targetPath = await getUniquePhotoPath(photoDir, baseName, ext);
    }
  } catch {
    targetPath = defaultTarget;
  }

  // Always copy pristine external original file over to the working copy location
  await fs.copyFile(normalizedSource, targetPath);

  map[normalizedSource] = targetPath;
  await savePhotoWorkingCopyMap(map);
  return targetPath;
}

function bufferToDataUrl(buffer: Buffer, ext: string): string {
  const cleanExt = ext.replace('.', '').toLowerCase();
  const mimeType = cleanExt === 'jpg' || cleanExt === 'jpeg'
    ? 'image/jpeg'
    : cleanExt === 'webp'
    ? 'image/webp'
    : cleanExt === 'svg'
    ? 'image/svg+xml'
    : 'image/png';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function loadPhotoResponse(filePath: string): Promise<PhotoOpenResult> {
  const buffer = await fs.readFile(filePath);
  const stat = await fs.stat(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);

  await recentFilesStore.addRecentFile({
    filePath,
    fileName,
    tool: 'photo',
    fileSize: stat.size,
  });

  return {
    success: true,
    filePath,
    fileName,
    dataUrl: bufferToDataUrl(buffer, ext),
    fileSize: stat.size,
  };
}

export function registerPhotoFileHandlers(): void {
  ipcMain.handle('photo:get-directory', async (): Promise<string> => {
    return getSolsticePhotoDir();
  });

  ipcMain.handle('photo:open-file', async (event, requestedPath?: string): Promise<PhotoOpenResult> => {
    try {
      let sourcePath = requestedPath;
      if (!sourcePath) {
        const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
        const result = await dialog.showOpenDialog(parentWin as BrowserWindow, {
          title: 'Open Image',
          properties: ['openFile'],
          filters: [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'svg'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, canceled: true };
        }
        sourcePath = result.filePaths[0];
      }

      const workingPath = await ensurePhotoWorkingCopy(sourcePath);
      return await loadPhotoResponse(workingPath);
    } catch (err) {
      console.error('[Photo-IPC] Open failed:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('photo:save-file', async (_event, payload: PhotoSavePayload): Promise<PhotoSaveResult> => {
    try {
      const photoDir = getSolsticePhotoDir();
      await fs.mkdir(photoDir, { recursive: true });

      let targetPath = payload.filePath;
      if (!targetPath) {
        const title = (payload.title || payload.fileName || 'Untitled').replace(/\.[a-zA-Z0-9]+$/, '');
        targetPath = await getUniquePhotoPath(photoDir, title, '.png');
      }

      const base64Data = payload.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(targetPath, buffer);

      const stat = await fs.stat(targetPath);
      const fileName = path.basename(targetPath);

      await recentFilesStore.addRecentFile({
        filePath: targetPath,
        fileName,
        tool: 'photo',
        fileSize: stat.size,
      });

      return { success: true, filePath: targetPath, fileName, fileSize: stat.size };
    } catch (err) {
      console.error('[Photo-IPC] Save failed:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('photo:export-file', async (event, payload: {
    dataUrl: string;
    defaultName?: string;
    format?: string;
  }): Promise<PhotoSaveResult> => {
    try {
      const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
      const format = payload.format || 'png';
      const defaultName = (payload.defaultName || 'Edited-Photo').replace(/\.[a-zA-Z0-9]+$/, '') + `.${format}`;

      const res = await dialog.showSaveDialog(parentWin as BrowserWindow, {
        title: 'Export Photo',
        defaultPath: defaultName,
        filters: [
          { name: 'PNG Image (*.png)', extensions: ['png'] },
          { name: 'JPEG Image (*.jpg)', extensions: ['jpg', 'jpeg'] },
          { name: 'WebP Image (*.webp)', extensions: ['webp'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (res.canceled || !res.filePath) {
        return { success: false, canceled: true };
      }

      const base64Data = payload.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(res.filePath, buffer);

      return { success: true, filePath: res.filePath, fileName: path.basename(res.filePath) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('photo:get-thumbnail', async (_event, filePath: string): Promise<string | null> => {
    try {
      if (!filePath) return null;
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      return bufferToDataUrl(buffer, ext);
    } catch {
      return null;
    }
  });

  ipcMain.handle('photo:delete-working-copy', async (_event, filePath: string): Promise<boolean> => {
    try {
      if (!filePath) return false;
      const normalized = path.normalize(filePath);
      await recentFilesStore.removeRecentFile(normalized);
      await unmapPhotoWorkingCopy(normalized);

      const photoDir = path.normalize(getSolsticePhotoDir());
      if (normalized.startsWith(photoDir)) {
        try {
          await fs.unlink(normalized);
        } catch {
          // ignore if already deleted
        }
      }
      return true;
    } catch (err) {
      console.error('[Photo-IPC] Delete working copy failed:', err);
      return false;
    }
  });

  ipcMain.handle('photo:revert-to-original', async (_event, workingPath: string): Promise<PhotoOpenResult> => {
    try {
      const map = await getPhotoWorkingCopyMap();
      const normalizedWorking = path.normalize(workingPath);
      let originalSource: string | null = null;
      for (const [src, dest] of Object.entries(map)) {
        if (path.normalize(dest) === normalizedWorking) {
          originalSource = src;
          break;
        }
      }

      if (!originalSource) {
        return { success: false, error: 'No original external source file found in mapping' };
      }

      try {
        await fs.access(originalSource);
      } catch {
        return { success: false, error: 'Original source file no longer exists at original location' };
      }

      await fs.copyFile(originalSource, normalizedWorking);
      return await loadPhotoResponse(normalizedWorking);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}
