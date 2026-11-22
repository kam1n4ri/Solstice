import { ipcMain, BrowserWindow, app, shell, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { ToolId, WindowOpenResult, RecentFileRecord } from '../shared/types';
import { windowManager } from './windowManager';
import { registerDocsFileHandlers } from './docsFileHandlers';
import { registerWhiteboardFileHandlers } from './whiteboardFileHandlers';
import { registerPdfFileHandlers } from './pdfFileHandlers';
import { registerPdfToolHandlers } from './pdfToolHandlers';
import { registerPdfConvertHandlers } from './pdfConvertHandlers';
import { registerPdfStampHandlers } from './pdfStampHandlers';
import { registerPdfSecurityHandlers } from './pdfSecurityHandlers';
import { recentFilesStore } from './recentFilesStore';
import { fontManager } from './fontManager';

export function registerIpcHandlers(): void {
  // Register dedicated native docs, whiteboard & pdf file operations
  registerDocsFileHandlers();
  registerWhiteboardFileHandlers();
  registerPdfFileHandlers();
  registerPdfToolHandlers();
  registerPdfConvertHandlers();
  registerPdfStampHandlers();
  registerPdfSecurityHandlers();

  // Reveal item in native file explorer
  ipcMain.handle('reveal-in-folder', async (_event, filePath: string): Promise<boolean> => {
    if (filePath) {
      shell.showItemInFolder(filePath);
      return true;
    }
    return false;
  });

  // Open external URL safely in user's default browser
  ipcMain.handle('open-external-url', async (_event, url: string): Promise<boolean> => {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  // Get recent files for the Hub
  ipcMain.handle('hub:get-recent-files', async (): Promise<RecentFileRecord[]> => {
    return recentFilesStore.getRecentFiles();
  });

  // Permanently delete a file from disk (moves to OS Recycle Bin/Trash, fallback to unlink)
  ipcMain.handle(
    'delete-file',
    async (_event, filePath: string): Promise<{ success: boolean; error?: string }> => {
      if (!filePath) {
        return { success: false, error: 'No file path provided' };
      }
      try {
        const normalized = path.normalize(filePath);
        await recentFilesStore.removeRecentFile(normalized);
        if (fs.existsSync(normalized)) {
          try {
            await shell.trashItem(normalized);
          } catch {
            await fs.promises.unlink(normalized);
          }
        }
        return { success: true };
      } catch (err: any) {
        console.error('Failed to delete file from disk:', err);
        return { success: false, error: err.message || 'Failed to delete file' };
      }
    }
  );

  // Remove a recent file (with optional deleteFromDisk flag)
  ipcMain.handle(
    'remove-recent-file',
    async (_event, filePath: string, deleteFromDisk?: boolean): Promise<boolean> => {
      if (!filePath) return false;
      const normalized = path.normalize(filePath);
      await recentFilesStore.removeRecentFile(normalized);
      if (deleteFromDisk) {
        if (fs.existsSync(normalized)) {
          try {
            await shell.trashItem(normalized);
          } catch {
            await fs.promises.unlink(normalized).catch(() => {});
          }
        }
      }
      return true;
    }
  );

  // Confirm unsaved changes via native OS message box
  ipcMain.handle(
    'docs:confirm-unsaved',
    async (event): Promise<'save' | 'dont-save' | 'cancel'> => {
      const win = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showMessageBox(win || (undefined as any), {
        type: 'question',
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Save before exiting?',
        detail: 'Your changes will be lost if you do not save them.',
      });
      if (result.response === 0) return 'save';
      if (result.response === 1) return 'dont-save';
      return 'cancel';
    }
  );

  // Manage dirty state on tool window
  ipcMain.on('docs:set-dirty', (event, isDirty: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (process.platform === 'darwin') {
        win.setDocumentEdited(Boolean(isDirty));
      }
      (win as any).__isDocDirty = Boolean(isDirty);
    }
  });

  ipcMain.on('whiteboard:set-dirty', (event, isDirty: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (process.platform === 'darwin') {
        win.setDocumentEdited(Boolean(isDirty));
      }
      (win as any).__isWhiteboardDirty = Boolean(isDirty);
    }
  });

  // Spawn or focus an isolated tool window
  ipcMain.handle(
    'open-tool-window',
    async (_event, toolId: ToolId, initialPath?: string): Promise<WindowOpenResult> => {
      if (!toolId) {
        return {
          success: false,
          toolId: '' as ToolId,
          error: 'No tool ID specified',
        };
      }
      return windowManager.openToolWindow(toolId, initialPath);
    }
  );

  // Return currently active tools
  ipcMain.handle('get-active-tools', async (): Promise<ToolId[]> => {
    return windowManager.getActiveTools();
  });

  // App version
  ipcMain.handle('get-app-version', async (): Promise<string> => {
    return app.getVersion();
  });

  // Window controls
  ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.minimize();
    }
  });

  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on('window-close', (event, force?: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      const anyWin = win as any;
      if (anyWin.__closeFallbackTimer) {
        clearTimeout(anyWin.__closeFallbackTimer);
        anyWin.__closeFallbackTimer = null;
      }
      anyWin.__isClosing = true;
      if (force) {
        win.destroy();
      } else {
        win.close();
      }
    }
  });

  ipcMain.on('window-cancel-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      const anyWin = win as any;
      anyWin.__isClosing = false;
      if (anyWin.__closeFallbackTimer) {
        clearTimeout(anyWin.__closeFallbackTimer);
        anyWin.__closeFallbackTimer = null;
      }
    }
  });

  // Suite-Wide Font Asset Management
  ipcMain.handle('fonts:get-installed', async () => fontManager.getInstalledFonts());
  ipcMain.handle('fonts:download-google-font', async (_e, payload) => {
    return fontManager.downloadGoogleFont(payload.name, payload.category);
  });
  ipcMain.handle('fonts:import-local', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    return fontManager.importLocalFont(win);
  });
  ipcMain.handle('fonts:delete', async (_e, fontId) => fontManager.deleteFont(fontId));
}
