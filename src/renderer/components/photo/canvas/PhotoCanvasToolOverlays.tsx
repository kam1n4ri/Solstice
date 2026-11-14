import React from 'react';
import { PhotoToolType } from '@shared/types';
import { CropRect } from '../tools/photoTransformHelper';
import { PhotoCropOverlay } from './PhotoCropOverlay';
import { PhotoCutoutCanvasOverlay } from './PhotoCutoutCanvasOverlay';
import { PhotoDrawCanvasOverlay } from './PhotoDrawCanvasOverlay';
import { PhotoTextCanvasOverlay } from './PhotoTextCanvasOverlay';
import { MaskPreviewMode } from '../tools/PhotoCutoutInspector';
import { BrushSettings } from '../tools/photoDrawHelper';
import { PhotoTextOptions } from '../tools/photoTextHelper';

interface PhotoCanvasToolOverlaysProps {
  activeTool: PhotoToolType | null;
  imageWidth: number;
  imageHeight: number;
  zoom: number;
  pan: { x: number; y: number };

  // Crop
  cropRect?: CropRect | null;
  onChangeCropRect?: (rect: CropRect) => void;
  cropAspect?: number | null;

  // Cutout & Erase
  maskCanvas?: HTMLCanvasElement | null;
  maskVersion?: number;
  maskPreviewMode?: MaskPreviewMode;
  cutoutBrushSize?: number;
  isWandMode?: boolean;
  onStrokeStart?: (x: number, y: number) => void;
  onStrokeMove?: (x: number, y: number) => void;
  onStrokeEnd?: () => void;
  onWandClick?: (x: number, y: number) => void;

  // Draw
  drawBrush?: BrushSettings;
  drawCanvas?: HTMLCanvasElement | null;
  drawVersion?: number;
  onDrawStrokeStart?: (x: number, y: number) => void;
  onDrawStrokeMove?: (x: number, y: number) => void;
  onDrawStrokeEnd?: () => void;

  // Text
  textOptions?: PhotoTextOptions;
  onChangeTextPosition?: (x: number, y: number) => void;
}

export const PhotoCanvasToolOverlays: React.FC<PhotoCanvasToolOverlaysProps> = ({
  activeTool,
  imageWidth,
  imageHeight,
  zoom,
  pan,
  cropRect,
  onChangeCropRect,
  cropAspect,
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
  if (!activeTool || imageWidth === 0 || imageHeight === 0) return null;

  return (
    <>
      {activeTool === 'crop' && cropRect && onChangeCropRect && (
        <PhotoCropOverlay
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          zoom={zoom}
          pan={pan}
          aspectRatio={cropAspect || null}
          cropRect={cropRect}
          onChangeCropRect={onChangeCropRect}
        />
      )}

      {(activeTool === 'cutout' || activeTool === 'erase') &&
        onStrokeStart &&
        onStrokeMove &&
        onStrokeEnd &&
        onWandClick && (
          <PhotoCutoutCanvasOverlay
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            zoom={zoom}
            pan={pan}
            activeTool={activeTool}
            brushSize={cutoutBrushSize}
            isWandMode={isWandMode}
            previewMode={maskPreviewMode}
            maskCanvas={maskCanvas || null}
            maskVersion={maskVersion}
            onStrokeStart={onStrokeStart}
            onStrokeMove={onStrokeMove}
            onStrokeEnd={onStrokeEnd}
            onWandClick={onWandClick}
          />
        )}

      {activeTool === 'draw' &&
        drawBrush &&
        onDrawStrokeStart &&
        onDrawStrokeMove &&
        onDrawStrokeEnd && (
          <PhotoDrawCanvasOverlay
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            zoom={zoom}
            pan={pan}
            brush={drawBrush}
            drawCanvas={drawCanvas || null}
            drawVersion={drawVersion}
            onStrokeStart={onDrawStrokeStart}
            onStrokeMove={onDrawStrokeMove}
            onStrokeEnd={onDrawStrokeEnd}
          />
        )}

      {activeTool === 'text' && textOptions && onChangeTextPosition && (
        <PhotoTextCanvasOverlay
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          zoom={zoom}
          pan={pan}
          options={textOptions}
          onChangePosition={onChangeTextPosition}
        />
      )}
    </>
  );
};
