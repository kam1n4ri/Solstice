export interface WhiteboardOpenResult {
  success: boolean;
  canceled?: boolean;
  title?: string;
  content?: string;
  filePath?: string;
  error?: string;
}

export interface WhiteboardSavePayload {
  filePath?: string;
  title: string;
  content: string;
}

export interface WhiteboardSaveResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  title?: string;
  error?: string;
}

export interface WhiteboardAutoSavePayload {
  filePath?: string | null;
  title: string;
  content: string;
  draftId?: string;
}

export interface WhiteboardAutoSaveResult {
  success: boolean;
  filePath: string;
  title: string;
  lastSaved: number;
  error?: string;
}

export interface WhiteboardExportPayload {
  defaultName?: string;
  format: 'png' | 'svg' | 'json';
  data: string;
}

export interface WhiteboardExportResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  error?: string;
}
