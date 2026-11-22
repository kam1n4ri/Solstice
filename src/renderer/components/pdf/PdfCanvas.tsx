import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { PDFPageProxy } from './pdfjsSetup';
import { PdfPageRenderer } from './PdfPageRenderer';
import { PageDimensions } from './usePdfDocument';
import { AnnotationTool, PdfAnnotation } from './annotations/PdfAnnotationTypes';
import { PdfTextSelection } from './PdfViewerTypes';
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
  onSearchText,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));
  const [selectionInfo, setSelectionInfo] = useState<{
    selection: PdfTextSelection;
    position: { x: number; y: number };
  } | null>(null);

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

  // 4. Text Selection Context Menu handler
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelectionInfo(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length > 0 && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      let node: Node | null = range.startContainer;
      let pageNum = currentPage;
      let pageEl: HTMLElement | null = null;

      while (node) {
        if (node instanceof HTMLElement && node.getAttribute('data-page-number')) {
          pageNum = parseInt(node.getAttribute('data-page-number')!, 10);
          pageEl = node;
          break;
        }
        node = node.parentNode;
      }

      let xRatio = 0.1;
      let yRatio = 0.1;
      let widthRatio = 0.8;
      let heightRatio = 0.03;

      if (pageEl) {
        const pageRect = pageEl.getBoundingClientRect();
        xRatio = Math.max(0, Math.min(1, (rect.left - pageRect.left) / pageRect.width));
        yRatio = Math.max(0, Math.min(1, (rect.top - pageRect.top) / pageRect.height));
        widthRatio = Math.max(0.02, Math.min(1, rect.width / pageRect.width));
        heightRatio = Math.max(0.015, Math.min(1, rect.height / pageRect.height));
      }

      setSelectionInfo({
        selection: {
          text,
          pageNumber: pageNum,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            xRatio,
            yRatio,
            widthRatio,
            heightRatio,
          },
        },
        position: { x: rect.left + rect.width / 2, y: rect.top },
      });
    }
  }, [currentPage]);

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
      onMouseUp={handleMouseUp}
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

      {/* Text Selection Floating Context Menu */}
      {selectionInfo && (
        <PdfContextMenu
          selection={selectionInfo.selection}
          position={selectionInfo.position}
          onCopy={(text) => navigator.clipboard.writeText(text)}
          onHighlight={(sel) => {
            onAddAnnotation?.({
              id: `hl-${Date.now()}`,
              type: 'highlight',
              pageNumber: sel.pageNumber,
              rect: sel.rect,
              color: highlightColor || 'rgba(254, 240, 138, 0.55)',
            });
          }}
          onSearch={(text) => onSearchText?.(text)}
          onClose={() => setSelectionInfo(null)}
        />
      )}
    </div>
  );
};
