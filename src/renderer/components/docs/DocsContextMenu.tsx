import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { MousePointer2 } from 'lucide-react';
import {
  DocsContextMenuItem,
  DocsContextMenuDivider,
} from './DocsContextMenuItem';
import {
  ContextMenuClipboardGroup,
  ContextMenuLinkGroup,
  ContextMenuFormatGroup,
} from './DocsContextMenuFormatting';
import {
  ContextMenuTableGroup,
  ContextMenuImageGroup,
  ContextMenuInsertGroup,
} from './DocsContextMenuBlocks';

export interface DocsContextMenuProps {
  editor: Editor | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onOpenLinkModal?: () => void;
  onOpenImageModal?: () => void;
}

export const DocsContextMenu: React.FC<DocsContextMenuProps> = ({
  editor,
  position,
  onClose,
  onOpenLinkModal,
  onOpenImageModal,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (!position) {
      setCoords(null);
      return;
    }
    const pad = 12;
    const menuWidth = menuRef.current?.offsetWidth || 230;
    const menuHeight = menuRef.current?.offsetHeight || 340;

    let x = position.x;
    let y = position.y;

    if (x + menuWidth > window.innerWidth - pad) {
      x = window.innerWidth - menuWidth - pad;
    }
    if (y + menuHeight > window.innerHeight - pad) {
      y = window.innerHeight - menuHeight - pad;
    }
    if (x < pad) x = pad;
    if (y < pad) y = pad;

    setCoords({ x, y });
  }, [position]);

  useEffect(() => {
    if (!position) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onClose);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', onClose);
    };
  }, [position, onClose]);

  if (!position || !editor) return null;

  const hasSelection = !editor.state.selection.empty;
  const isInTable = editor.isActive('table');
  const isInImage = editor.isActive('image');
  const isLink = editor.isActive('link');
  const currentLinkUrl = isLink ? (editor.getAttributes('link')?.href || '') : '';

  return (
    <div
      ref={menuRef}
      style={{
        top: coords ? `${coords.y}px` : `${position.y}px`,
        left: coords ? `${coords.x}px` : `${position.x}px`,
        visibility: coords ? 'visible' : 'hidden',
      }}
      className="fixed z-50 min-w-[210px] max-w-[250px] p-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl shadow-slate-900/10 text-xs text-slate-700 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <ContextMenuClipboardGroup
        editor={editor}
        hasSelection={hasSelection}
        onClose={onClose}
      />

      {isLink && (
        <ContextMenuLinkGroup
          editor={editor}
          currentLinkUrl={currentLinkUrl}
          onOpenLinkModal={onOpenLinkModal}
          onClose={onClose}
        />
      )}

      {isInTable && (
        <ContextMenuTableGroup
          editor={editor}
          onClose={onClose}
        />
      )}

      {isInImage && (
        <ContextMenuImageGroup
          editor={editor}
          onClose={onClose}
        />
      )}

      {!isInImage && (
        <ContextMenuFormatGroup
          editor={editor}
          onClose={onClose}
        />
      )}

      {!isInTable && !isInImage && (
        <ContextMenuInsertGroup
          editor={editor}
          isLink={isLink}
          onOpenLinkModal={onOpenLinkModal}
          onOpenImageModal={onOpenImageModal}
          onClose={onClose}
        />
      )}

      <DocsContextMenuDivider />
      <DocsContextMenuItem
        label="Select all"
        icon={<MousePointer2 className="h-3.5 w-3.5" />}
        shortcut="Ctrl+A"
        onClick={() => {
          editor.chain().focus().selectAll().run();
          onClose();
        }}
      />
    </div>
  );
};
