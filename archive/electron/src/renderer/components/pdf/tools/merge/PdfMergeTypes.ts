export interface MergeFileItem {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  pageCount?: number;
}

export interface MergeResultData {
  filePath: string;
  fileName: string;
  pageCount: number;
  fileSize: number;
  data: Uint8Array;
}
