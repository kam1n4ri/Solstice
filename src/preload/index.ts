import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  ToolId,
  WindowOpenResult,
  WindowStateInfo,
  SolsticeAPI,
  DocsOpenResult,
  DocsSavePayload,
  DocsSaveResult,
  DocsAutoSavePayload,
  DocsAutoSaveResult,
  DocsExportPayload,
  DocsExportResult,
  WhiteboardOpenResult,
  WhiteboardSavePayload,
  WhiteboardSaveResult,
  WhiteboardAutoSavePayload,
  WhiteboardAutoSaveResult,
  WhiteboardExportPayload,
  WhiteboardExportResult,
  PdfOpenResult,
  PdfSavePayload,
  PdfSaveResult,
  PdfReadResult,
  PdfSelectFilesResult,
  PdfMergePayload,
  PdfMergeResult,
  PdfSplitPayload,
  PdfSplitResult,
  PdfOrganizePayload,
  PdfOrganizeResult,
  PdfConvertImagesPayload,
  PdfConvertImagesResult,
  PdfExportImagesPayload,
  PdfExportImagesResult,
  PdfWatermarkPayload,
  PdfWatermarkResult,
  PdfPageNumberPayload,
  PdfPageNumberResult,
  PdfProtectPayload,
  PdfProtectResult,
  PdfUnlockPayload,
  PdfUnlockResult,
  PhotoOpenResult,
  PhotoSavePayload,
  PhotoSaveResult,
  RecentFileRecord,
  InstalledFont,
} from '../shared/types';

