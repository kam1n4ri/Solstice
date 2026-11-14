import React, { useRef, useEffect, useCallback } from 'react';
import { BrushSettings } from '../tools/photoDrawHelper';

interface PhotoDrawCanvasOverlayProps {
  imageWidth: number;
  imageHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  brush: BrushSettings;
  drawCanvas: HTMLCanvasElement | null;
  drawVersion: number;
  onStrokeStart: (x: number, y: number) => void;
  onStrokeMove: (x: number, y: number) => void;
  onStrokeEnd: () => void;
}

export const PhotoDrawCanvasOverlay: React.FC<PhotoDrawCanvasOverlayProps> = ({
  imageWidth,
  imageHeight,
  zoom,
  pan,
  brush,
  drawCanvas,
  drawVersion: _drawVersion,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const isDrawingRef = useRef(false);

  // Render accumulated strokes to display canvas without constant resizing
  useEffect(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (drawCanvas) {
      const drawW = imageWidth * zoom;
      const drawH = imageHeight * zoom;
      ctx.drawImage(drawCanvas, pan.x, pan.y, drawW, drawH);
    }
    ctx.restore();
  }, [imageWidth, imageHeight, zoom, pan, drawCanvas, _drawVersion]);

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { x, y } = toImageCoords(e.clientX, e.clientY);
    if (x < 0 || x > imageWidth || y < 0 || y > imageHeight) return;

    isDrawingRef.current = true;
    onStrokeStart(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      cursorRef.current.style.opacity = '1';
    }

    if (isDrawingRef.current) {
      const { x, y } = toImageCoords(e.clientX, e.clientY);
      onStrokeMove(x, y);
    }
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      onStrokeEnd();
    }
  };

  const cursorRadius = (brush.size / 2) * zoom;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => {
        if (cursorRef.current) cursorRef.current.style.opacity = '1';
      }}
      onMouseLeave={() => {
        if (cursorRef.current) cursorRef.current.style.opacity = '0';
        if (isDrawingRef.current) {
          isDrawingRef.current = false;
          onStrokeEnd();
        }
      }}
      className="absolute inset-0 select-none z-20 cursor-none"
    >
      <canvas ref={displayCanvasRef} className="absolute inset-0 block pointer-events-none" />

      {/* GPU transform hardware-accelerated brush cursor circle */}
      <div
        ref={cursorRef}
        className="absolute rounded-full border pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-75 opacity-0 will-change-transform"
        style={{
          width: cursorRadius * 2,
          height: cursorRadius * 2,
          borderColor: brush.color,
          backgroundColor: `${brush.color}25`,
          left: 0,
          top: 0,
          marginLeft: -cursorRadius,
          marginTop: -cursorRadius,
        }}
      />
    </div>
  );
};
