import React, { useState, useRef, useMemo } from 'react';
import {
  AnnotationTool,
  PdfAnnotation,
  PdfPathAnnotation,
  PdfHighlightAnnotation,
} from './PdfAnnotationTypes';

interface PdfAnnotationLayerProps {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  annotations: PdfAnnotation[];
  activeTool: AnnotationTool;
  highlightColor: string;
  penColor: string;
  penWidth: number;
  onAddAnnotation: (annotation: PdfAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const PdfAnnotationLayer: React.FC<PdfAnnotationLayerProps> = ({
  pageNumber,
  pageWidth,
  pageHeight,
  annotations,
  activeTool,
  highlightColor,
  penColor,
  penWidth,
  onAddAnnotation,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // In-flight state during active mouse drag
  const [currentPoints, setCurrentPoints] = useState<{ xRatio: number; yRatio: number }[]>([]);
  const [highlightStart, setHighlightStart] = useState<{ xRatio: number; yRatio: number } | null>(null);
  const [highlightCurrent, setHighlightCurrent] = useState<{ xRatio: number; yRatio: number } | null>(null);
  const isDrawingRef = useRef(false);

  const pageAnnotations = useMemo(() => {
    return annotations.filter((a) => a.pageNumber === pageNumber);
  }, [annotations, pageNumber]);

  // Fast SVG path generator without intermediate string allocations
  const pointsToSvgPath = (points: { xRatio: number; yRatio: number }[]) => {
    const len = points.length;
    if (len < 2) return '';
    const parts = new Array(len);
    for (let i = 0; i < len; i++) {
      const pt = points[i];
      parts[i] = `${i === 0 ? 'M' : 'L'} ${pt.xRatio * pageWidth} ${pt.yRatio * pageHeight}`;
    }
    return parts.join(' ');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / pageWidth));
    const yRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / pageHeight));

    if (activeTool === 'pen') {
      isDrawingRef.current = true;
      setCurrentPoints([{ xRatio, yRatio }]);
    } else if (activeTool === 'highlight') {
      isDrawingRef.current = true;
      setHighlightStart({ xRatio, yRatio });
      setHighlightCurrent({ xRatio, yRatio });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / pageWidth));
    const yRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / pageHeight));

    if (activeTool === 'pen') {
      setCurrentPoints((prev) => [...prev, { xRatio, yRatio }]);
    } else if (activeTool === 'highlight') {
      setHighlightCurrent({ xRatio, yRatio });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeTool === 'pen' && currentPoints.length >= 2) {
      const newPath: PdfPathAnnotation = {
        id: `pen-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: 'pen',
        pageNumber,
        points: currentPoints,
        color: penColor,
        width: penWidth,
      };
      onAddAnnotation(newPath);
      setCurrentPoints([]);
    } else if (activeTool === 'highlight' && highlightStart && highlightCurrent) {
      const minX = Math.min(highlightStart.xRatio, highlightCurrent.xRatio);
      const minY = Math.min(highlightStart.yRatio, highlightCurrent.yRatio);
      const width = Math.abs(highlightCurrent.xRatio - highlightStart.xRatio);
      const height = Math.abs(highlightCurrent.yRatio - highlightStart.yRatio);

      if (width > 0.01 && height > 0.005) {
        const newHighlight: PdfHighlightAnnotation = {
          id: `hl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          type: 'highlight',
          pageNumber,
          rect: { xRatio: minX, yRatio: minY, widthRatio: width, heightRatio: height },
          color: highlightColor,
        };
        onAddAnnotation(newHighlight);
      }
      setHighlightStart(null);
      setHighlightCurrent(null);
    }
  };

  const isInteractive = activeTool !== 'select';

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
      className={`absolute inset-0 z-10 ${
        isInteractive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* SVG Layer for Paths and Highlights */}
      <svg
        width={pageWidth}
        height={pageHeight}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Render Saved Highlights */}
        {pageAnnotations
          .filter((a): a is PdfHighlightAnnotation => a.type === 'highlight')
          .map((hl) => (
            <rect
              key={hl.id}
              x={hl.rect.xRatio * pageWidth}
              y={hl.rect.yRatio * pageHeight}
              width={hl.rect.widthRatio * pageWidth}
              height={hl.rect.heightRatio * pageHeight}
              fill={hl.color}
              className="mix-blend-multiply rounded-sm"
            />
          ))}

        {/* In-flight Highlight Preview */}
        {highlightStart && highlightCurrent && (
          <rect
            x={Math.min(highlightStart.xRatio, highlightCurrent.xRatio) * pageWidth}
            y={Math.min(highlightStart.yRatio, highlightCurrent.yRatio) * pageHeight}
            width={Math.abs(highlightCurrent.xRatio - highlightStart.xRatio) * pageWidth}
            height={Math.abs(highlightCurrent.yRatio - highlightStart.yRatio) * pageHeight}
            fill={highlightColor}
            className="mix-blend-multiply rounded-sm"
          />
        )}

        {/* Render Saved Pen Strokes */}
        {pageAnnotations
          .filter((a): a is PdfPathAnnotation => a.type === 'pen')
          .map((p) => (
            <path
              key={p.id}
              d={pointsToSvgPath(p.points)}
              stroke={p.color}
              strokeWidth={p.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}

        {/* In-flight Pen Stroke Preview */}
        {currentPoints.length >= 2 && (
          <path
            d={pointsToSvgPath(currentPoints)}
            stroke={penColor}
            strokeWidth={penWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
};
