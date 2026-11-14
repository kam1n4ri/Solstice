import React from 'react';
import { Editor } from '@tiptap/react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
  submenu?: MenuItem[];
}

export interface DocsMenuBarProps {
  editor: Editor | null;
  title: string;
  onRenameFocus: () => void;
  onNewDocument: () => void;
  onOpenFile: () => void;
  onSaveDocument: () => void;
  onSaveAsDocument?: () => void;
  onExport: (format: 'docx' | 'pdf' | 'md' | 'html' | 'txt') => void;
  isPrintLayout: boolean;
  onToggleLayout: (target?: boolean) => void;
  onSetPrintLayout?: (isPrint: boolean) => void;
  showOutlineSidebar: boolean;
  onToggleOutlineSidebar: () => void;
  zoomLevel: number;
  onChangeZoom: (level: number) => void;
  onOpenFindReplace: () => void;
  onOpenWordCount: () => void;
  spellCheck: boolean;
  onToggleSpellCheck: () => void;
  onOpenLinkModal: () => void;
  onOpenImageModal: () => void;
}
