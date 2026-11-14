import { useState, useRef, useCallback, useEffect } from 'react';
import { PhotoToolType } from '@shared/types';
import {
  BrushSettings,
  DEFAULT_BRUSH,
  DrawPoint,
  drawStrokeSegment,
  commitDrawingToImage,
} from '../tools/photoDrawHelper';

interface UsePhotoDrawProps {
  dimensions: { width: number; height: number };
  currentImageSrc: string;
  activeTool: PhotoToolType | null;
  setActiveTool: (tool: PhotoToolType | null) => void;
  onCommitImage: (dataUrl: string) => void;
}

export function usePhotoDraw({
  dimensions,
  currentImageSrc,
  activeTool,
  setActiveTool,
  onCommitImage,
}: UsePhotoDrawProps) {
  const [brush, setBrush] = useState<BrushSettings>(DEFAULT_BRUSH);
  const [drawVersion, setDrawVersion] = useState<number>(0);

  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<DrawPoint | null>(null);
  const rafDrawRef = useRef<number | null>(null);

  // Initialize offscreen drawing canvas
  useEffect(() => {
    if (activeTool === 'draw' && dimensions.width > 0 && dimensions.height > 0) {
      if (!drawCanvasRef.current) {
        drawCanvasRef.current = document.createElement('canvas');
      }
      drawCanvasRef.current.width = dimensions.width;
      drawCanvasRef.current.height = dimensions.height;
      const ctx = drawCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      }
      setDrawVersion((v) => v + 1);
    }
  }, [activeTool, dimensions.width, dimensions.height]);

  const handleChangeBrush = useCallback(
    <K extends keyof BrushSettings>(key: K, value: BrushSettings[K]) => {
      setBrush((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleStrokeStart = useCallback((x: number, y: number) => {
    lastPointRef.current = { x, y };
  }, []);

  const handleStrokeMove = useCallback(
    (x: number, y: number) => {
      const canvas = drawCanvasRef.current;
      if (!canvas || !lastPointRef.current) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const to: DrawPoint = { x, y };
      drawStrokeSegment(ctx, lastPointRef.current, to, brush);
      lastPointRef.current = to;

      if (!rafDrawRef.current) {
        rafDrawRef.current = requestAnimationFrame(() => {
          rafDrawRef.current = null;
          setDrawVersion((v) => v + 1);
        });
      }
    },
    [brush]
  );

  const handleStrokeEnd = useCallback(() => {
    lastPointRef.current = null;
    if (rafDrawRef.current) {
      cancelAnimationFrame(rafDrawRef.current);
      rafDrawRef.current = null;
    }
    setDrawVersion((v) => v + 1);
  }, []);

  const handleClearDrawing = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawVersion((v) => v + 1);
  }, []);

  const handleApplyDrawing = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !currentImageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      const resultUrl = commitDrawingToImage(img, canvas);
      onCommitImage(resultUrl);
      handleClearDrawing();
      setActiveTool(null);
    };
  }, [currentImageSrc, onCommitImage, handleClearDrawing, setActiveTool]);

  const handleCancelDrawing = useCallback(() => {
    handleClearDrawing();
    setActiveTool(null);
  }, [handleClearDrawing, setActiveTool]);

  return {
    brush,
    drawVersion,
    drawCanvas: drawCanvasRef.current,
    handleChangeBrush,
    handleStrokeStart,
    handleStrokeMove,
    handleStrokeEnd,
    handleClearDrawing,
    handleApplyDrawing,
    handleCancelDrawing,
  };
}
