import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PhotoTextOptions, drawTextOnContext } from '../tools/photoTextHelper';

interface PhotoTextCanvasOverlayProps {
  imageWidth: number;
  imageHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  options: PhotoTextOptions;
  onChangePosition: (x: number, y: number) => void;
}

export const PhotoTextCanvasOverlay: React.FC<PhotoTextCanvasOverlayProps> = ({
  imageWidth,
  imageHeight,
  zoom,
  pan,
  options,
  onChangePosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Render text on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Screen coordinates
    const screenX = pan.x + options.x * zoom;
    const screenY = pan.y + options.y * zoom;
    const screenFontSize = Math.max(10, options.fontSize * zoom);

    drawTextOnContext(ctx, {
      ...options,
      fontSize: screenFontSize,
      x: screenX,
      y: screenY,
    });

    // Draw dashed move box
    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    const boxPad = screenFontSize * 0.7;
    ctx.strokeRect(screenX - boxPad * 1.5, screenY - boxPad, boxPad * 3, boxPad * 2);
    ctx.restore();
  }, [options, zoom, pan, imageWidth, imageHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: options.x,
      startY: options.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = (e.clientX - dragStartRef.current.mouseX) / zoom;
      const dy = (e.clientY - dragStartRef.current.mouseY) / zoom;
      const nextX = Math.max(20, Math.min(imageWidth - 20, dragStartRef.current.startX + dx));
      const nextY = Math.max(20, Math.min(imageHeight - 20, dragStartRef.current.startY + dy));
      onChangePosition(Math.round(nextX), Math.round(nextY));
    },
    [isDragging, zoom, imageWidth, imageHeight, onChangePosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`absolute inset-0 select-none z-20 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      title="Drag to reposition text"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none" />
    </div>
  );
};
