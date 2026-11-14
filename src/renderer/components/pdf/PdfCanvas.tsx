import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { PDFPageProxy } from './pdfjsSetup';
import { PdfPageRenderer } from './PdfPageRenderer';
import { PageDimensions } from './usePdfDocument';
import { AnnotationTool, PdfAnnotation } from './annotations/PdfAnnotationTypes';

interface PdfCanvasProps {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  scale: number;
  rotation: number;
  currentPage: number;
  onPageChange: (pageNumber: number) => void;
  defaultDims: PageDimensions;
  scrollToPage?: number | null;
  annotations?: PdfAnnotation[];
  activeTool?: AnnotationTool;
  highlightColor?: string;
  penColor?: string;
  penWidth?: number;
  onAddAnnotation?: (annotation: PdfAnnotation) => void;
  onDeleteAnnotation?: (id: string) => void;
}

export const PdfCanvas: React.FC<PdfCanvasProps> = ({
  numPages,
  getPage,
  scale,
  rotation,
  currentPage,
  onPageChange,
  defaultDims,
  scrollToPage,
  annotations,
  activeTool,
  highlightColor,
  penColor,
  penWidth,
  onAddAnnotation,
  onDeleteAnnotation,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));

  // 1. Intersection Observer to detect visible pages & track active page
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = new Set<number>();
        let mostVisiblePage = currentPage;
        let maxIntersectionRatio = 0;

        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1', 10);
          if (entry.isIntersecting) {
            visible.add(pageNum);
            // Include buffer pages (previous and next)
            if (pageNum > 1) visible.add(pageNum - 1);
            if (pageNum < numPages) visible.add(pageNum + 1);

            if (entry.intersectionRatio > maxIntersectionRatio) {
              maxIntersectionRatio = entry.intersectionRatio;
              mostVisiblePage = pageNum;
            }
          }
        });

        if (visible.size > 0) {
          setVisiblePages((prev) => {
            // Keep union so we don't aggressively unmount during fast scroll
            const combined = new Set([...prev, ...visible]);
            return combined;
          });
        }

        if (mostVisiblePage !== currentPage && maxIntersectionRatio > 0.2) {
          onPageChange(mostVisiblePage);
        }
      },
      {
        root: container,
        rootMargin: '300px 0px', // Preload buffer around viewport
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    const pageElements = container.querySelectorAll('[data-page-number]');
    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [numPages, currentPage, onPageChange, scale, rotation]);

  // 2. Programmatic jump to page (when user inputs page number or clicks thumbnail)
  const jumpToPage = useCallback((pageNum: number) => {
    if (!containerRef.current) return;
    const pageEl = containerRef.current.querySelector(`[data-page-number="${pageNum}"]`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (scrollToPage && scrollToPage >= 1 && scrollToPage <= numPages) {
      jumpToPage(scrollToPage);
    }
  }, [scrollToPage, numPages, jumpToPage]);

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  // Group annotations by page so pages with untouched annotations do not re-render
  const annotationsByPage = useMemo(() => {
    const map = new Map<number, PdfAnnotation[]>();
    if (!annotations) return map;
    for (let i = 0; i < annotations.length; i++) {
      const ann = annotations[i];
      const list = map.get(ann.pageNumber) || [];
      list.push(ann);
      map.set(ann.pageNumber, list);
    }
    return map;
  }, [annotations]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full overflow-y-auto overflow-x-auto bg-[#fafbfc] p-6 flex flex-col items-center custom-scrollbar"
    >
      <div className="flex flex-col items-center min-w-full">
        {pageNumbers.map((pageNumber) => {
          const isVisible = visiblePages.has(pageNumber);
          return (
            <PdfPageRenderer
              key={`${pageNumber}-${rotation}`}
              pageNumber={pageNumber}
              getPage={getPage}
              scale={scale}
              rotation={rotation}
              isVisible={isVisible}
              defaultWidth={defaultDims.width}
              defaultHeight={defaultDims.height}
              annotations={annotationsByPage.get(pageNumber)}
              activeTool={activeTool}
              highlightColor={highlightColor}
              penColor={penColor}
              penWidth={penWidth}
              onAddAnnotation={onAddAnnotation}
              onDeleteAnnotation={onDeleteAnnotation}
            />
          );
        })}
      </div>
    </div>
  );
};
