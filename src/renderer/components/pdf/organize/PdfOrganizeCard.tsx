import React, { useEffect, useRef, useState } from 'react';
import { RotateCw, RotateCcw, Trash2, Copy, GripVertical } from 'lucide-react';
import { OrganizePage, DragState, OrganizeCardSize } from './PdfOrganizeTypes';
import { PDFDocumentProxy } from '../pdfjsSetup';

interface PdfOrganizeCardProps {
  page: OrganizePage;
  displayIndex: number;
  docProxy: PDFDocumentProxy | null;
  dragState: DragState;
  cardSize?: OrganizeCardSize;
  onDragStart: (e: React.DragEvent, index: number, pageId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
  onDragEnd: () => void;
  onRotate: (index: number, delta: number) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  isMultiFile: boolean;
}

export const PdfOrganizeCard: React.FC<PdfOrganizeCardProps> = ({
  page,
  displayIndex,
  docProxy,
  dragState,
  cardSize = 'medium',
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onRotate,
  onDelete,
  onDuplicate,
  isMultiFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const isBeingDragged = dragState.draggedIndex === displayIndex;
  const isDropTarget = dragState.dropTargetIndex === displayIndex;

  useEffect(() => {
    if (!docProxy) return;
    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        const pdfPage = await docProxy.getPage(page.originalPageIndex + 1);
        if (isCancelled) return;

        const baseScale = cardSize === 'large' ? 0.6 : cardSize === 'small' ? 0.32 : 0.46;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = pdfPage.getViewport({ scale: baseScale * dpr });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await pdfPage.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        if (!isCancelled) setIsRendered(true);
      } catch (err) {
        console.warn(`[Organize] Error rendering page ${page.originalPageIndex + 1}:`, err);
      }
    };

    renderThumbnail();
    return () => {
      isCancelled = true;
    };
  }, [docProxy, page.originalPageIndex, cardSize]);

  // Dimension classes based on size preset
  const dimensionClass =
    cardSize === 'large'
      ? 'w-72 h-96 sm:w-80 sm:h-[420px]'
      : cardSize === 'small'
      ? 'w-44 h-60'
      : 'w-56 h-80 sm:w-64 sm:h-[340px]';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, displayIndex, page.id)}
      onDragOver={(e) => onDragOver(e, displayIndex)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, displayIndex)}
      onDragEnd={onDragEnd}
      className={`group relative flex flex-col items-center select-none transition-all duration-150 ${
        isBeingDragged ? 'opacity-30 scale-95' : 'opacity-100'
      }`}
    >
      {/* Visual Drop Target Indicator */}
      {isDropTarget && dragState.dropPosition === 'before' && (
        <div className="absolute -left-2 top-0 bottom-8 w-1 bg-rose-400 rounded-full shadow-xs z-30 animate-pulse" />
      )}
      {isDropTarget && dragState.dropPosition === 'after' && (
        <div className="absolute -right-2 top-0 bottom-8 w-1 bg-rose-400 rounded-full shadow-xs z-30 animate-pulse" />
      )}

      {/* Main Card Frame */}
      <div
        className={`relative ${dimensionClass} bg-white rounded-2xl border transition-all flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing shadow-xs group-hover:shadow-md ${
          isDropTarget
            ? 'border-rose-400 ring-2 ring-rose-200/60'
            : 'border-stone-200/90 group-hover:border-rose-300'
        }`}
      >
        {/* Multi-File Prefix Badge */}
        {isMultiFile && (
          <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-100/90 text-rose-800 border border-rose-200/70 shadow-2xs">
            {page.filePrefix}
          </span>
        )}

        {/* Rotation Delta Indicator */}
        {page.rotation > 0 && (
          <span className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-stone-100/90 text-slate-700 border border-stone-200/80 shadow-2xs">
            {page.rotation}°
          </span>
        )}

        {/* Thumbnail Preview with Smooth CSS Rotation */}
        <div
          className="w-full h-full flex items-center justify-center p-3 transition-transform duration-200"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        >
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-full rounded-md shadow-[0_1px_6px_rgba(0,0,0,0.06)] bg-white ${
              isRendered ? 'block' : 'hidden'
            }`}
          />
          {!isRendered && (
            <div className="w-full h-full rounded-xl bg-stone-50 border border-dashed border-stone-200 flex flex-col items-center justify-center gap-1.5 text-slate-400">
              <GripVertical className="w-5 h-5 opacity-40" />
              <span className="text-xs font-mono font-medium">Page {page.originalPageIndex + 1}</span>
            </div>
          )}
        </div>

        {/* Floating Pale Action Dock on Hover */}
        <div className="absolute inset-x-3 bottom-3 p-1 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-around z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(displayIndex, -90);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Rotate Left (90° CCW)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(displayIndex, 90);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Rotate Right (90° CW)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(displayIndex);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Duplicate Page"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(displayIndex);
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page Number Label Below Card */}
      <div className="mt-2.5 text-center">
        <span className="text-xs font-semibold text-slate-700 tracking-tight">
          {isMultiFile ? `${page.filePrefix}: Page ${displayIndex + 1}` : `Page ${displayIndex + 1}`}
        </span>
      </div>
    </div>
  );
};
