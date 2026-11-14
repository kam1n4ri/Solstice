import { useState, useCallback, useEffect } from 'react';
import { PhotoToolType } from '@shared/types';
import { CropRect, applyCropTransform, applyFitTransform } from '../tools/photoTransformHelper';
import { AspectPreset } from '../tools/PhotoCropInspector';

interface UsePhotoTransformProps {
  dimensions: { width: number; height: number };
  currentImageSrc: string;
  activeTool: PhotoToolType | null;
  setActiveTool: (tool: PhotoToolType | null) => void;
  onCommitImage: (dataUrl: string) => void;
}

export function usePhotoTransform({
  dimensions,
  currentImageSrc,
  activeTool,
  setActiveTool,
  onCommitImage,
}: UsePhotoTransformProps) {
  // Crop states
  const [cropPreset, setCropPreset] = useState<string>('free');
  const [cropAspect, setCropAspect] = useState<number | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [straightenAngle, setStraightenAngle] = useState<number>(0);

  // Fit states
  const [fitPreset, setFitPreset] = useState<string>('1:1');
  const [fitFillType, setFitFillType] = useState<'blur' | 'color'>('blur');
  const [fitFillColor, setFitFillColor] = useState<string>('#ffffff');
  const [fitScale, setFitScale] = useState<number>(0.88);
  const [fitBorderRadius, setFitBorderRadius] = useState<number>(12);
  const [fitBorderWidth, setFitBorderWidth] = useState<number>(0);

  // Reset or initialize cropRect when crop tool is activated
  useEffect(() => {
    if (activeTool === 'crop' && dimensions.width > 0 && dimensions.height > 0) {
      setCropRect({
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
      });
      setCropPreset('free');
      setCropAspect(null);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setStraightenAngle(0);
    }
  }, [activeTool, dimensions.width, dimensions.height]);

  const handleSelectCropPreset = useCallback(
    (preset: AspectPreset) => {
      setCropPreset(preset.id);
      setCropAspect(preset.ratio);

      if (dimensions.width > 0 && dimensions.height > 0) {
        if (preset.ratio === null) {
          setCropRect({
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
          });
        } else {
          let targetW = dimensions.width;
          let targetH = Math.round(targetW / preset.ratio);
          if (targetH > dimensions.height) {
            targetH = dimensions.height;
            targetW = Math.round(targetH * preset.ratio);
          }
          setCropRect({
            x: Math.round((dimensions.width - targetW) / 2),
            y: Math.round((dimensions.height - targetH) / 2),
            width: targetW,
            height: targetH,
          });
        }
      }
    },
    [dimensions]
  );

  const handleRotateCw = useCallback(() => setRotation((r) => (r + 90) % 360), []);
  const handleRotateCcw = useCallback(() => setRotation((r) => (r - 90 + 360) % 360), []);
  const handleToggleFlipH = useCallback(() => setFlipH((f) => !f), []);
  const handleToggleFlipV = useCallback(() => setFlipV((f) => !f), []);
  const handleStraightenChange = useCallback((angle: number) => setStraightenAngle(angle), []);

  const handleApplyCrop = useCallback(() => {
    if (!currentImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      const finalRect = cropRect || {
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      const transformedUrl = applyCropTransform(img, {
        cropRect: finalRect,
        rotation: rotation + straightenAngle,
        flipH,
        flipV,
      });
      onCommitImage(transformedUrl);
      setCropRect(null);
      setActiveTool(null);
    };
  }, [currentImageSrc, cropRect, rotation, straightenAngle, flipH, flipV, onCommitImage, setActiveTool]);

  const handleCancelCrop = useCallback(() => {
    setCropRect(null);
    setCropPreset('free');
    setCropAspect(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setStraightenAngle(0);
    setActiveTool(null);
  }, [setActiveTool]);

  const handleSelectFitPreset = useCallback((preset: AspectPreset) => {
    setFitPreset(preset.id);
  }, []);

  const handleApplyFit = useCallback(() => {
    if (!currentImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      let ratio = 1;
      if (fitPreset === '4:5') ratio = 4 / 5;
      else if (fitPreset === '16:9') ratio = 16 / 9;
      else if (fitPreset === '9:16') ratio = 9 / 16;
      else if (fitPreset === '3:2') ratio = 3 / 2;
      else if (fitPreset === '4:3') ratio = 4 / 3;

      const transformedUrl = applyFitTransform(img, {
        aspectRatio: ratio,
        fillType: fitFillType,
        fillColor: fitFillColor,
        photoScale: fitScale,
        borderRadius: fitBorderRadius,
        borderWidth: fitBorderWidth,
      });
      onCommitImage(transformedUrl);
      setActiveTool(null);
    };
  }, [
    currentImageSrc,
    fitPreset,
    fitFillType,
    fitFillColor,
    fitScale,
    fitBorderRadius,
    fitBorderWidth,
    onCommitImage,
    setActiveTool,
  ]);

  const handleCancelFit = useCallback(() => {
    setActiveTool(null);
  }, [setActiveTool]);

  return {
    // Crop
    cropPreset,
    cropAspect,
    cropRect,
    setCropRect,
    rotation,
    flipH,
    flipV,
    straightenAngle,
    handleSelectCropPreset,
    handleRotateCw,
    handleRotateCcw,
    handleToggleFlipH,
    handleToggleFlipV,
    handleStraightenChange,
    handleApplyCrop,
    handleCancelCrop,

    // Fit
    fitPreset,
    fitFillType,
    setFitFillType,
    fitFillColor,
    setFitFillColor,
    fitScale,
    setFitScale,
    fitBorderRadius,
    setFitBorderRadius,
    fitBorderWidth,
    setFitBorderWidth,
    handleSelectFitPreset,
    handleApplyFit,
    handleCancelFit,
  };
}
