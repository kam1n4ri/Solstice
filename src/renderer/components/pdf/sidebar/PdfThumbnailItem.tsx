import React, { useEffect, useRef, useState } from 'react';
import { PDFPageProxy } from '../pdfjsSetup';

interface PdfThumbnailItemProps {
  pageNumber: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  isSelected: boolean;
  onSelect: (pageNumber: number) => void;
  previewWidth?: number;
}

const PdfThumbnailItemComponent: React.FC<PdfThumbnailItemProps> = ({
  pageNumber,
  getPage,
  isSelected,
  onSelect,
  previewWidth,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Lazy load thumbnail only when scrolled into view in the sidebar drawer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || isRendered) return;

    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        const page = await getPage(pageNumber);
        if (isCancelled) return;

        // Render at scale 0.32 for crisp thumbnails across resize range
        const viewport = page.getViewport({ scale: 0.32 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (err) {
        console.warn(`Thumbnail render warning for page ${pageNumber}:`, err);
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [isInView, isRendered, pageNumber, getPage]);

  return (
    <div
      ref={containerRef}
      onClick={() => onSelect(pageNumber)}
      className="flex flex-col items-center cursor-pointer group"
    >
      <div
        style={{ width: previewWidth ? `${previewWidth}px` : undefined }}
        className={`p-1 rounded-lg transition-all border flex items-center justify-center ${
          isSelected
            ? 'bg-stone-100 border-stone-300/90 shadow-2xs'
            : 'bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-2xs'
        }`}
      >
        <div className="relative bg-white w-full flex items-center justify-center rounded overflow-hidden min-h-[90px]">
          <canvas
            ref={canvasRef}
            className="block rounded shadow-[0_1px_3px_rgba(44,38,30,0.08)] max-w-full h-auto"
          />
          {!isRendered && (
            <div className="absolute inset-0 bg-stone-50 flex items-center justify-center text-[10px] text-slate-400 font-mono">
              p. {pageNumber}
            </div>
          )}
        </div>
      </div>
      <span
        className={`text-[11px] font-mono mt-1.5 transition-colors ${
          isSelected ? 'font-bold text-slate-800' : 'text-slate-500 group-hover:text-slate-800'
        }`}
      >
        {pageNumber}
      </span>
    </div>
  );
};

export const PdfThumbnailItem = React.memo(PdfThumbnailItemComponent);
