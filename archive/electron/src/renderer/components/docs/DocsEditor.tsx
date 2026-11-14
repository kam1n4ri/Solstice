import React, { useEffect, useState, useRef } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocsImageBubbleMenu } from './DocsImageBubbleMenu';
import { DocsTableToolbar } from './DocsTableToolbar';
import { DocsContextMenu } from './DocsContextMenu';
import { DocsPageSheetsBackground } from './DocsPageSheetsBackground';
import { DocsPageBreakSpacers } from './DocsPageBreakSpacers';
import { usePagePagination } from './usePagePagination';
import {
  A4_PAGE_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  PAGE_GAP_PX,
} from './paginationConstants';

interface DocsEditorProps {
  editor: Editor | null;
  isPrintLayout: boolean;
  wordCount: number;
  characterCount: number;
  zoomLevel: number;
  spellCheck: boolean;
  showLiveWordCount: boolean;
  onOpenLinkModal?: () => void;
  onOpenImageModal?: () => void;
}

export const DocsEditor: React.FC<DocsEditorProps> = ({
  editor,
  isPrintLayout,
  wordCount,
  characterCount,
  zoomLevel,
  spellCheck,
  showLiveWordCount,
  onOpenLinkModal,
  onOpenImageModal,
}) => {
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const scale = (zoomLevel || 100) / 100;

  // Dynamic A4-calibrated discrete page pagination
  const { totalPages, currentPage } = usePagePagination(
    editor,
    pageContainerRef,
    scrollContainerRef,
    isPrintLayout,
    zoomLevel
  );

  useEffect(() => {
    if (editor?.view?.dom) {
      editor.view.dom.setAttribute('spellcheck', String(spellCheck));
    }
  }, [editor, spellCheck]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href') || anchor.href;
      if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
        e.preventDefault();
        window.solsticeAPI?.openExternalUrl?.(href);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!editor) return;

    // Safely map cursor position using CSS transform coordinates
    try {
      const img = (e.target as HTMLElement).closest('img');
      if (img) {
        let nodePos: number | null = null;
        try {
          nodePos = editor.view.posAtDOM(img, 0);
        } catch {
          if (img.parentElement) {
            const index = Array.from(img.parentElement.children).indexOf(img);
            nodePos = editor.view.posAtDOM(img.parentElement, index);
          }
        }

        if (typeof nodePos === 'number' && nodePos >= 0) {
          if (editor.state.doc.nodeAt(nodePos)?.type.name === 'image') {
            editor.commands.setNodeSelection(nodePos);
          } else if (nodePos > 0 && editor.state.doc.nodeAt(nodePos - 1)?.type.name === 'image') {
            editor.commands.setNodeSelection(nodePos - 1);
          }
        }
      } else {
        const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
        if (pos && editor.state.selection.empty) {
          editor.commands.setTextSelection(pos.pos);
        }
      }
    } catch {
      // Graceful fallback if clicked outside editor bounds
    }

    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="DocsEditor-wrapper flex-1 flex flex-col h-full relative overflow-hidden bg-[#f8fafd] print:h-auto print:overflow-visible print:p-0 print:bg-white print:static">
      {/* Floating Contextual Table Toolbar pinned at top of document */}
      <DocsTableToolbar editor={editor} />

      <div
        ref={scrollContainerRef}
        onClick={handleContainerClick}
        onContextMenu={handleContextMenu}
        className="DocsEditor-scroll flex-1 flex flex-col h-full overflow-auto transition-colors select-text relative bg-[#f8fafd] print:h-auto print:overflow-visible print:p-0 print:bg-white print:static"
      >
        {/* Editor Center Container with standard A4 desktop page width (794px) */}
        <div
          className="DocsEditor-center flex-1 flex justify-center py-6 px-4 print:p-0 print:m-0 print:h-auto print:w-full print:block"
          style={{
            minWidth: isPrintLayout ? `${Math.round(A4_PAGE_WIDTH_PX * scale + 32)}px` : undefined,
          }}
        >
          {/* Zoom Wrapper applying standard CSS transform instead of deprecated CSS zoom */}
          <div
            className="DocsEditor-zoom-wrapper origin-top transition-transform duration-150 flex flex-col items-center relative print:transform-none"
            style={{
              transform: scale !== 1 ? `scale(${scale})` : undefined,
              transformOrigin: 'top center',
              width: isPrintLayout ? `${A4_PAGE_WIDTH_PX}px` : '100%',
              maxWidth: isPrintLayout ? `${A4_PAGE_WIDTH_PX}px` : undefined,
              marginBottom: scale > 1 ? `calc((${scale} - 1) * 300px)` : undefined,
            }}
          >
            {/* Background Physical A4 Sheets in Print Layout */}
            {isPrintLayout && (
              <DocsPageSheetsBackground totalPages={totalPages} />
            )}

            <div
              ref={pageContainerRef}
              style={{
                minHeight: isPrintLayout
                  ? `${totalPages * A4_PAGE_HEIGHT_PX + (totalPages - 1) * PAGE_GAP_PX}px`
                  : undefined,
              }}
              className={cn(
                'DocsEditor-paper w-full transition-all duration-200 outline-none text-slate-900 print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-none print:min-h-0 print:h-auto print:static relative z-10',
                isPrintLayout
                  ? 'w-[794px] max-w-[794px] px-[68px] pt-[76px] pb-[76px] bg-transparent'
                  : 'max-w-5xl px-8 py-8 min-h-full border-x border-[#e3e6e6] bg-white shadow-xs'
              )}
            >
              {isPrintLayout && (
                <DocsPageBreakSpacers totalPages={totalPages} />
              )}
              {editor && <DocsImageBubbleMenu editor={editor} />}
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Context Menu */}
      <DocsContextMenu
        editor={editor}
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        onOpenLinkModal={onOpenLinkModal}
        onOpenImageModal={onOpenImageModal}
      />

      {/* Floating unobtrusive statistics pill (leaves canvas open and fluid) */}
      {showLiveWordCount && (
        <div className="fixed bottom-4 left-6 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-xs text-[11px] text-slate-500 font-sans select-none print:hidden">
          {isPrintLayout && (
            <>
              <span className="font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <span className="text-slate-300">•</span>
            </>
          )}
          <span className="flex items-center gap-1.5">
            <Type className="h-3 w-3 text-slate-400" />
            <span>{wordCount} words</span>
          </span>
          <span className="text-slate-300">•</span>
          <span>{characterCount} chars</span>
          <span className="text-slate-300">•</span>
          <span>~{readingTime} min</span>
        </div>
      )}
    </div>
  );
};
