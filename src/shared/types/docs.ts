export interface DocsOpenResult {
  success: boolean;
  canceled?: boolean;
  title?: string;
  content?: string;
  filePath?: string;
  format?: string;
  error?: string;
}

export interface DocsSavePayload {
  filePath?: string;
  title: string;
  content: string;
  format?: 'html' | 'md' | 'txt' | 'docx';
  isSaveAs?: boolean;
}

export interface DocsSaveResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  title?: string;
  error?: string;
}

export interface DocsAutoSavePayload {
  filePath?: string | null;
  draftId?: string;
  title: string;
  content: string;
}

export interface DocsAutoSaveResult {
  success: boolean;
  filePath?: string;
  draftId?: string;
  error?: string;
}

export interface DocsExportPayload {
  format: 'pdf' | 'docx' | 'md' | 'html' | 'txt';
  title: string;
  content: string;
  htmlContent: string;
}

export interface DocsExportResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  error?: string;
}
