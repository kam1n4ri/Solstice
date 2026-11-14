export const DEFAULT_WHITEBOARD_TITLE = 'Untitled whiteboard';
export const WHITEBOARD_RECENT_STORAGE_KEY = 'solstice_recent_whiteboards';

export interface WhiteboardInitialData {
  title: string;
  content?: string;
  filePath?: string | null;
  boardId?: string;
  templateId?: string;
}

export interface WhiteboardTemplate {
  id: string;
  title: string;
  tagline: string;
  icon?: any;
}
