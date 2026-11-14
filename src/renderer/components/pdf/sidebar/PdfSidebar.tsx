import React, { useState, useCallback } from 'react';
import { LayoutGrid, ListTree, BookmarkX } from 'lucide-react';
import { PDFDocumentProxy, PDFPageProxy } from '../pdfjsSetup';
import { PdfThumbnailItem } from './PdfThumbnailItem';
import { PdfOutlineItem, OutlineNode } from './PdfOutlineItem';

interface PdfSidebarProps {
  width: number;
  onResize: (newWidth: number) => void;
  numPages: number;
  currentPage: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  doc: PDFDocumentProxy | null;
  outline: OutlineNode[] | null;
  onJumpToPage: (pageNumber: number) => void;
}

const PdfSidebarComponent: React.FC<PdfSidebarProps> = ({
  width,
  onResize,
  numPages,
  currentPage,
  getPage,
  doc,
  outline,
  onJumpToPage,
}) => {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'outline'>('thumbnails');

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);
  const thumbnailWidth = Math.max(90, Math.min(320, width - 36));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        // Range: 150px to 380px
        const nextWidth = Math.max(150, Math.min(380, startWidth + delta));
        onResize(nextWidth);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [width, onResize]
  );

  return (
    <aside
      style={{ width: `${width}px` }}
      className="h-full border-r border-stone-200/90 bg-[#fafbfc] flex flex-col shrink-0 z-10 relative select-none"
    >
      {/* 1. Header & Tab Switcher */}
      <div className="p-2.5 border-b border-stone-200/80 flex items-center shrink-0">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/60 border border-stone-200/80 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('thumbnails')}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'thumbnails'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Pages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outline')}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'outline'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Outline</span>
          </button>
        </div>
      </div>

      {/* 2. Content Body */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {activeTab === 'thumbnails' ? (
          /* Thumbnails Grid */
          <div className="flex flex-col gap-4 items-center">
            {pageNumbers.map((pageNum) => (
              <PdfThumbnailItem
                key={pageNum}
                pageNumber={pageNum}
                getPage={getPage}
                isSelected={pageNum === currentPage}
                onSelect={(p) => onJumpToPage(p)}
                previewWidth={thumbnailWidth}
              />
            ))}
          </div>
        ) : (
          /* Outline Bookmarks Tree */
          <div>
            {!outline || outline.length === 0 || !doc ? (
              <div className="p-6 text-center flex flex-col items-center justify-center text-slate-400">
                <BookmarkX className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-xs font-medium text-slate-500">No bookmarks found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This document does not contain an embedded table of contents.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {outline.map((item, idx) => (
                  <PdfOutlineItem
                    key={`${item.title}-${idx}`}
                    item={item}
                    doc={doc}
                    onJumpToPage={onJumpToPage}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Draggable resize border & bottom corner grip */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-3 h-full cursor-col-resize z-20 group flex flex-col justify-end items-end p-1 select-none"
        title="Drag edge or corner to resize preview"
      >
        <div className="w-[2px] h-full bg-transparent group-hover:bg-slate-300/80 group-active:bg-slate-400/80 transition-colors" />

        {/* Diagonal corner grip dots in the bottom right corner */}
        <div className="absolute bottom-1.5 right-1 flex flex-col gap-0.5 opacity-35 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="flex gap-0.5 justify-end">
            <span className="w-1 h-1 rounded-full bg-slate-400" />
          </div>
          <div className="flex gap-0.5 justify-end">
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span className="w-1 h-1 rounded-full bg-slate-400" />
          </div>
          <div className="flex gap-0.5 justify-end">
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span className="w-1 h-1 rounded-full bg-slate-400" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export const PdfSidebar = React.memo(PdfSidebarComponent);
