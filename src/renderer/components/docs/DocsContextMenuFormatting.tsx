import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Scissors,
  Copy,
  Clipboard,
  ClipboardList,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RemoveFormatting,
  Link2,
  ExternalLink,
  Unlink,
} from 'lucide-react';
import {
  DocsContextMenuItem,
  DocsContextMenuDivider,
  DocsContextMenuSection,
} from './DocsContextMenuItem';
import { cutSelection, copySelection, pasteClipboard } from './docsClipboardHelper';

export const ContextMenuClipboardGroup: React.FC<{
  editor: Editor;
  hasSelection: boolean;
  onClose: () => void;
}> = ({ editor, hasSelection, onClose }) => {
  const handleCut = async () => {
    await cutSelection(editor);
    onClose();
  };

  const handleCopy = async () => {
    await copySelection(editor);
    onClose();
  };

  const handlePaste = async () => {
    await pasteClipboard(editor, false);
    onClose();
  };

  const handlePastePlain = async () => {
    await pasteClipboard(editor, true);
    onClose();
  };

  return (
    <>
      <DocsContextMenuItem
        label="Cut"
        icon={<Scissors className="h-3.5 w-3.5" />}
        shortcut="Ctrl+X"
        disabled={!hasSelection}
        onClick={handleCut}
      />
      <DocsContextMenuItem
        label="Copy"
        icon={<Copy className="h-3.5 w-3.5" />}
        shortcut="Ctrl+C"
        disabled={!hasSelection}
        onClick={handleCopy}
      />
      <DocsContextMenuItem
        label="Paste"
        icon={<Clipboard className="h-3.5 w-3.5" />}
        shortcut="Ctrl+V"
        onClick={handlePaste}
      />
      <DocsContextMenuItem
        label="Paste plain text"
        icon={<ClipboardList className="h-3.5 w-3.5" />}
        shortcut="Ctrl+Shift+V"
        onClick={handlePastePlain}
      />
    </>
  );
};

export const ContextMenuLinkGroup: React.FC<{
  editor: Editor;
  currentLinkUrl: string;
  onOpenLinkModal?: () => void;
  onClose: () => void;
}> = ({ editor, currentLinkUrl, onOpenLinkModal, onClose }) => (
  <>
    <DocsContextMenuDivider />
    <DocsContextMenuSection title="Link" />
    <DocsContextMenuItem
      label="Open link in browser"
      icon={<ExternalLink className="h-3.5 w-3.5" />}
      onClick={() => {
        window.solsticeAPI?.openExternalUrl?.(currentLinkUrl);
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Edit link..."
      icon={<Link2 className="h-3.5 w-3.5" />}
      onClick={() => {
        onOpenLinkModal?.();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Remove link"
      icon={<Unlink className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().unsetLink().run();
        onClose();
      }}
    />
  </>
);

export const ContextMenuFormatGroup: React.FC<{
  editor: Editor;
  onClose: () => void;
}> = ({ editor, onClose }) => (
  <>
    <DocsContextMenuDivider />
    <DocsContextMenuSection title="Format" />
    <DocsContextMenuItem
      label="Bold"
      icon={<Bold className="h-3.5 w-3.5" />}
      shortcut="Ctrl+B"
      checked={editor.isActive('bold')}
      onClick={() => {
        editor.chain().focus().toggleBold().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Italic"
      icon={<Italic className="h-3.5 w-3.5" />}
      shortcut="Ctrl+I"
      checked={editor.isActive('italic')}
      onClick={() => {
        editor.chain().focus().toggleItalic().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Underline"
      icon={<Underline className="h-3.5 w-3.5" />}
      shortcut="Ctrl+U"
      checked={editor.isActive('underline')}
      onClick={() => {
        editor.chain().focus().toggleUnderline().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Strikethrough"
      icon={<Strikethrough className="h-3.5 w-3.5" />}
      checked={editor.isActive('strike')}
      onClick={() => {
        editor.chain().focus().toggleStrike().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Clear formatting"
      icon={<RemoveFormatting className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().unsetAllMarks().clearNodes().run();
        onClose();
      }}
    />
  </>
);
