import {
  ToolId,
  WindowOpenResult,
  WindowStateInfo,
  RecentFileRecord,
} from './common';
import {
  DocsOpenResult,
  DocsSavePayload,
  DocsSaveResult,
  DocsAutoSavePayload,
  DocsAutoSaveResult,
  DocsExportPayload,
  DocsExportResult,
} from './docs';
import {
  WhiteboardOpenResult,
  WhiteboardSavePayload,
  WhiteboardSaveResult,
  WhiteboardAutoSavePayload,
  WhiteboardAutoSaveResult,
  WhiteboardExportPayload,
  WhiteboardExportResult,
} from './whiteboard';
import {
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
} from './pdf';
import { InstalledFont } from './fonts';

export interface SolsticeAPI {
  openToolWindow: (toolId: ToolId, initialPath?: string) => Promise<WindowOpenResult>;
  getActiveTools: () => Promise<ToolId[]>;
  onToolWindowStateChanged: (callback: (state: WindowStateInfo) => void) => () => void;
  getAppVersion: () => Promise<string>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: (force?: boolean) => void;
  cancelClose?: () => void;

  // Native Docs File IPC
  docsOpenFile: (filePath?: string) => Promise<DocsOpenResult>;
  docsSaveFile: (payload: DocsSavePayload) => Promise<DocsSaveResult>;
  docsAutoSave?: (payload: DocsAutoSavePayload) => Promise<DocsAutoSaveResult>;
  docsExportFile: (payload: DocsExportPayload) => Promise<DocsExportResult>;
  revealInFolder?: (filePath: string) => Promise<boolean>;
  getDraftsPath?: () => Promise<string>;

  // Native Whiteboard File IPC
  whiteboardOpenFile?: (filePath?: string) => Promise<WhiteboardOpenResult>;
  whiteboardSaveFile?: (payload: WhiteboardSavePayload) => Promise<WhiteboardSaveResult>;
  whiteboardAutoSave?: (payload: WhiteboardAutoSavePayload) => Promise<WhiteboardAutoSaveResult>;
  whiteboardExportFile?: (payload: WhiteboardExportPayload) => Promise<WhiteboardExportResult>;
  getWhiteboardDraftsPath?: () => Promise<string>;

  // Native PDF File & Offline Tools IPC
  pdfOpenFile?: (filePath?: string) => Promise<PdfOpenResult>;
  pdfSaveFile?: (payload: PdfSavePayload) => Promise<PdfSaveResult>;
  pdfReadFile?: (filePath: string) => Promise<PdfReadResult>;
  pdfCreateWorkingCopy?: (payload: {
    sourcePath?: string;
    data?: Uint8Array | number[];
    fileName?: string;
  }) => Promise<PdfOpenResult>;
  pdfRenameFile?: (payload: {
    oldPath: string;
    newTitle: string;
  }) => Promise<{ success: boolean; newPath?: string; newFileName?: string; error?: string }>;
  pdfExportFile?: (payload: {
    data: Uint8Array | number[] | string;
    defaultName?: string;
  }) => Promise<PdfSaveResult>;
  pdfPrint?: () => Promise<{ success: boolean; error?: string }>;
  getPdfDirectory?: () => Promise<string>;
  pdfSelectFiles?: (options?: { multiple?: boolean; title?: string }) => Promise<PdfSelectFilesResult>;
  pdfSelectImages?: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  pdfMerge?: (payload: PdfMergePayload) => Promise<PdfMergeResult>;
  pdfSplit?: (payload: PdfSplitPayload) => Promise<PdfSplitResult>;
  pdfSaveFilesToFolder?: (payload: {
    files: { fileName: string; data: Uint8Array | number[] }[];
  }) => Promise<{ success: boolean; canceled?: boolean; folderPath?: string; error?: string }>;
  pdfOrganize?: (payload: PdfOrganizePayload) => Promise<PdfOrganizeResult>;
  pdfConvertImages?: (payload: PdfConvertImagesPayload) => Promise<PdfConvertImagesResult>;
  pdfExportImages?: (payload: PdfExportImagesPayload) => Promise<PdfExportImagesResult>;
  pdfWatermark?: (payload: PdfWatermarkPayload) => Promise<PdfWatermarkResult>;
  pdfPageNumbers?: (payload: PdfPageNumberPayload) => Promise<PdfPageNumberResult>;
  pdfProtect?: (payload: PdfProtectPayload) => Promise<PdfProtectResult>;
  pdfUnlock?: (payload: PdfUnlockPayload) => Promise<PdfUnlockResult>;

  // Hub Recent Files & Disk Management IPC
  getRecentFiles: () => Promise<RecentFileRecord[]>;
  onOpenFileRequested?: (callback: (filePath: string) => void) => () => void;
  removeRecentFile?: (filePath: string, deleteFromDisk?: boolean) => Promise<boolean>;
  deleteFile?: (filePath: string) => Promise<{ success: boolean; error?: string }>;

  // Unsaved changes & dirty state
  docsConfirmUnsaved?: () => Promise<'save' | 'dont-save' | 'cancel'>;
  docsSetDirty?: (isDirty: boolean) => void;
  whiteboardSetDirty?: (isDirty: boolean) => void;
  onSaveAndCloseRequested?: (callback: () => void) => () => void;

  // External browser navigation
  openExternalUrl?: (url: string) => Promise<boolean>;

  // Suite-Wide Font Asset Management
  getInstalledFonts?: () => Promise<InstalledFont[]>;
  downloadGoogleFont?: (payload: {
    name: string;
    category: string;
  }) => Promise<{ success: boolean; font?: InstalledFont; error?: string }>;
  importLocalFont?: () => Promise<{
    success: boolean;
    font?: InstalledFont;
    canceled?: boolean;
    error?: string;
  }>;
  deleteInstalledFont?: (fontId: string) => Promise<{ success: boolean; error?: string }>;
  onFontsUpdated?: (callback: (fonts: InstalledFont[]) => void) => () => void;
}

declare global {
  interface Window {
    solsticeAPI?: SolsticeAPI;
  }
}
