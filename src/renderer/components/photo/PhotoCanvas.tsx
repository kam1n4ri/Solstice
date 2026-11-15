import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { PhotoCanvasProps } from './canvas/PhotoCanvasProps';
import { PhotoCanvasToolOverlays } from './canvas/PhotoCanvasToolOverlays';
import { renderAdjustedImage } from './tools/photoFilterHelper';

let cachedCheckerboardPattern: CanvasPattern | null = null;
function getCheckerboard(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (cachedCheckerboardPattern) return cachedCheckerboardPattern;
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 24;
  pCanvas.height = 24;
  const pctx = pCanvas.getContext('2d');
  if (pctx) {
    pctx.fillStyle = '#f5f5f4';
    pctx.fillRect(0, 0, 24, 24);
    pctx.fillStyle = '#e7e5e4';
    pctx.fillRect(0, 0, 12, 12);
    pctx.fillRect(12, 12, 12, 12);
    cachedCheckerboardPattern = ctx.createPattern(pCanvas, 'repeat');
  }
  return cachedCheckerboardPattern;
}

export const PhotoCanvas: React.FC<PhotoCanvasProps> = memo(({
  imageSrc,
  zoom,
  onZoomChange,
  onDimensionsLoaded,
  activeTool,
  cropRect,
  onChangeCropRect,
  cropAspect = null,
  rotation = 0,
  flipH = false,
  flipV = false,
  straightenAngle = 0,
  adjustments,
  filterPreset,
  filterIntensity = 100,
  maskCanvas,
  maskVersion = 0,
  maskPreviewMode = 'overlay',
  cutoutBrushSize = 36,
  isWandMode = false,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onWandClick,
  drawBrush,
  drawCanvas,
  drawVersion = 0,
  onDrawStrokeStart,
  onDrawStrokeMove,
  onDrawStrokeEnd,
  textOptions,
  onChangeTextPosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const loadedSrcRef = useRef<string | null>(null);
  const onDimensionsLoadedRef = useRef(onDimensionsLoaded);
  onDimensionsLoadedRef.current = onDimensionsLoaded;
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  useEffect(() => {
    if (!imageSrc) return;
    if (loadedSrcRef.current === imageSrc) return;
    loadedSrcRef.current = imageSrc;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageObjRef.current = img;
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      onDimensionsLoadedRef.current?.(img.naturalWidth, img.naturalHeight);

      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const scaleX = (clientWidth - 100) / img.naturalWidth;
        const scaleY = (clientHeight - 100) / img.naturalHeight;
        const fitScale = Math.min(1.0, Math.max(0.05, Math.min(scaleX, scaleY)));
        onZoomChangeRef.current?.(fitScale);
        setPan({
          x: (clientWidth - img.naturalWidth * fitScale) / 2,
          y: (clientHeight - img.naturalHeight * fitScale) / 2,
        });
      }
    };
  }, [imageSrc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextZoom = Math.min(8.0, Math.max(0.05, zoom * factor));
      const scaleChange = nextZoom / zoom;
      setPan({
        x: mouseX - (mouseX - pan.x) * scaleChange,
        y: mouseY - (mouseY - pan.y) * scaleChange,
      });
      onZoomChange(nextZoom);
    },
    [zoom, pan, onZoomChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1 || (e.button === 0 && !activeTool)) {
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    }
  };

  const rafPanRef = useRef<number | null>(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const targetX = panStartRef.current.x + (e.clientX - dragStartRef.current.x);
    const targetY = panStartRef.current.y + (e.clientY - dragStartRef.current.y);
    if (rafPanRef.current) cancelAnimationFrame(rafPanRef.current);
    rafPanRef.current = requestAnimationFrame(() => {
      setPan({ x: targetX, y: targetY });
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

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

    const img = imageObjRef.current;
    if (!img) {
      ctx.restore();
      return;
    }

    const drawW = img.naturalWidth * zoom;
    const drawH = img.naturalHeight * zoom;

    ctx.save();
    const cx = pan.x + drawW / 2;
    const cy = pan.y + drawH / 2;
    ctx.translate(cx, cy);
    const totalRotation = rotation + straightenAngle;
    if (totalRotation !== 0) ctx.rotate((totalRotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-cx, -cy);

    // Fast GPU Checkerboard or Solid Studio Backdrop
    if (activeTool === 'cutout' && maskPreviewMode === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pan.x, pan.y, drawW, drawH);
    } else if (activeTool === 'cutout' && maskPreviewMode === 'black') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(pan.x, pan.y, drawW, drawH);
    } else {
      const pattern = getCheckerboard(ctx);
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(pan.x, pan.y, drawW, drawH);
      }
    }

    // Image
    ctx.save();
    renderAdjustedImage(ctx, img, pan.x, pan.y, drawW, drawH, adjustments, filterPreset, filterIntensity);

    if ((activeTool === 'cutout' || activeTool === 'erase') && maskCanvas && maskPreviewMode !== 'overlay') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(maskCanvas, pan.x, pan.y, drawW, drawH);
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pan.x, pan.y, drawW, drawH);
    ctx.restore();
    ctx.restore();
  }, [
    zoom,
    pan,
    dimensions,
    rotation,
    flipH,
    flipV,
    straightenAngle,
    adjustments,
    filterPreset,
    filterIntensity,
    activeTool,
    maskCanvas,
    maskVersion,
    maskPreviewMode,
  ]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsPanning(false)}
      onMouseLeave={() => setIsPanning(false)}
      className={`flex-1 w-full h-full relative overflow-hidden bg-[#f4f5f7] select-none ${
        isSpacePressed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none" />

      <PhotoCanvasToolOverlays
        activeTool={activeTool || null}
        imageWidth={dimensions.width}
        imageHeight={dimensions.height}
        zoom={zoom}
        pan={pan}
        cropRect={cropRect}
        onChangeCropRect={onChangeCropRect}
        cropAspect={cropAspect}
        maskCanvas={maskCanvas}
        maskVersion={maskVersion}
        maskPreviewMode={maskPreviewMode}
        cutoutBrushSize={cutoutBrushSize}
        isWandMode={isWandMode}
        onStrokeStart={onStrokeStart}
        onStrokeMove={onStrokeMove}
        onStrokeEnd={onStrokeEnd}
        onWandClick={onWandClick}
        drawBrush={drawBrush}
        drawCanvas={drawCanvas}
        drawVersion={drawVersion}
        onDrawStrokeStart={onDrawStrokeStart}
        onDrawStrokeMove={onDrawStrokeMove}
        onDrawStrokeEnd={onDrawStrokeEnd}
        textOptions={textOptions}
        onChangeTextPosition={onChangeTextPosition}
      />

      {dimensions.width > 0 && (
        <div className="absolute bottom-3 left-4 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-stone-200/80 text-[11px] font-mono text-slate-600 shadow-xs flex items-center gap-2 pointer-events-none z-10">
          <span>{dimensions.width} × {dimensions.height} px</span>
        </div>
      )}
    </div>
  );
});
