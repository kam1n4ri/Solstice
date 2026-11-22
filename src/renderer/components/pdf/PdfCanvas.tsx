import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { PDFPageProxy } from './pdfjsSetup';
import { PdfPageRenderer } from './PdfPageRenderer';
import { PageDimensions } from './usePdfDocument';
import { AnnotationTool, PdfAnnotation } from './annotations/PdfAnnotationTypes';
import { PdfLayoutMode, PdfColorTheme, PdfTextSelection } from './PdfViewerTypes';
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
  layoutMode?: PdfLayoutMode;
  colorTheme?: PdfColorTheme;
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
  layoutMode = 'single',
  colorTheme = 'default',
  onSearchText,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));
  const [selectionInfo, setSelectionInfo] = useState<{
    selection: PdfTextSelection;
    position: { x: number; y: number };
  } | null>(null);

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
            if (pageNum > 1) visible.add(pageNum - 1);
            if (pageNum < numPages) visible.add(pageNum + 1);

            if (entry.intersectionRatio > maxIntersectionRatio) {
              maxIntersectionRatio = entry.intersectionRatio;
              mostVisiblePage = pageNum;
            }
          }
        });

        if (visible.size > 0) {
          setVisiblePages((prev) => new Set([...prev, ...visible]));
        }

        if (mostVisiblePage !== currentPage && maxIntersectionRatio > 0.2) {
          onPageChange(mostVisiblePage);
        }
      },
      {
        root: container,
        rootMargin: '300px 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    const pageElements = container.querySelectorAll('[data-page-number]');
    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [numPages, currentPage, onPageChange, scale, rotation, layoutMode]);

  // 2. Programmatic jump to page
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

  // 3. Text Selection Context Menu handler
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

  // 4. Spread vs Single Layout Rows
  const pageRows = useMemo(() => {
    if (layoutMode === 'single') {
      return Array.from({ length: numPages }, (_, i) => [i + 1]);
    }
    // In spread mode: Cover page 1 on its own, then [2, 3], [4, 5], etc.
    const rows: number[][] = [];
    if (numPages >= 1) rows.push([1]);
    for (let p = 2; p <= numPages; p += 2) {
      if (p + 1 <= numPages) {
        rows.push([p, p + 1]);
      } else {
        rows.push([p]);
      }
    }
    return rows;
  }, [numPages, layoutMode]);

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

  // Theme styling
  const themeBgClass =
    colorTheme === 'sepia'
      ? 'bg-[#f4efe4]'
      : colorTheme === 'dark'
        ? 'bg-[#141517]'
        : 'bg-[#fafbfc]';

  const themeFilterStyle =
    colorTheme === 'sepia'
      ? { filter: 'sepia(0.22) contrast(0.97)' }
      : colorTheme === 'dark'
        ? { filter: 'invert(0.88) hue-rotate(180deg) contrast(0.94)' }
        : undefined;

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className={`flex-1 w-full h-full overflow-y-auto overflow-x-auto p-6 flex flex-col items-center custom-scrollbar transition-colors duration-200 ${themeBgClass}`}
    >
      <div
        style={themeFilterStyle}
        className="flex flex-col items-center min-w-full transition-all duration-200"
      >
        {pageRows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`flex items-center justify-center gap-4 ${
              layoutMode === 'spread' && row.length === 2 ? 'w-full max-w-6xl' : ''
            }`}
          >
            {row.map((pageNumber) => (
              <PdfPageRenderer
                key={`${pageNumber}-${rotation}`}
                pageNumber={pageNumber}
                getPage={getPage}
                scale={layoutMode === 'spread' ? scale * 0.82 : scale}
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
