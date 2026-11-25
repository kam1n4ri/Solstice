export interface WatermarkOptions {
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  colorHex: string;
  imagePath?: string;
  imageData?: Uint8Array;
  imageDataUrl?: string;
  imageFileName?: string;
  imageScale: number; // 0.1 to 1.0, e.g. 0.4
  xPercent: number; // 0 to 100, default 50
  yPercent: number; // 0 to 100, default 50
  pagesScope: 'all' | 'odd' | 'even' | 'range';
  customPages: string;
}

export interface WatermarkResultData {
  filePath: string;
  fileName: string;
  pageCount: number;
  fileSize: number;
  data: Uint8Array;
}

export const WATERMARK_PRESETS = [
  'CONFIDENTIAL',
  'DRAFT',
  'DO NOT COPY',
  'SAMPLE',
  'APPROVED',
  'ORIGINAL',
];

export const SNAP_ANGLES = [-90, -45, 0, 45, 90, 180];

export const WATERMARK_COLORS = [
  { name: 'Slate Gray', hex: '#64748b' },
  { name: 'Pale Rose', hex: '#e11d48' },
  { name: 'Pale Sky', hex: '#0284c7' },
  { name: 'Pale Teal', hex: '#0d9488' },
  { name: 'Pale Indigo', hex: '#4f46e5' },
  { name: 'Pale Amber', hex: '#d97706' },
  { name: 'Charcoal', hex: '#334155' },
];
