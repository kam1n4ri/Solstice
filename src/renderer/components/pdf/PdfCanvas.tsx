import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { PDFPageProxy } from './pdfjsSetup';
import { PdfPageRenderer } from './PdfPageRenderer';
import { PageDimensions } from './usePdfDocument';
import { AnnotationTool, PdfAnnotation } from './annotations/PdfAnnotationTypes';
import { PdfContextMenu } from './PdfContextMenu';

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
  onSearchText?: (query: string) => void;
  onZoomChange?: (scale: number | ((prev: number) => number)) => void;
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
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null);

  const isProgrammaticScrollRef = useRef(false);
  const lastReportedPageRef = useRef(currentPage);
  const scrollRafIdRef = useRef<number | null>(null);

  // 1. Lazy render pages near viewport (buffer)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = new Set<number>();
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1', 10);
            visible.add(pageNum);
            if (pageNum > 1) visible.add(pageNum - 1);
            if (pageNum < numPages) visible.add(pageNum + 1);
          }
        });

        if (visible.size > 0) {
          setVisiblePages((prev) => new Set([...prev, ...visible]));
        }
      },
      {
        root: container,
        rootMargin: '600px 0px',
        threshold: 0,
      }
    );

    const pageElements = container.querySelectorAll('[data-page-number]');
    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [numPages, scale, rotation]);

  // 2. Stable, non-oscillating active page calculation on scroll
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    if (scrollRafIdRef.current !== null) return;

    scrollRafIdRef.current = requestAnimationFrame(() => {
      scrollRafIdRef.current = null;
      const container = containerRef.current;
      if (!container || numPages === 0) return;

      const containerRect = container.getBoundingClientRect();
      const targetY = containerRect.top + containerRect.height / 3;

      const pageElements = container.querySelectorAll<HTMLElement>('[data-page-number]');
      let detectedPage = lastReportedPageRef.current;

      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i];
        const r = el.getBoundingClientRect();
        if (r.top <= targetY && r.bottom >= targetY) {
          detectedPage = parseInt(el.getAttribute('data-page-number') || '1', 10);
          break;
        }
      }

      if (detectedPage !== lastReportedPageRef.current) {
        lastReportedPageRef.current = detectedPage;
        onPageChange(detectedPage);
      }
    });
  }, [numPages, onPageChange]);

  // 3. Programmatic jump to page (direct button or user input jump)
  useEffect(() => {
    if (!scrollToPage || scrollToPage < 1 || scrollToPage > numPages) return;
    const container = containerRef.current;
    if (!container) return;

    const pageEl = container.querySelector<HTMLElement>(`[data-page-number="${scrollToPage}"]`);
    if (pageEl) {
      isProgrammaticScrollRef.current = true;
      lastReportedPageRef.current = scrollToPage;
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const timer = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [scrollToPage, numPages]);

  // 4. Ctrl + Scroll Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onZoomChange) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        onZoomChange((prev) => Math.max(0.4, Math.min(3.0, Number((prev + delta).toFixed(2)))));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [onZoomChange]);

  // 5. Right-Click Context Menu (Shows Copy option only when text is selected)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text.length > 0) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, text });
    } else {
      setContextMenu(null);
    }
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    window.addEventListener('mousedown', handleClose);
    return () => window.removeEventListener('mousedown', handleClose);
  }, [contextMenu]);

  // Group annotations by page
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
      onScroll={handleScroll}
      onContextMenu={handleContextMenu}
      className="flex-1 w-full h-full overflow-y-auto overflow-x-auto p-6 flex flex-col items-center custom-scrollbar bg-[#fafbfc]"
    >
      <div className="flex flex-col items-center min-w-full">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
          <PdfPageRenderer
            key={`${pageNumber}-${rotation}`}
            pageNumber={pageNumber}
            getPage={getPage}
            scale={scale}
            rotation={rotation}
            isVisible={visiblePages.has(pageNumber)}
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
        ))}
      </div>

      {/* Right-click Copy context menu */}
      <PdfContextMenu
        position={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
};
