import React, { useEffect, useRef, useState } from 'react';
import { pdfjsLib, PDFPageProxy } from './pdfjsSetup';
import {
  AnnotationTool,
  PdfAnnotation,
} from './annotations/PdfAnnotationTypes';
import { PdfAnnotationLayer } from './annotations/PdfAnnotationLayer';

interface PdfPageRendererProps {
  pageNumber: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  scale: number;
  rotation: number;
  isVisible: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
  annotations?: PdfAnnotation[];
  activeTool?: AnnotationTool;
  highlightColor?: string;
  penColor?: string;
  penWidth?: number;
  onAddAnnotation?: (annotation: PdfAnnotation) => void;
  onDeleteAnnotation?: (id: string) => void;
  children?: React.ReactNode;
}

const PdfPageRendererComponent: React.FC<PdfPageRendererProps> = ({
  pageNumber,
  getPage,
  scale,
  rotation,
  isVisible,
  defaultWidth = 595.28,
  defaultHeight = 841.89,
  annotations,
  activeTool,
  highlightColor,
  penColor,
  penWidth,
  onAddAnnotation,
  onDeleteAnnotation,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [pageWidth, setPageWidth] = useState<number>(defaultWidth * scale);
  const [pageHeight, setPageHeight] = useState<number>(defaultHeight * scale);
  const [isRendered, setIsRendered] = useState<boolean>(false);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        setPageWidth(viewport.width);
        setPageHeight(viewport.height);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

        // Cancel any pending render task on this canvas
        if (renderTaskRef.current?.cancel) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: transform || undefined,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (isCancelled) return;

        // Render native OS text selection layer
        const textLayerContainer = textLayerRef.current;
        if (textLayerContainer) {
          textLayerContainer.innerHTML = '';
          textLayerContainer.style.width = `${Math.floor(viewport.width)}px`;
          textLayerContainer.style.height = `${Math.floor(viewport.height)}px`;

          try {
            const textContent = await page.getTextContent();
            if (isCancelled) return;

            const textLayer = new (pdfjsLib as any).TextLayer({
              textContentSource: textContent,
              container: textLayerContainer,
              viewport,
            });
            await textLayer.render();
          } catch (textErr) {
            console.warn(`Text layer render warning on page ${pageNumber}:`, textErr);
          }
        }

        setIsRendered(true);
      } catch (err) {
        const errorName = err instanceof Error ? err.name : (typeof err === 'object' && err !== null && 'name' in err ? String((err as Record<string, unknown>).name) : '');
        if (errorName !== 'RenderingCancelledException' && !isCancelled) {
          console.error(`Page ${pageNumber} render failed:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current?.cancel) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pageNumber, getPage, scale, rotation, isVisible]);

  return (
    <div
      data-page-number={pageNumber}
      style={{
        width: Math.floor(pageWidth),
        height: Math.floor(pageHeight),
      }}
      className="relative mx-auto my-5 bg-white rounded-md shadow-[0_4px_24px_-2px_rgba(44,38,30,0.09)] border border-stone-200/80 transition-shadow select-none group/page"
    >
      {/* 1. Canvas Layer (High-DPI Razor Sharp Graphics) */}
      <canvas ref={canvasRef} className="block rounded-md" />

      {/* 2. Text Layer (Selectable & Copyable Text Overlay) */}
      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0 select-text overflow-hidden rounded-md pointer-events-auto"
      />

      {/* 3. Annotation & Markup Layer */}
      {onAddAnnotation && onDeleteAnnotation && (
        <PdfAnnotationLayer
          pageNumber={pageNumber}
          pageWidth={Math.floor(pageWidth)}
          pageHeight={Math.floor(pageHeight)}
          annotations={annotations || []}
          activeTool={activeTool || 'select'}
          highlightColor={highlightColor || 'rgba(254, 240, 138, 0.55)'}
          penColor={penColor || '#334155'}
          penWidth={penWidth || 2}
          onAddAnnotation={onAddAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
        />
      )}
      {children}

      {/* 4. Page Number Indicator Badge */}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/60 backdrop-blur-sm text-white text-[10px] font-mono opacity-0 group-hover/page:opacity-100 transition-opacity pointer-events-none">
        {pageNumber}
      </div>

      {/* 5. Skeleton Loading Placeholder */}
      {!isRendered && (
        <div className="absolute inset-0 bg-white flex items-center justify-center rounded-md">
          <span className="text-xs text-slate-400 font-mono animate-pulse">
            Page {pageNumber}
          </span>
        </div>
      )}
    </div>
  );
};

export const PdfPageRenderer = React.memo(PdfPageRendererComponent);
