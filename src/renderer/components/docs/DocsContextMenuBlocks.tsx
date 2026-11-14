import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Rows,
  Columns,
  Trash2,
  Table as TableIcon,
  Image as ImageIcon,
  Minus,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import {
  DocsContextMenuItem,
  DocsContextMenuDivider,
  DocsContextMenuSection,
} from './DocsContextMenuItem';

export const ContextMenuTableGroup: React.FC<{
  editor: Editor;
  onClose: () => void;
}> = ({ editor, onClose }) => (
  <>
    <DocsContextMenuDivider />
    <DocsContextMenuSection title="Table" />
    <DocsContextMenuItem
      label="Insert row above"
      icon={<Rows className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().addRowBefore().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Insert row below"
      icon={<Rows className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().addRowAfter().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Insert column left"
      icon={<Columns className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().addColumnBefore().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Insert column right"
      icon={<Columns className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().addColumnAfter().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Delete row"
      icon={<Trash2 className="h-3.5 w-3.5" />}
      isDestructive
      onClick={() => {
        editor.chain().focus().deleteRow().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Delete column"
      icon={<Trash2 className="h-3.5 w-3.5" />}
      isDestructive
      onClick={() => {
        editor.chain().focus().deleteColumn().run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Delete table"
      icon={<Trash2 className="h-3.5 w-3.5" />}
      isDestructive
      onClick={() => {
        editor.chain().focus().deleteTable().run();
        onClose();
      }}
    />
  </>
);

export const ContextMenuImageGroup: React.FC<{
  editor: Editor;
  onClose: () => void;
}> = ({ editor, onClose }) => (
  <>
    <DocsContextMenuDivider />
    <DocsContextMenuSection title="Image Alignment" />
    <DocsContextMenuItem
      label="Align left"
      icon={<AlignLeft className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().updateAttributes('image', { alignment: 'left' }).run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Align center"
      icon={<AlignCenter className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().updateAttributes('image', { alignment: 'center' }).run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Align right"
      icon={<AlignRight className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().updateAttributes('image', { alignment: 'right' }).run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Delete image"
      icon={<Trash2 className="h-3.5 w-3.5" />}
      isDestructive
      onClick={() => {
        editor.chain().focus().deleteSelection().run();
        onClose();
      }}
    />
  </>
);

export const ContextMenuInsertGroup: React.FC<{
  editor: Editor;
  isLink: boolean;
  onOpenLinkModal?: () => void;
  onOpenImageModal?: () => void;
  onClose: () => void;
}> = ({ editor, isLink, onOpenLinkModal, onOpenImageModal, onClose }) => (
  <>
    <DocsContextMenuDivider />
    <DocsContextMenuSection title="Insert" />
    {!isLink && (
      <DocsContextMenuItem
        label="Link..."
        icon={<Link2 className="h-3.5 w-3.5" />}
        shortcut="Ctrl+K"
        onClick={() => {
          onOpenLinkModal?.();
          onClose();
        }}
      />
    )}
    <DocsContextMenuItem
      label="Table (3x3)"
      icon={<TableIcon className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Image..."
      icon={<ImageIcon className="h-3.5 w-3.5" />}
      onClick={() => {
        onOpenImageModal?.();
        onClose();
      }}
    />
    <DocsContextMenuItem
      label="Horizontal line"
      icon={<Minus className="h-3.5 w-3.5" />}
      onClick={() => {
        editor.chain().focus().setHorizontalRule().run();
        onClose();
      }}
    />
  </>
);
