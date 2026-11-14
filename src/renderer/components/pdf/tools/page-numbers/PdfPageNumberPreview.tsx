import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Ban } from 'lucide-react';
import { PageNumberOptions } from './PdfPageNumberTypes';
import { PDFDocumentProxy } from '../../pdfjsSetup';

interface PdfPageNumberPreviewProps {
  docProxy: PDFDocumentProxy | null;
  totalPages: number;
  options: PageNumberOptions;
}

export const PdfPageNumberPreview: React.FC<PdfPageNumberPreviewProps> = ({
  docProxy,
  totalPages,
  options,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRendered, setIsRendered] = useState(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 440, height: 600 });

  useEffect(() => {
    if (!docProxy) return;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await docProxy.getPage(currentPage);
        if (isCancelled) return;

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
        console.warn(`[PageNumber] Error rendering preview page ${currentPage}:`, err);
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

  const isNumberActiveOnPage = () => {
    if (options.pagesScope === 'all') return true;
    if (options.pagesScope === 'skip-first') return currentPage > 1;
    if (options.pagesScope === 'odd') return currentPage % 2 !== 0;
    if (options.pagesScope === 'even') return currentPage % 2 === 0;
    if (options.pagesScope === 'range' && options.customPages) {
      const tokens = options.customPages.split(',').map((s) => s.trim()).filter(Boolean);
      for (const token of tokens) {
        if (token.includes('-')) {
          const [startStr, endStr] = token.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (currentPage >= start && currentPage <= end) return true;
        } else if (parseInt(token, 10) === currentPage) {
          return true;
        }
      }
      return false;
    }
    return true;
  };

  const isTop = options.position.startsWith('top');
  const isRight = options.position.endsWith('right');
  const isCenter = options.position.endsWith('center');
  const previewMargin = Math.round(options.margin * 0.85);

  const pageNum =
    (options.firstNumber ?? 1) +
    (options.pagesScope === 'skip-first' ? currentPage - 2 : currentPage - 1) +
    options.startOffset;

  const displayText = options.format
    .replace('{n}', `${pageNum}`)
    .replace('{total}', `${totalPages}`);

  const fontFam =
    options.fontFamily === 'times'
      ? 'serif'
      : options.fontFamily === 'courier'
      ? 'monospace'
      : 'sans-serif';

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 overflow-y-auto select-none bg-stone-100/50">
      {/* Centered Preview Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 w-full">
        <div
          className="relative bg-white rounded-2xl shadow-md border border-stone-200/80 overflow-hidden transition-all flex items-center justify-center"
          style={{ width: pageSize.width, height: pageSize.height }}
        >
          <canvas ref={canvasRef} className="block w-full h-full" />

          {!isRendered && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300">
              <FileText className="w-8 h-8 animate-pulse" />
              <span className="text-xs font-mono mt-1">Page {currentPage}</span>
            </div>
          )}

          {/* Excluded Page Notice */}
          {!isNumberActiveOnPage() && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 border border-stone-200 shadow-2xs text-[11px] text-stone-500 font-medium flex items-center gap-1.5 backdrop-blur-xs">
              <Ban className="w-3.5 h-3.5 text-rose-500" />
              <span>Page {currentPage} skipped (no page number)</span>
            </div>
          )}

          {/* Live Page Number Overlay */}
          {isNumberActiveOnPage() && (
            <div
              className="pointer-events-none transition-all duration-150 select-none px-1.5 py-0.5 rounded-sm"
              style={{
                position: 'absolute',
                top: isTop ? `${previewMargin}px` : undefined,
                bottom: !isTop ? `${previewMargin}px` : undefined,
                left: isCenter ? '50%' : isRight ? undefined : `${previewMargin}px`,
                right: isRight ? `${previewMargin}px` : undefined,
                transform: isCenter ? 'translateX(-50%)' : undefined,
                fontSize: `${options.fontSize * 0.85}px`,
                fontFamily: fontFam,
                color: options.colorHex,
                fontWeight: 500,
              }}
            >
              <span>{displayText}</span>
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
