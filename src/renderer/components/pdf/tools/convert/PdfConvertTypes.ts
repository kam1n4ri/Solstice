export interface ImageItem {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  previewUrl?: string;
}

export interface RenderedPageImage {
  pageNumber: number;
  dataUrl: string;
  fileName: string;
}

export type FitMode = 'a4-contain' | 'original' | 'a4-cover';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface ConvertResultData {
  filePath: string;
  fileName: string;
  pageCount: number;
  fileSize?: number;
  data: Uint8Array;
}

export interface ExportImagesResultData {
  folderPath?: string;
  images: RenderedPageImage[];
  baseName: string;
}
