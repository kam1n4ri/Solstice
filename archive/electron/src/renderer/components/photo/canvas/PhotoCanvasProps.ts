import { PhotoToolType } from '@shared/types';
import { CropRect } from '../tools/photoTransformHelper';
import { MaskPreviewMode } from '../tools/PhotoCutoutInspector';
import { BrushSettings } from '../tools/photoDrawHelper';
import { PhotoTextOptions } from '../tools/photoTextHelper';
import { PhotoAdjustments, FilterPreset } from '../tools/photoFilterHelper';

export interface PhotoCanvasProps {
  imageSrc: string;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onDimensionsLoaded?: (width: number, height: number) => void;
  activeTool?: PhotoToolType | null;

  // Crop
  cropRect?: CropRect | null;
  onChangeCropRect?: (rect: CropRect) => void;
  cropAspect?: number | null;
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  straightenAngle?: number;

  // Adjust & Filters
  adjustments?: PhotoAdjustments;
  filterPreset?: FilterPreset;
  filterIntensity?: number;

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
