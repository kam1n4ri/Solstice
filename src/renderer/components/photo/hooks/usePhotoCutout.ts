import { useState, useRef, useCallback, useEffect } from 'react';
import { PhotoToolType } from '@shared/types';
import { CutoutSubMode, BrushStrokeAction, MaskPreviewMode } from '../tools/PhotoCutoutInspector';
import { EraseToolMode } from '../tools/PhotoEraseInspector';
import { autoGenerateEdgeMask, applyMaskToImage } from '../tools/photoCutoutHelper';
import { inpaintObjectRemoval } from '../tools/photoInpaintHelper';
import { generateCutoutMaskWithAi } from '../tools/photoCutoutAiHelper';
import {
  applyStrokeDot,
  applyStrokeLine,
  applyWandSelection,
  invertCanvasAlpha,
} from '../tools/photoMaskStrokeHelper';

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
  const [choke, setChoke] = useState<number>(0);
  const [feather, setFeather] = useState<number>(1);
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

  const handleClassicalAutoRemove = useCallback(() => {
    if (!currentImageSrc || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage('Tracing edges...');
    setTimeout(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentImageSrc;
      img.onload = () => {
        const edgeMask = autoGenerateEdgeMask(img, { tolerance, featherRadius: 2 });
        if (maskCanvasRef.current) {
          const ctx = maskCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, dimensions.width, dimensions.height);
            ctx.drawImage(edgeMask, 0, 0, dimensions.width, dimensions.height);
          }
        }
        setMaskVersion((v) => v + 1);
        setSubMode('brush');
        setStrokeAction('restore');
        setIsProcessing(false);
        setStatusMessage('Mask ready! Touch up with Keep/Erase brushes or click Apply.');
      };
      img.onerror = () => {
        setIsProcessing(false);
        setStatusMessage('');
      };
    }, 40);
  }, [currentImageSrc, isProcessing, tolerance, dimensions]);

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
      setStatusMessage('Cutout ready! Touch up with brushes or click Apply.');
    } catch (err) {
      console.warn('AI matting failed, falling back to edge detection:', err);
      handleClassicalAutoRemove();
    }
  }, [currentImageSrc, isProcessing, dimensions, handleClassicalAutoRemove]);

  const isDrawingErase = useCallback(() => {
    if (activeTool === 'erase') return eraseMode !== 'restore';
    return strokeAction === 'erase';
  }, [activeTool, eraseMode, strokeAction]);

  const handleStrokeStart = useCallback((x: number, y: number) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    lastPointRef.current = { x, y };
    applyStrokeDot(canvas, x, y, brushSize, isDrawingErase());
    setMaskVersion((v) => v + 1);
  }, [brushSize, isDrawingErase]);

  const handleStrokeMove = useCallback((x: number, y: number) => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !lastPointRef.current) return;
    applyStrokeLine(canvas, lastPointRef.current, { x, y }, brushSize, isDrawingErase());
    lastPointRef.current = { x, y };

    if (!rafMaskRef.current) {
      rafMaskRef.current = requestAnimationFrame(() => {
        rafMaskRef.current = null;
        setMaskVersion((v) => v + 1);
      });
    }
  }, [brushSize, isDrawingErase]);

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
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      applyWandSelection(canvas, img, dimensions.width, dimensions.height, x, y, tolerance, isDrawingErase());
      setMaskVersion((v) => v + 1);
    };
  }, [currentImageSrc, dimensions, tolerance, isDrawingErase]);

  const handleInvertMask = useCallback(() => {
    if (!maskCanvasRef.current) return;
    invertCanvasAlpha(maskCanvasRef.current);
    setMaskVersion((v) => v + 1);
  }, []);

  const handleResetMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMaskVersion((v) => v + 1);
  }, []);

  const handleApplyCutout = useCallback(async () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || !currentImageSrc) return;

    try {
      setIsProcessing(true);
      setStatusMessage('Refining edges in Rust SIMD engine...');

      if (window.solsticeAPI?.photoRefineCutout) {
        const maskDataUrl = maskCanvas.toDataURL('image/png');
        const refinedCutoutUrl = await window.solsticeAPI.photoRefineCutout({
          imageDataUrl: currentImageSrc,
          maskDataUrl,
          choke,
          feather,
        });
        onCommitImage(refinedCutoutUrl);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = currentImageSrc;
        await new Promise((resolve) => {
          img.onload = () => {
            const transformedUrl = applyMaskToImage(img, maskCanvas, true);
            onCommitImage(transformedUrl);
            resolve(null);
          };
        });
      }
      handleResetMask();
      setActiveTool(null);
    } catch (err) {
      console.error('Failed to apply cutout:', err);
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  }, [currentImageSrc, choke, feather, onCommitImage, handleResetMask, setActiveTool]);

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
    choke,
    setChoke,
    feather,
    setFeather,
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
