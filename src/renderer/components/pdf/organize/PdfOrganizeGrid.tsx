import React, { useState } from 'react';
import { OrganizePage, DragState, OrganizeCardSize } from './PdfOrganizeTypes';
import { PdfOrganizeCard } from './PdfOrganizeCard';
import { PdfOrganizeControls } from './PdfOrganizeControls';
import { PDFDocumentProxy } from '../pdfjsSetup';

interface PdfOrganizeGridProps {
  pages: OrganizePage[];
  docProxies: Map<string, PDFDocumentProxy | null>;
  onReorderPages: (fromIndex: number, toIndex: number, position: 'before' | 'after') => void;
  onRotatePage: (index: number, delta: number) => void;
  onRotateAll: (delta: number) => void;
  onDeletePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
  onReverseOrder: () => void;
  onResetOrder: () => void;
  onAddFiles: () => void;
  fileCount: number;
  isMultiFile: boolean;
}

export const PdfOrganizeGrid: React.FC<PdfOrganizeGridProps> = ({
  pages,
  docProxies,
  onReorderPages,
  onRotatePage,
  onRotateAll,
  onDeletePage,
  onDuplicatePage,
  onReverseOrder,
  onResetOrder,
  onAddFiles,
  fileCount,
  isMultiFile,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedPageId: null,
    draggedIndex: null,
    dropTargetIndex: null,
    dropPosition: null,
  });

  const [cardSize, setCardSize] = useState<OrganizeCardSize>('medium');

  const handleDragStart = (e: React.DragEvent, index: number, pageId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragState({
      draggedPageId: pageId,
      draggedIndex: index,
      dropTargetIndex: null,
      dropPosition: null,
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragState.draggedIndex === null || dragState.draggedIndex === index) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const position: 'before' | 'after' = e.clientX < midX ? 'before' : 'after';

    if (dragState.dropTargetIndex !== index || dragState.dropPosition !== position) {
      setDragState((prev) => ({
        ...prev,
        dropTargetIndex: index,
        dropPosition: position,
      }));
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragState.draggedIndex === null || dragState.draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }
    const fromIndex = dragState.draggedIndex;
    const position = dragState.dropPosition || 'after';
    onReorderPages(fromIndex, targetIndex, position);
    handleDragEnd();
  };

  const handleDragEnd = () => {
    setDragState({
      draggedPageId: null,
      draggedIndex: null,
      dropTargetIndex: null,
      dropPosition: null,
    });
  };

  const gridClass =
    cardSize === 'large'
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8'
      : cardSize === 'small'
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'
      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8';

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#fafbfc] relative select-none">
      <PdfOrganizeControls
        cardSize={cardSize}
        onCardSizeChange={setCardSize}
        onReverseOrder={onReverseOrder}
        onRotateAll={onRotateAll}
        onResetOrder={onResetOrder}
        onAddFiles={onAddFiles}
        fileCount={fileCount}
      />

      {/* Spacious Grid Viewport */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
        {pages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-sm font-semibold text-slate-700">All pages have been removed.</p>
            <p className="text-xs text-slate-400 mt-1">Reset your pages or add another PDF file to continue.</p>
            <button
              type="button"
              onClick={onResetOrder}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Reset Pages
            </button>
          </div>
        ) : (
          <div className={`grid ${gridClass} justify-items-center max-w-7xl mx-auto pb-12`}>
            {pages.map((page, index) => (
              <PdfOrganizeCard
                key={page.id}
                page={page}
                displayIndex={index}
                docProxy={docProxies.get(page.fileId) || null}
                dragState={dragState}
                cardSize={cardSize}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onRotate={onRotatePage}
                onDelete={onDeletePage}
                onDuplicate={onDuplicatePage}
                isMultiFile={isMultiFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
