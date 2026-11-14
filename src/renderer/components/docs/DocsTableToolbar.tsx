import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Table as TableIcon,
  Rows,
  Columns,
  Plus,
  Trash2,
  Combine,
  Split,
  PanelTop,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocsTableToolbarProps {
  editor: Editor | null;
}

export const DocsTableToolbar: React.FC<DocsTableToolbarProps> = ({ editor }) => {
  const [isTableActive, setIsTableActive] = useState(false);
  const [canMerge, setCanMerge] = useState(false);
  const [canSplit, setCanSplit] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updateTableState = useCallback(() => {
    if (!editor || !editor.isActive('table')) {
      setIsTableActive(false);
      setPosition(null);
      return;
    }

    setCanMerge(Boolean(editor.can().mergeCells()));
    setCanSplit(Boolean(editor.can().splitCell()));

    try {
      const { from } = editor.state.selection;
      const dom = editor.view.domAtPos(from);
      const targetEl = dom.node instanceof HTMLElement ? dom.node : dom.node.parentElement;
      const tableEl = targetEl?.closest('table');

      if (!tableEl) {
        setIsTableActive(false);
        setPosition(null);
        return;
      }

      const rect = tableEl.getBoundingClientRect();
      const toolbarHeight = 44;
      const idealTop = rect.top - toolbarHeight - 6;
      const minTop = 108; // Clear main header and formatting toolbar
      const maxTop = rect.bottom - toolbarHeight;

      if (rect.bottom < minTop) {
        setIsTableActive(false);
        return;
      }

      const clampedTop = Math.max(minTop, Math.min(idealTop, maxTop));
      const left = rect.left + rect.width / 2;

      setPosition({ top: clampedTop, left });
      setIsTableActive(true);
    } catch {
      setIsTableActive(true);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    updateTableState();

    editor.on('selectionUpdate', updateTableState);
    editor.on('transaction', updateTableState);
    window.addEventListener('scroll', updateTableState, true);
    window.addEventListener('resize', updateTableState);

    return () => {
      editor.off('selectionUpdate', updateTableState);
      editor.off('transaction', updateTableState);
      window.removeEventListener('scroll', updateTableState, true);
      window.removeEventListener('resize', updateTableState);
    };
  }, [editor, updateTableState]);

  if (!editor) return null;

  return (
    <div
      aria-hidden={!isTableActive}
      style={{
        position: 'fixed',
        top: position ? `${position.top}px` : undefined,
        left: position ? `${position.left}px` : undefined,
        transform: 'translateX(-50%)',
      }}
      className={cn(
        'z-30 transition-all duration-150 pointer-events-none print:hidden select-none',
        isTableActive && position
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-95 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md text-xs text-slate-700 max-w-[calc(100vw-32px)] overflow-x-auto">
        {/* Table Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-700/85 text-[11px] font-medium mr-0.5 shrink-0 select-none">
          <TableIcon className="h-3 w-3 text-blue-600/80" />
          <span>Table</span>
        </div>

        <div className="h-3.5 w-px bg-slate-200 mx-1 shrink-0" />

        {/* Row Operations */}
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 pl-1 pr-1.5">
            <Rows className="h-3 w-3 text-slate-400" />
            <span className="hidden sm:inline">Row</span>
          </span>
          {/* Row Buttons */}
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row above" className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer text-[11px]"><Plus className="h-3 w-3" /><span>Above</span></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below" className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer text-[11px]"><Plus className="h-3 w-3" /><span>Below</span></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()} title="Delete current row" className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"><Trash2 className="h-3 w-3" /></button>
        </div>

        <div className="h-3.5 w-px bg-slate-200 mx-1 shrink-0" />

        {/* Column Operations */}
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 pl-1 pr-1.5">
            <Columns className="h-3 w-3 text-slate-400" />
            <span className="hidden sm:inline">Col</span>
          </span>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column left" className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer text-[11px]"><Plus className="h-3 w-3" /><span>Left</span></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column right" className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer text-[11px]"><Plus className="h-3 w-3" /><span>Right</span></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete current column" className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"><Trash2 className="h-3 w-3" /></button>
        </div>

        <div className="h-3.5 w-px bg-slate-200 mx-1 shrink-0" />

        {/* Cell Merge / Split / Header */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            disabled={!canMerge}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().mergeCells().run()}
            title="Merge selected cells"
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              canMerge
                ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                : 'text-slate-300 pointer-events-none'
            )}
          >
            <Combine className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canSplit}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().splitCell().run()}
            title="Split cell"
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              canSplit
                ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                : 'text-slate-300 pointer-events-none'
            )}
          >
            <Split className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            title="Toggle header row"
            className="p-1.5 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <PanelTop className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-3.5 w-px bg-slate-200 mx-1 shrink-0" />

        {/* Delete Entire Table */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteTable().run()}
          title="Delete entire table"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer text-[11px] shrink-0"
        >
          <Trash2 className="h-3 w-3" />
          <span className="hidden sm:inline">Delete Table</span>
        </button>
      </div>
    </div>
  );
};
