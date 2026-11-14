import { useState, useRef, useCallback, useEffect } from 'react';
import { PhotoToolType } from '@shared/types';
import { CutoutSubMode, BrushStrokeAction, MaskPreviewMode } from '../tools/PhotoCutoutInspector';
import { EraseToolMode } from '../tools/PhotoEraseInspector';
import { autoGenerateEdgeMask, floodSelectMask, applyMaskToImage } from '../tools/photoCutoutHelper';
import { inpaintObjectRemoval } from '../tools/photoInpaintHelper';
import { generateCutoutMaskWithAi } from '../tools/photoCutoutAiHelper';

interface UsePhotoCutoutProps {
  dimensions: { width: number; height: number };
  currentImageSrc: string;
  activeTool: PhotoToolType | null;
  setActiveTool: (tool: PhotoToolType | null) => void;
  onCommitImage: (dataUrl: string) => void;
}

export function usePhotoCutout({
  dimensions,
  currentImageSrc,
  activeTool,
  setActiveTool,
  onCommitImage,
}: UsePhotoCutoutProps) {
  const [subMode, setSubMode] = useState<CutoutSubMode>('auto');
  const [strokeAction, setStrokeAction] = useState<BrushStrokeAction>('erase');
  const [eraseMode, setEraseMode] = useState<EraseToolMode>('inpaint');
  const [inpaintRadius, setInpaintRadius] = useState<number>(6);
  const [brushSize, setBrushSize] = useState<number>(36);
  const [tolerance, setTolerance] = useState<number>(30);
  const [previewMode, setPreviewMode] = useState<MaskPreviewMode>('transparent');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maskVersion, setMaskVersion] = useState<number>(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const rafMaskRef = useRef<number | null>(null);

  useEffect(() => {
    if ((activeTool === 'cutout' || activeTool === 'erase') && dimensions.width > 0 && dimensions.height > 0) {
      if (!maskCanvasRef.current) maskCanvasRef.current = document.createElement('canvas');
      maskCanvasRef.current.width = dimensions.width;
      maskCanvasRef.current.height = dimensions.height;
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      setMaskVersion((v) => v + 1);
    }
  }, [activeTool, dimensions.width, dimensions.height]);

  // Fast classical edge-aware flood removal populates the interactive mask
  const handleClassicalAutoRemove = useCallback(() => {
    if (!currentImageSrc || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage('Tracing edges...');
    setTimeout(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentImageSrc;
      img.onload = () => {
        const edgeMaskCanvas = autoGenerateEdgeMask(img, { tolerance, featherRadius: 2 });
        if (maskCanvasRef.current) {
          const ctx = maskCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, dimensions.width, dimensions.height);
            ctx.drawImage(edgeMaskCanvas, 0, 0, dimensions.width, dimensions.height);
          }
        }
        setMaskVersion((v) => v + 1);
        setSubMode('brush');
        setStrokeAction('restore');
        setIsProcessing(false);
        setStatusMessage('Mask ready! Use Restore brush on hair/edges or click Apply.');
      };
      img.onerror = () => {
        setIsProcessing(false);
        setStatusMessage('');
      };
    }, 40);
  }, [currentImageSrc, isProcessing, tolerance, dimensions]);

  // AI Auto Background Removal: populates mask for live inspection & manual touch-up
  const handleAutoRemove = useCallback(async () => {
    if (!currentImageSrc || isProcessing) return;
    setIsProcessing(true);
    setProgressPercent(10);
    setStatusMessage('Analyzing subject...');

    try {
      const aiMaskCanvas = await generateCutoutMaskWithAi(currentImageSrc, (pct, msg) => {
        setProgressPercent(pct);
        setStatusMessage(msg);
      });
      if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);
          ctx.drawImage(aiMaskCanvas, 0, 0, dimensions.width, dimensions.height);
        }
      }
      setMaskVersion((v) => v + 1);
      setSubMode('brush');
      setStrokeAction('restore');
      setIsProcessing(false);
      setStatusMessage('Mask generated! Use Restore brush on hair/details or click Apply.');
    } catch (err) {
      console.warn('AI matting failed, falling back to edge detection:', err);
      handleClassicalAutoRemove();
    }
  }, [currentImageSrc, isProcessing, dimensions, handleClassicalAutoRemove]);

  const isDrawingStroke = useCallback(() => {
    if (activeTool === 'erase') return eraseMode !== 'restore';
    return strokeAction === 'erase';
  }, [activeTool, eraseMode, strokeAction]);

  const handleStrokeStart = useCallback((x: number, y: number) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastPointRef.current = { x, y };
    ctx.save();
    ctx.globalCompositeOperation = isDrawingStroke() ? 'source-over' : 'destination-out';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    setMaskVersion((v) => v + 1);
  }, [brushSize, isDrawingStroke]);

  const handleStrokeMove = useCallback((x: number, y: number) => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !lastPointRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = isDrawingStroke() ? 'source-over' : 'destination-out';
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x, y };
    if (!rafMaskRef.current) {
      rafMaskRef.current = requestAnimationFrame(() => {
        rafMaskRef.current = null;
        setMaskVersion((v) => v + 1);
      });
    }
  }, [brushSize, isDrawingStroke]);

  const handleStrokeEnd = useCallback(() => {
    lastPointRef.current = null;
    if (rafMaskRef.current) {
      cancelAnimationFrame(rafMaskRef.current);
      rafMaskRef.current = null;
    }
    setMaskVersion((v) => v + 1);
  }, []);

  const handleWandClick = useCallback((x: number, y: number) => {
    if (!currentImageSrc || dimensions.width === 0 || dimensions.height === 0) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = dimensions.width;
      off.height = dimensions.height;
      const offCtx = off.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0);
      const selMask = floodSelectMask(offCtx, dimensions.width, dimensions.height, x, y, tolerance);
      const mCanvas = maskCanvasRef.current;
      if (!mCanvas) return;
      const mCtx = mCanvas.getContext('2d');
      if (!mCtx) return;

      const mData = mCtx.getImageData(0, 0, dimensions.width, dimensions.height);
      const drawing = isDrawingStroke();
      for (let i = 0; i < dimensions.width * dimensions.height; i++) {
        if (selMask[i] === 1) mData.data[i * 4 + 3] = drawing ? 255 : 0;
      }
      mCtx.putImageData(mData, 0, 0);
      setMaskVersion((v) => v + 1);
    };
  }, [currentImageSrc, dimensions, tolerance, isDrawingStroke]);

  const handleInvertMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < canvas.width * canvas.height; i++) {
      imgData.data[i * 4 + 3] = 255 - imgData.data[i * 4 + 3];
    }
    ctx.putImageData(imgData, 0, 0);
    setMaskVersion((v) => v + 1);
  }, []);

  const handleResetMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMaskVersion((v) => v + 1);
  }, []);

  const handleApplyCutout = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || !currentImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      const transformedUrl = applyMaskToImage(img, maskCanvas, true);
      onCommitImage(transformedUrl);
      handleResetMask();
      setActiveTool(null);
    };
  }, [currentImageSrc, onCommitImage, handleResetMask, setActiveTool]);

  const handleInpaintObject = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || !currentImageSrc) return;
    setIsProcessing(true);
    setTimeout(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentImageSrc;
      img.onload = () => {
        try {
          const resultUrl = inpaintObjectRemoval(img, maskCanvas, { radius: inpaintRadius });
          onCommitImage(resultUrl);
          handleResetMask();
        } catch (err) {
          console.error('Inpaint object removal error:', err);
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => setIsProcessing(false);
    }, 40);
  }, [currentImageSrc, inpaintRadius, onCommitImage, handleResetMask]);

  const handleCancelCutout = useCallback(() => {
    handleResetMask();
    setActiveTool(null);
  }, [handleResetMask, setActiveTool]);

  return {
    subMode,
    setSubMode,
    strokeAction,
    setStrokeAction,
    eraseMode,
    setEraseMode,
    inpaintRadius,
    setInpaintRadius,
    brushSize,
    setBrushSize,
    tolerance,
    setTolerance,
    previewMode,
    setPreviewMode,
    isProcessing,
    statusMessage,
    progressPercent,
    maskCanvas: maskCanvasRef.current,
    maskVersion,
    handleAutoRemove,
    handleClassicalAutoRemove,
    handleStrokeStart,
    handleStrokeMove,
    handleStrokeEnd,
    handleWandClick,
    handleInvertMask,
    handleResetMask,
    handleApplyCutout,
    handleInpaintObject,
    handleCancelCutout,
  };
}
