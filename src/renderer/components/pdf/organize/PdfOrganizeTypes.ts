export interface OrganizeFile {
  id: string;
  name: string;
  filePath?: string;
  fileData: Uint8Array;
  pageCount: number;
  prefix: string; // 'A', 'B', 'C', etc.
}

export interface OrganizePage {
  id: string;
  fileId: string;
  fileIndex: number;
  originalPageIndex: number; // 0-indexed in source file
  rotation: number; // 0, 90, 180, 270
  filePrefix: string;
}

export interface DragState {
  draggedPageId: string | null;
  draggedIndex: number | null;
  dropTargetIndex: number | null;
  dropPosition: 'before' | 'after' | null;
}

export type OrganizeCardSize = 'small' | 'medium' | 'large';
