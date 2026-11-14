export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: string;
  startOffset: number;
  firstNumber: number;
  fontSize: number;
  margin: number;
  fontFamily: 'helvetica' | 'times' | 'courier';
  colorHex: string;
  pagesScope: 'all' | 'skip-first' | 'odd' | 'even' | 'range';
  customPages: string;
}

export interface PageNumberResultData {
  filePath: string;
  fileName: string;
  pageCount: number;
  fileSize: number;
  data: Uint8Array;
}

export const FORMAT_PRESETS = [
  { label: 'Page 1 of 10', format: 'Page {n} of {total}' },
  { label: '1 / 10', format: '{n} / {total}' },
  { label: '1', format: '{n}' },
  { label: '- 1 -', format: '- {n} -' },
  { label: 'Page 1', format: 'Page {n}' },
];

export const POSITION_GRID: { id: PageNumberPosition; label: string; align: string }[] = [
  { id: 'top-left', label: 'Top Left', align: 'Header Left' },
  { id: 'top-center', label: 'Top Center', align: 'Header Center' },
  { id: 'top-right', label: 'Top Right', align: 'Header Right' },
  { id: 'bottom-left', label: 'Bottom Left', align: 'Footer Left' },
  { id: 'bottom-center', label: 'Bottom Center', align: 'Footer Center' },
  { id: 'bottom-right', label: 'Bottom Right', align: 'Footer Right' },
];

export const PAGE_NUMBER_COLORS = [
  { name: 'Charcoal', hex: '#334155' },
  { name: 'Slate Gray', hex: '#64748b' },
  { name: 'Dark Lead', hex: '#0f172a' },
  { name: 'Navy', hex: '#0369a1' },
  { name: 'Pale Crimson', hex: '#be123c' },
  { name: 'Amber', hex: '#b45309' },
];

export const FONT_OPTIONS: { id: 'helvetica' | 'times' | 'courier'; label: string; family: string }[] = [
  { id: 'helvetica', label: 'Sans-Serif', family: 'sans-serif' },
  { id: 'times', label: 'Serif', family: 'serif' },
  { id: 'courier', label: 'Monospace', family: 'monospace' },
];