const api: SolsticeAPI = {
  openToolWindow: (toolId: ToolId, initialPath?: string): Promise<WindowOpenResult> =>
    ipcRenderer.invoke('open-tool-window', toolId, initialPath),

  getActiveTools: (): Promise<ToolId[]> => ipcRenderer.invoke('get-active-tools'),

  onToolWindowStateChanged: (callback: (state: WindowStateInfo) => void) => {
    const handler = (_event: IpcRendererEvent, state: WindowStateInfo) => callback(state);
    ipcRenderer.on('tool-window-state-changed', handler);
    return () => {
      ipcRenderer.removeListener('tool-window-state-changed', handler);
    };
  },

  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: (force?: boolean) => ipcRenderer.send('window-close', force),
  cancelClose: () => ipcRenderer.send('window-cancel-close'),

  // Native Docs File IPC
  docsOpenFile: (filePath?: string): Promise<DocsOpenResult> =>
    ipcRenderer.invoke('docs:open-file', filePath),
  docsSaveFile: (payload: DocsSavePayload): Promise<DocsSaveResult> =>
    ipcRenderer.invoke('docs:save-file', payload),
  docsAutoSave: (payload: DocsAutoSavePayload): Promise<DocsAutoSaveResult> =>
    ipcRenderer.invoke('docs:auto-save', payload),
  getDraftsPath: (): Promise<string> => ipcRenderer.invoke('docs:get-drafts-path'),
  docsExportFile: (payload: DocsExportPayload): Promise<DocsExportResult> =>
    ipcRenderer.invoke('docs:export-file', payload),

  // Native Whiteboard File IPC
  whiteboardOpenFile: (filePath?: string): Promise<WhiteboardOpenResult> =>
    ipcRenderer.invoke('whiteboard:open-file', filePath),
  whiteboardSaveFile: (payload: WhiteboardSavePayload): Promise<WhiteboardSaveResult> =>
    ipcRenderer.invoke('whiteboard:save-file', payload),
  whiteboardAutoSave: (payload: WhiteboardAutoSavePayload): Promise<WhiteboardAutoSaveResult> =>
    ipcRenderer.invoke('whiteboard:auto-save', payload),
  whiteboardExportFile: (payload: WhiteboardExportPayload): Promise<WhiteboardExportResult> =>
    ipcRenderer.invoke('whiteboard:export-file', payload),
  getWhiteboardDraftsPath: (): Promise<string> =>
    ipcRenderer.invoke('whiteboard:get-drafts-path'),

  // Native PDF File & Offline Tools IPC
  pdfOpenFile: (filePath?: string): Promise<PdfOpenResult> =>
    ipcRenderer.invoke('pdf:open-file', filePath),
  pdfSaveFile: (payload: PdfSavePayload): Promise<PdfSaveResult> =>
    ipcRenderer.invoke('pdf:save-file', payload),
  pdfReadFile: (filePath: string): Promise<PdfReadResult> =>
    ipcRenderer.invoke('pdf:read-file', filePath),
  pdfCreateWorkingCopy: (payload: {
    sourcePath?: string;
    data?: Uint8Array | number[];
    fileName?: string;
  }): Promise<PdfOpenResult> => ipcRenderer.invoke('pdf:create-working-copy', payload),
  pdfRenameFile: (payload: {
    oldPath: string;
    newTitle: string;
  }): Promise<{ success: boolean; newPath?: string; newFileName?: string; error?: string }> =>
    ipcRenderer.invoke('pdf:rename-file', payload),
  pdfExportFile: (payload: {
    data: Uint8Array | number[] | string;
    defaultName?: string;
  }): Promise<PdfSaveResult> => ipcRenderer.invoke('pdf:export-file', payload),
  pdfPrint: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('pdf:print'),
  getPdfDirectory: (): Promise<string> => ipcRenderer.invoke('pdf:get-directory'),
  pdfSelectFiles: (options?: {
    multiple?: boolean;
    title?: string;
  }): Promise<PdfSelectFilesResult> => ipcRenderer.invoke('pdf:select-files', options),
  pdfSelectImages: (): Promise<{ canceled: boolean; filePaths: string[] }> =>
    ipcRenderer.invoke('pdf:select-images'),
  pdfMerge: (payload: PdfMergePayload): Promise<PdfMergeResult> =>
    ipcRenderer.invoke('pdf:merge', payload),
  pdfSplit: (payload: PdfSplitPayload): Promise<PdfSplitResult> =>
    ipcRenderer.invoke('pdf:split', payload),
  pdfSaveFilesToFolder: (payload: {
    files: { fileName: string; data: Uint8Array | number[] }[];
  }): Promise<{ success: boolean; canceled?: boolean; folderPath?: string; error?: string }> =>
    ipcRenderer.invoke('pdf:save-files-to-folder', payload),
  pdfOrganize: (payload: PdfOrganizePayload): Promise<PdfOrganizeResult> =>
    ipcRenderer.invoke('pdf:organize', payload),
  pdfConvertImages: (payload: PdfConvertImagesPayload): Promise<PdfConvertImagesResult> =>
    ipcRenderer.invoke('pdf:convert-images', payload),
  pdfExportImages: (payload: PdfExportImagesPayload): Promise<PdfExportImagesResult> =>
    ipcRenderer.invoke('pdf:export-images', payload),
  pdfWatermark: (payload: PdfWatermarkPayload): Promise<PdfWatermarkResult> =>
    ipcRenderer.invoke('pdf:watermark', payload),
  pdfPageNumbers: (payload: PdfPageNumberPayload): Promise<PdfPageNumberResult> =>
    ipcRenderer.invoke('pdf:page-numbers', payload),
  pdfProtect: (payload: PdfProtectPayload): Promise<PdfProtectResult> =>
    ipcRenderer.invoke('pdf:protect', payload),
  pdfUnlock: (payload: PdfUnlockPayload): Promise<PdfUnlockResult> =>
    ipcRenderer.invoke('pdf:unlock', payload),

  // Photo Studio Native IPC
  photoOpenFile: (requestedPath?: string): Promise<PhotoOpenResult> =>
    ipcRenderer.invoke('photo:open-file', requestedPath),
  photoSaveFile: (payload: PhotoSavePayload): Promise<PhotoSaveResult> =>
    ipcRenderer.invoke('photo:save-file', payload),
  photoExportFile: (payload: {
    dataUrl: string;
    defaultName?: string;
    format?: string;
    quality?: number;
  }): Promise<PhotoSaveResult> =>
    ipcRenderer.invoke('photo:export-file', payload),
  photoGetDirectory: (): Promise<string> =>
    ipcRenderer.invoke('photo:get-directory'),
  photoDeleteWorkingCopy: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('photo:delete-working-copy', filePath),
  photoGetThumbnail: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke('photo:get-thumbnail', filePath),
  photoRevertToOriginal: (workingPath: string): Promise<PhotoOpenResult> =>
    ipcRenderer.invoke('photo:revert-to-original', workingPath),

  // File System & Hub IPC
  revealInFolder: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('reveal-in-folder', filePath),
  getRecentFiles: (): Promise<RecentFileRecord[]> =>
    ipcRenderer.invoke('hub:get-recent-files'),
  onOpenFileRequested: (callback: (filePath: string) => void) => {
    const handler = (_event: IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on('solstice:open-file-path', handler);
    ipcRenderer.on('docs:open-file-path', handler);
    return () => {
      ipcRenderer.removeListener('solstice:open-file-path', handler);
      ipcRenderer.removeListener('docs:open-file-path', handler);
    };
  },
  removeRecentFile: (filePath: string, deleteFromDisk?: boolean): Promise<boolean> =>
    ipcRenderer.invoke('remove-recent-file', filePath, deleteFromDisk),
  deleteFile: (filePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-file', filePath),

  // Unsaved changes & dirty state
  docsConfirmUnsaved: (): Promise<'save' | 'dont-save' | 'cancel'> =>
    ipcRenderer.invoke('docs:confirm-unsaved'),
  docsSetDirty: (isDirty: boolean) => ipcRenderer.send('docs:set-dirty', isDirty),
  whiteboardSetDirty: (isDirty: boolean) => ipcRenderer.send('whiteboard:set-dirty', isDirty),
  onSaveAndCloseRequested: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('window:request-save-and-close', handler);
    ipcRenderer.on('docs:request-save-and-close', handler);
    ipcRenderer.on('whiteboard:request-save-and-close', handler);
    return () => {
      ipcRenderer.removeListener('window:request-save-and-close', handler);
      ipcRenderer.removeListener('docs:request-save-and-close', handler);
      ipcRenderer.removeListener('whiteboard:request-save-and-close', handler);
    };
  },
  openExternalUrl: (url: string): Promise<boolean> =>
    ipcRenderer.invoke('open-external-url', url),

  // Suite-Wide Font Asset Management
  getInstalledFonts: (): Promise<InstalledFont[]> =>
    ipcRenderer.invoke('fonts:get-installed'),
  downloadGoogleFont: (payload: {
    name: string;
    category: string;
  }): Promise<{ success: boolean; font?: InstalledFont; error?: string }> =>
    ipcRenderer.invoke('fonts:download-google-font', payload),
  importLocalFont: (): Promise<{
    success: boolean;
    font?: InstalledFont;
    canceled?: boolean;
    error?: string;
  }> => ipcRenderer.invoke('fonts:import-local'),
  deleteInstalledFont: (fontId: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('fonts:delete', fontId),
  onFontsUpdated: (callback: (fonts: InstalledFont[]) => void) => {
    const handler = (_event: IpcRendererEvent, fonts: InstalledFont[]) => callback(fonts);
    ipcRenderer.on('fonts:updated', handler);
    return () => {
      ipcRenderer.removeListener('fonts:updated', handler);
    };
  },
};

contextBridge.exposeInMainWorld('solsticeAPI', api);
