export interface PdfOpenResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  data?: Uint8Array | number[];
  fileSize?: number;
  pageCount?: number;
  error?: string;
}

export interface PdfSavePayload {
  filePath?: string;
  fileName?: string;
  title?: string;
  data: Uint8Array | number[] | string;
}

export interface PdfSaveResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export interface PdfReadResult {
  success: boolean;
  filePath: string;
  data?: Uint8Array | number[];
  fileSize?: number;
  error?: string;
}

export interface PdfSelectFilesResult {
  canceled: boolean;
  files: { filePath: string; fileName: string; fileSize: number }[];
}

export interface PdfMergeInputFile {
  filePath?: string;
  fileData?: Uint8Array | number[];
  fileName?: string;
}

export interface PdfMergePayload {
  filePaths?: string[];
  files?: PdfMergeInputFile[];
  outputPath?: string;
  defaultName?: string;
}

export interface PdfMergeResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  pageCount?: number;
  data?: Uint8Array | number[];
  error?: string;
}

export interface PdfSplitPayload {
  filePath?: string;
  fileData?: Uint8Array | number[];
  mode: 'ranges' | 'extract-all';
  ranges?: string;
  outputDir?: string;
  baseName?: string;
}

export interface PdfSplitResult {
  success: boolean;
  canceled?: boolean;
  outputPaths?: string[];
  outputFiles?: {
    filePath: string;
    fileName: string;
    pageCount: number;
    data?: Uint8Array | number[];
    fileSize?: number;
  }[];
  error?: string;
}

export interface PdfOrganizePageAction {
  fileIndex?: number;
  originalPageIndex: number;
  rotationDelta?: number;
}

export interface PdfOrganizePayload {
  filePath?: string;
  fileData?: Uint8Array | number[];
  files?: Array<{ filePath?: string; fileData?: Uint8Array | number[] }>;
  pageActions: PdfOrganizePageAction[];
  defaultName?: string;
  saveAsCopy?: boolean;
}

export interface PdfOrganizeResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  pageCount?: number;
  data?: Uint8Array | number[];
  error?: string;
}

export interface PdfConvertImageInput {
  filePath?: string;
  fileData?: Uint8Array | number[];
  fileName: string;
}

export interface PdfConvertImagesPayload {
  imagePaths?: string[];
  images?: PdfConvertImageInput[];
  fitToPage?: 'original' | 'a4-contain' | 'a4-cover';
  orientation?: 'portrait' | 'landscape' | 'auto';
  margin?: number;
  defaultName?: string;
  outputPath?: string;
}

export interface PdfConvertImagesResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  pageCount?: number;
  data?: Uint8Array | number[];
  error?: string;
}

export interface PdfExportImagesPayload {
  images: { pageNumber: number; dataUrl: string }[];
  baseName?: string;
}

export interface PdfExportImagesResult {
  success: boolean;
  canceled?: boolean;
  outputDir?: string;
  exportedFiles?: string[];
  error?: string;
}

export interface PdfWatermarkPayload {
  filePath?: string;
  fileData?: Uint8Array | number[];
  type?: 'text' | 'image';
  text?: string;
  fontSize?: number;
  opacity?: number;
  rotation?: number;
  colorHex?: string;
  imagePath?: string;
  imageData?: Uint8Array | number[];
  imageScale?: number;
  xPercent?: number;
  yPercent?: number;
  defaultName?: string;
  pagesScope?: 'all' | 'odd' | 'even' | 'range';
  customPages?: string;
  layer?: 'above' | 'below';
}

export interface PdfWatermarkResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  pageCount?: number;
  data?: Uint8Array | number[];
  error?: string;
}

export interface PdfPageNumberPayload {
  filePath?: string;
  fileData?: Uint8Array | number[];
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
  format: string;
  startOffset?: number;
  firstNumber?: number;
  fontSize?: number;
  margin?: number;
  colorHex?: string;
  fontFamily?: 'helvetica' | 'times' | 'courier';
  pagesScope?: 'all' | 'skip-first' | 'odd' | 'even' | 'range';
  customPages?: string;
  defaultName?: string;
}

export interface PdfPageNumberResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  pageCount?: number;
  data?: Uint8Array | number[];
  error?: string;
}

export interface PdfProtectPayload {
  filePath?: string;
  fileData?: Uint8Array | number[];
  password: string;
  defaultName?: string;
}

export interface PdfProtectResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export interface PdfUnlockPayload {
  filePath?: string;
  fileData?: Uint8Array | number[];
  password?: string;
  defaultName?: string;
}

export interface PdfUnlockResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  fileName?: string;
  data?: Uint8Array | number[];
  error?: string;
}
