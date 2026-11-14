import React, { useState, useCallback } from 'react';
import { PhotoHeader } from './PhotoHeader';
import { PhotoLeftToolbar } from './PhotoLeftToolbar';
import { PhotoCanvas } from './PhotoCanvas';
import { PhotoRightPanel } from './PhotoRightPanel';
import { PhotoToolType } from '@shared/types';
import { ActivePhotoDocument } from './PhotoContainer';
import { usePhotoTransform } from './hooks/usePhotoTransform';
import { usePhotoAdjustments } from './hooks/usePhotoAdjustments';
import { usePhotoCutout } from './hooks/usePhotoCutout';
import { usePhotoDraw } from './hooks/usePhotoDraw';
import { usePhotoText } from './hooks/usePhotoText';
import { usePhotoShortcuts } from './hooks/usePhotoShortcuts';
import { upscaleImage, UpscaleOptions } from './tools/photoUpscaleHelper';
import { PhotoExportModal } from './export/PhotoExportModal';

interface PhotoWorkspaceProps {
  document: ActivePhotoDocument;
  onBackToHome: () => void;
}

export const PhotoWorkspace: React.FC<PhotoWorkspaceProps> = ({
  document,
  onBackToHome,
}) => {
  const [activeTool, setActiveTool] = useState<PhotoToolType | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [title, setTitle] = useState<string>(document.fileName.replace(/\.[^/.]+$/, '') || 'Untitled image');
  const [statusText, setStatusText] = useState<string>('Saved');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [upscaleProgress, setUpscaleProgress] = useState<number>(0);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<string[]>([document.dataUrl]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const currentImageSrc = history[historyIndex] || document.dataUrl;

  const handleCommitImage = useCallback(
    async (newDataUrl: string) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(newDataUrl);
        return next;
      });
      setHistoryIndex((prev) => prev + 1);

      if (document.filePath && window.solsticeAPI?.photoSaveFile) {
        try {
          setStatusText('Saving...');
          await window.solsticeAPI.photoSaveFile({
            filePath: document.filePath,
            dataUrl: newDataUrl,
          });
          setStatusText('Saved');
        } catch (err) {
          console.error('Failed to auto-save working copy:', err);
          setStatusText('Unsaved');
        }
      }
    },
    [historyIndex, document.filePath]
  );

  // Studio tool hook instances
  const transform = usePhotoTransform({
    dimensions,
    currentImageSrc,
    activeTool,
    setActiveTool,
    onCommitImage: handleCommitImage,
  });

  const tone = usePhotoAdjustments({
    currentImageSrc,
    activeTool,
    setActiveTool,
    onCommitImage: handleCommitImage,
    storageKey: document.filePath || document.fileName,
  });

  const cutout = usePhotoCutout({
    dimensions,
    currentImageSrc,
    activeTool,
    setActiveTool,
    onCommitImage: handleCommitImage,
  });

  const draw = usePhotoDraw({
    dimensions,
    currentImageSrc,
    activeTool,
    setActiveTool,
    onCommitImage: handleCommitImage,
  });

  const text = usePhotoText({
    dimensions,
    currentImageSrc,
    activeTool,
    setActiveTool,
    onCommitImage: handleCommitImage,
  });

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) setHistoryIndex((prev) => prev - 1);
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) setHistoryIndex((prev) => prev + 1);
  }, [historyIndex, history.length]);

  const handleDimensionsLoaded = useCallback((width: number, height: number) => {
    setDimensions((prev) => {
      if (prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(8.0, z * 1.25)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.05, z * 0.8)), []);
  const handleZoom100 = useCallback(() => setZoom(1.0), []);
  const handleZoomFit = useCallback(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const fitScale = Math.min(1.0, Math.min(800 / dimensions.width, 600 / dimensions.height));
      setZoom(Math.max(0.05, fitScale));
    }
  }, [dimensions]);

  usePhotoShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomFit: handleZoomFit,
    onZoom100: handleZoom100,
  });

  const handleRevealFolder = useCallback(() => {
    if (document.filePath && window.solsticeAPI?.revealInFolder) {
      window.solsticeAPI.revealInFolder(document.filePath);
    }
  }, [document.filePath]);

  const handleExportSuccess = useCallback(() => {
    setStatusText('Exported');
    setTimeout(() => setStatusText('Saved'), 3000);
  }, []);

  const handleRevertToOriginal = useCallback(async () => {
    if (!document.filePath || !window.solsticeAPI?.photoRevertToOriginal) return;
    const confirmed = window.confirm(
      'Are you sure you want to revert to the original image? All your edits will be discarded.'
    );
    if (!confirmed) return;

    try {
      setStatusText('Reverting...');
      const res = await window.solsticeAPI.photoRevertToOriginal(document.filePath);
      if (res.success && res.dataUrl) {
        setHistory([res.dataUrl]);
        setHistoryIndex(0);
        tone.handleResetAllAdjustments();
        setStatusText('Saved');
      } else {
        alert(res.error || 'Failed to revert to original image');
        setStatusText('Saved');
      }
    } catch (err) {
      console.error('Revert failed:', err);
      setStatusText('Saved');
    }
  }, [document.filePath]);

  const handleApplyUpscaleWithOptions = useCallback(
    async (options: UpscaleOptions) => {
      if (!currentImageSrc) return;
      setIsUpscaling(true);
      setUpscaleProgress(15);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentImageSrc;
      img.onload = async () => {
        try {
          const resultUrl = await upscaleImage(img, options, (p) => setUpscaleProgress(p));
          handleCommitImage(resultUrl);
          setActiveTool(null);
        } catch (err) {
          console.error('Upscale failed:', err);
        } finally {
          setIsUpscaling(false);
        }
      };
      img.onerror = () => setIsUpscaling(false);
    },
    [currentImageSrc, handleCommitImage, setActiveTool]
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-slate-800 font-sans">
      <PhotoHeader
        title={title}
        onTitleChange={setTitle}
        statusText={statusText}
        filePath={document.filePath}
        zoom={zoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        onZoom100={handleZoom100}
        onRevealFolder={handleRevealFolder}
        onRevertToOriginal={handleRevertToOriginal}
        onExport={() => setIsExportModalOpen(true)}
        onBackToHome={onBackToHome}
        onOpenUpscale={() => setActiveTool(activeTool === 'upscale' ? null : 'upscale')}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <PhotoLeftToolbar activeTool={activeTool} onSelectTool={setActiveTool} />

        <main className="flex-1 flex relative overflow-hidden">
          <PhotoCanvas
            imageSrc={currentImageSrc}
            zoom={zoom}
            onZoomChange={setZoom}
            onDimensionsLoaded={handleDimensionsLoaded}
            activeTool={activeTool}
            cropRect={transform.cropRect}
            onChangeCropRect={transform.setCropRect}
            cropAspect={transform.cropAspect}
            rotation={transform.rotation}
            flipH={transform.flipH}
            flipV={transform.flipV}
            straightenAngle={transform.straightenAngle}
            adjustments={tone.adjustments}
            filterPreset={activeTool === 'filters' ? tone.activeFilterPreset : undefined}
            filterIntensity={activeTool === 'filters' ? tone.filterIntensity : 100}
            maskCanvas={cutout.maskCanvas}
            maskVersion={cutout.maskVersion}
            maskPreviewMode={cutout.previewMode}
            cutoutBrushSize={cutout.brushSize}
            isWandMode={cutout.subMode === 'wand'}
            onStrokeStart={cutout.handleStrokeStart}
            onStrokeMove={cutout.handleStrokeMove}
            onStrokeEnd={cutout.handleStrokeEnd}
            onWandClick={cutout.handleWandClick}
            drawBrush={draw.brush}
            drawCanvas={draw.drawCanvas}
            drawVersion={draw.drawVersion}
            onDrawStrokeStart={draw.handleStrokeStart}
            onDrawStrokeMove={draw.handleStrokeMove}
            onDrawStrokeEnd={draw.handleStrokeEnd}
            textOptions={activeTool === 'text' ? text.options : undefined}
            onChangeTextPosition={text.handleChangePosition}
          />
        </main>

        <PhotoRightPanel
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          imageSrc={currentImageSrc}
          fileName={document.fileName}
          dimensions={dimensions}
          transform={transform}
          tone={tone}
          cutout={cutout}
          draw={draw}
          text={text}
          onApplyUpscale={handleApplyUpscaleWithOptions}
          onCancelUpscale={() => setActiveTool(null)}
          isUpscaling={isUpscaling}
          upscaleProgress={upscaleProgress}
        />
      </div>

      <PhotoExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentImageSrc={currentImageSrc}
        defaultTitle={title}
        dimensions={dimensions}
        adjustments={tone.adjustments}
        onExportSuccess={handleExportSuccess}
      />
    </div>
  );
};
