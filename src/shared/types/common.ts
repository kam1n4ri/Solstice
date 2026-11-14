export type ToolId =
  | 'docs'
  | 'sheets'
  | 'slides'
  | 'whiteboard'
  | 'video'
  | 'audio'
  | 'photo'
  | 'pdf';

export type ToolCategory = 'all' | 'productivity' | 'media' | 'utility';

export type NavSection = 'home' | 'files' | 'updates';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  tagline: string;
  description: string;
  category: ToolCategory;
  categoryLabel: string;
  version: string;
  iconName: string;
  iconBgClass: string;
  iconColorClass: string;
  accentColor: string;
}

export interface WindowOpenResult {
  success: boolean;
  toolId: ToolId;
  alreadyOpen?: boolean;
  windowId?: number;
  error?: string;
}

export interface WindowStateInfo {
  toolId: ToolId;
  isOpen: boolean;
  isFocused: boolean;
}

export interface RecentFileRecord {
  filePath: string;
  fileName: string;
  tool: ToolId;
  lastModified: number;
  fileSize?: number;
}
