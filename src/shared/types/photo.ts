export interface PhotoOpenResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  dataUrl?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  canceled?: boolean;
  error?: string;
}

export interface PhotoSavePayload {
  filePath?: string;
  fileName?: string;
  title?: string;
  dataUrl: string;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
}

export interface PhotoSaveResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  canceled?: boolean;
  error?: string;
}

export interface PhotoLayer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape';
  visible: boolean;
  opacity: number;
  dataUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export type PhotoToolType =
  | 'crop'
  | 'adjust'
  | 'cutout'
  | 'erase'
  | 'fit'
  | 'filters'
  | 'text'
  | 'draw'
  | 'upscale';
