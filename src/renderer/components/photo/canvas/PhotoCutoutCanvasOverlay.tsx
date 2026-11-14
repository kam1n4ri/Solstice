import React, { useRef, useEffect, useCallback } from 'react';
import { MaskPreviewMode } from '../tools/PhotoCutoutInspector';

interface PhotoCutoutCanvasOverlayProps {
  imageWidth: number;
  imageHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  activeTool: 'cutout' | 'erase';
  brushSize: number;
  isWandMode: boolean;
  previewMode: MaskPreviewMode;
  maskCanvas: HTMLCanvasElement | null;
  maskVersion?: number;
  onStrokeStart: (x: number, y: number) => void;
  onStrokeMove: (x: number, y: number) => void;
  onStrokeEnd: () => void;
  onWandClick: (x: number, y: number) => void;
}

export const PhotoCutoutCanvasOverlay: React.FC<PhotoCutoutCanvasOverlayProps> = ({
  imageWidth,
  imageHeight,
  zoom,
  pan,
  activeTool: _activeTool,
  brushSize,
  isWandMode,
  previewMode,
  maskCanvas,
  maskVersion = 0,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onWandClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const isDrawingRef = useRef(false);

  // Render mask preview overlay (e.g. Red Roto wash)
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !containerRef.current || !maskCanvas) return;

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

    const drawW = imageWidth * zoom;
    const drawH = imageHeight * zoom;

    ctx.save();
    ctx.beginPath();
    ctx.rect(pan.x, pan.y, drawW, drawH);
    ctx.clip();

    if (previewMode === 'overlay') {
      // Draw semi-transparent red wash on masked/erased areas
      ctx.drawImage(maskCanvas, pan.x, pan.y, drawW, drawH);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.42)'; // Soft pale red tint
      ctx.fillRect(pan.x, pan.y, drawW, drawH);
    } else if (previewMode === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pan.x, pan.y, drawW, drawH);
    }

    ctx.restore();
    ctx.restore();
  }, [imageWidth, imageHeight, zoom, pan, previewMode, maskCanvas, maskVersion]);

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { x, y } = toImageCoords(e.clientX, e.clientY);
    if (x < 0 || x > imageWidth || y < 0 || y > imageHeight) return;

    if (isWandMode) {
      onWandClick(Math.round(x), Math.round(y));
    } else {
      isDrawingRef.current = true;
      onStrokeStart(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (cursorRef.current && !isWandMode) {
      cursorRef.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      cursorRef.current.style.opacity = '1';
    }

    if (isDrawingRef.current && !isWandMode) {
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

  const handleMouseLeave = () => {
    if (cursorRef.current) cursorRef.current.style.opacity = '0';
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      onStrokeEnd();
    }
  };

  const screenRadius = (brushSize / 2) * zoom;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => {
        if (cursorRef.current && !isWandMode) cursorRef.current.style.opacity = '1';
      }}
      onMouseLeave={handleMouseLeave}
      className={`absolute inset-0 select-none z-20 ${
        isWandMode ? 'cursor-crosshair' : 'cursor-none'
      }`}
    >
      <canvas ref={previewCanvasRef} className="absolute inset-0 block pointer-events-none" />

      {/* Hardware-accelerated Circular Brush Indicator */}
      {!isWandMode && (
        <div
          ref={cursorRef}
          className="absolute rounded-full border border-stone-800/60 bg-stone-400/15 pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-75 will-change-transform"
          style={{
            width: screenRadius * 2,
            height: screenRadius * 2,
            left: 0,
            top: 0,
            marginLeft: -screenRadius,
            marginTop: -screenRadius,
          }}
        />
      )}
    </div>
  );
};
