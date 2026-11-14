import React, { useEffect, useRef, useState } from 'react';
import { FileText, Scissors } from 'lucide-react';
import { SplitPartition, PartitionPalette } from './PdfSplitTypes';
import { PDFDocumentProxy } from '../../pdfjsSetup';

interface PdfSplitPageCardProps {
  pageIndex: number;
  docProxy: PDFDocumentProxy | null;
  assignedPartition?: SplitPartition;
  palette?: PartitionPalette;
  isActivePartition?: boolean;
  isDragSelected?: boolean;
  onSelectPartition?: (partitionId: string) => void;
  onSplitAfterPage?: (pageNumber: number) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerEnter?: () => void;
  isModeExtractAll?: boolean;
  isLastPage?: boolean;
}

export const PdfSplitPageCard: React.FC<PdfSplitPageCardProps> = ({
  pageIndex,
  docProxy,
  assignedPartition,
  palette,
  isActivePartition = false,
  isDragSelected = false,
  onSelectPartition,
  onSplitAfterPage,
  onPointerDown,
  onPointerEnter,
  isModeExtractAll = false,
  isLastPage = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const pageNumber = pageIndex + 1;

  useEffect(() => {
    if (!docProxy || isRendered) return;
    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        const pdfPage = await docProxy.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = pdfPage.getViewport({ scale: 0.22 });
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
        console.warn(`[Split] Error rendering page ${pageNumber}:`, err);
      }
    };

    renderThumbnail();
    return () => {
      isCancelled = true;
    };
  }, [docProxy, pageNumber, isRendered]);

  const borderClass = isDragSelected
    ? 'border-rose-300 bg-rose-50/60 ring-2 ring-rose-200/70 scale-[1.01] shadow-xs'
    : isModeExtractAll
    ? 'border-rose-200/90 bg-rose-50/20'
    : assignedPartition && palette
    ? `${palette.cardBorder} ${palette.cardBg}`
    : 'border-stone-200/80 bg-white hover:border-stone-300';

  const activeRing = isActivePartition && !isDragSelected
    ? 'ring-2 ring-rose-300/40 shadow-xs'
    : '';

  const handleClick = () => {
    if (assignedPartition && onSelectPartition) {
      onSelectPartition(assignedPartition.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className={`group relative flex flex-col items-center justify-between w-40 h-56 p-2.5 rounded-2xl border transition-all duration-150 select-none cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${borderClass} ${activeRing}`}
      title={
        isModeExtractAll
          ? `Page ${pageNumber} will be exported as its own file`
          : assignedPartition
          ? `Page ${pageNumber} is assigned to ${assignedPartition.name} (Drag across pages to set partition range)`
          : `Page ${pageNumber}`
      }
    >
      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-md border border-stone-200/50">
          Page {pageNumber}
        </span>

        {isDragSelected ? (
          <span className="text-[9px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-200/80 shadow-2xs">
            Selected
          </span>
        ) : isModeExtractAll ? (
          <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
            Part {pageNumber}
          </span>
        ) : assignedPartition && palette ? (
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border border-stone-200/40 shadow-2xs ${palette.badgeBg} ${palette.badgeText}`}
          >
            {assignedPartition.name}
          </span>
        ) : (
          <span className="text-[9px] text-stone-300 group-hover:text-stone-400">
            Unassigned
          </span>
        )}
      </div>

      {/* Center Canvas Preview */}
      <div className="flex-1 w-full my-1.5 flex items-center justify-center overflow-hidden rounded-lg bg-stone-50/60 border border-stone-100/80 relative pointer-events-none">
        <canvas
          ref={canvasRef}
          draggable={false}
          className={`max-w-full max-h-full object-contain rounded shadow-2xs transition-opacity duration-200 ${
            isRendered ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!isRendered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300">
            <FileText className="w-6 h-6 animate-pulse" />
            <span className="text-[10px] mt-1 font-mono">{pageNumber}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer Label & Quick Split Button */}
      <div className="w-full flex items-center justify-between px-0.5">
        <span className="text-[10px] text-stone-400 group-hover:text-stone-600 font-medium truncate">
          {assignedPartition ? assignedPartition.name : 'Unassigned'}
        </span>

        {!isModeExtractAll && !isLastPage && onSplitAfterPage && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSplitAfterPage(pageNumber);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200/60 transition-all cursor-pointer shadow-2xs"
            title={`Split after Page ${pageNumber}`}
          >
            <Scissors className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
