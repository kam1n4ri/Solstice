import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Move } from 'lucide-react';
import { WatermarkOptions } from './PdfWatermarkTypes';
import { PDFDocumentProxy } from '../../pdfjsSetup';
import { useWatermarkDrag } from './useWatermarkDrag';

interface PdfWatermarkPreviewProps {
  docProxy: PDFDocumentProxy | null;
  totalPages: number;
  options: WatermarkOptions;
  onChangePosition?: (xPercent: number, yPercent: number) => void;
}

export const PdfWatermarkPreview: React.FC<PdfWatermarkPreviewProps> = ({
  docProxy,
  totalPages,
  options,
  onChangePosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRendered, setIsRendered] = useState(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 440, height: 600 });

  const { isDragging, activeGuides, handlePointerDown } = useWatermarkDrag({
    options,
    onChangePosition: onChangePosition || (() => {}),
    containerRef: cardRef,
  });

  useEffect(() => {
    if (!docProxy) return;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await docProxy.getPage(currentPage);
        if (isCancelled) return;

        // Render at crisp preview scale
        const viewport = page.getViewport({ scale: 0.85 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        setPageSize({ width: viewport.width, height: viewport.height });

        ctx.scale(dpr, dpr);
        await page.render({ canvasContext: ctx, viewport }).promise;

        if (!isCancelled) setIsRendered(true);
      } catch (err) {
        console.warn(`[Watermark] Error rendering preview page ${currentPage}:`, err);
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [docProxy, currentPage]);

  const handlePrev = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  // Check if watermark applies to current page based on scope
  const isWatermarkActiveOnPage = () => {
    if (options.pagesScope === 'all') return true;
    if (options.pagesScope === 'odd') return currentPage % 2 !== 0;
    if (options.pagesScope === 'even') return currentPage % 2 === 0;
    if (options.pagesScope === 'range') {
      const tokens = (options.customPages || '').split(',').map((s) => s.trim()).filter(Boolean);
      for (const token of tokens) {
        if (token.includes('-')) {
          const [startStr, endStr] = token.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end) && currentPage >= start && currentPage <= end) return true;
        } else if (parseInt(token, 10) === currentPage) {
          return true;
        }
      }
      return false;
    }
    return true;
  };

  const hasContent =
    options.type === 'text' ? Boolean(options.text.trim()) : Boolean(options.imageDataUrl);

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 overflow-y-auto select-none bg-stone-100/50">
      {/* Centered Preview Canvas with Live Interactive Watermark */}
      <div className="flex-1 flex items-center justify-center p-4 w-full">
        <div
          ref={cardRef}
          className="relative bg-white rounded-2xl shadow-md border border-stone-200/80 overflow-hidden transition-all flex items-center justify-center"
          style={{ width: pageSize.width, height: pageSize.height }}
        >
          <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />

          {!isRendered && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 pointer-events-none">
              <FileText className="w-8 h-8 animate-pulse" />
              <span className="text-xs font-mono mt-1">Page {currentPage}</span>
            </div>
          )}

          {/* Active Autosnap Guideline Overlays */}
          {activeGuides?.vertical !== undefined && (
            <div
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-rose-400 pointer-events-none z-20"
              style={{ left: `${activeGuides.vertical}%` }}
            />
          )}
          {activeGuides?.horizontal !== undefined && (
            <div
              className="absolute left-0 right-0 h-px border-t border-dashed border-rose-400 pointer-events-none z-20"
              style={{ top: `${activeGuides.horizontal}%` }}
            />
          )}

          {/* Draggable Watermark Layer */}
          {isWatermarkActiveOnPage() && hasContent && (
            <div
              onPointerDown={handlePointerDown}
              className={`absolute flex items-center justify-center select-none group z-10 transition-shadow duration-100 ${
                isDragging
                  ? 'cursor-grabbing ring-1 ring-rose-400/80 bg-rose-50/10'
                  : 'cursor-grab hover:ring-1 hover:ring-rose-300/60'
              } rounded-lg`}
              style={{
                left: `${options.xPercent}%`,
                top: `${options.yPercent}%`,
                transform: `translate(-50%, -50%) rotate(${options.rotation}deg)`,
                opacity: options.opacity,
              }}
              title="Click and drag to position watermark anywhere on the page"
            >
              {options.type === 'text' ? (
                <span
                  className="font-bold tracking-widest uppercase whitespace-nowrap select-none font-sans px-2 py-0.5"
                  style={{
                    fontSize: `${options.fontSize * 0.85}px`,
                    color: options.colorHex,
                    textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {options.text}
                </span>
              ) : options.imageDataUrl ? (
                <img
                  src={options.imageDataUrl}
                  alt="Watermark"
                  draggable={false}
                  className="object-contain pointer-events-none rounded max-w-none"
                  style={{
                    width: `${pageSize.width * options.imageScale}px`,
                  }}
                />
              ) : null}

              {/* Floating Move Indicator */}
              <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 bg-white/95 border border-stone-200/80 rounded-full p-1 shadow-xs text-stone-500 transition-opacity pointer-events-none">
                <Move className="w-2.5 h-2.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page Stepper Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 p-1.5 px-3 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs text-xs font-medium text-stone-600">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page <span className="font-semibold text-stone-800">{currentPage}</span> of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
