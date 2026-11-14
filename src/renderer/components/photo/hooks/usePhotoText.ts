import { useState, useCallback, useEffect } from 'react';
import { PhotoToolType } from '@shared/types';
import {
  PhotoTextOptions,
  DEFAULT_TEXT_OPTIONS,
  commitTextToImage,
} from '../tools/photoTextHelper';

interface UsePhotoTextProps {
  dimensions: { width: number; height: number };
  currentImageSrc: string;
  activeTool: PhotoToolType | null;
  setActiveTool: (tool: PhotoToolType | null) => void;
  onCommitImage: (dataUrl: string) => void;
}

export function usePhotoText({
  dimensions,
  currentImageSrc,
  activeTool,
  setActiveTool,
  onCommitImage,
}: UsePhotoTextProps) {
  const [options, setOptions] = useState<PhotoTextOptions>({
    ...DEFAULT_TEXT_OPTIONS,
    x: dimensions.width > 0 ? Math.round(dimensions.width / 2) : 200,
    y: dimensions.height > 0 ? Math.round(dimensions.height / 2) : 200,
  });

  // Re-center text when opening tool
  useEffect(() => {
    if (activeTool === 'text' && dimensions.width > 0 && dimensions.height > 0) {
      setOptions((prev) => ({
        ...prev,
        x: Math.round(dimensions.width / 2),
        y: Math.round(dimensions.height / 2),
        fontSize: Math.max(16, Math.round(dimensions.width * 0.05)),
      }));
    }
  }, [activeTool, dimensions.width, dimensions.height]);

  const handleChangeOption = useCallback(
    <K extends keyof PhotoTextOptions>(key: K, value: PhotoTextOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleChangePosition = useCallback((x: number, y: number) => {
    setOptions((prev) => ({ ...prev, x, y }));
  }, []);

  const handleApplyText = useCallback(() => {
    if (!currentImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      const resultUrl = commitTextToImage(img, options);
      onCommitImage(resultUrl);
      setActiveTool(null);
    };
  }, [currentImageSrc, options, onCommitImage, setActiveTool]);

  const handleCancelText = useCallback(() => {
    setActiveTool(null);
  }, [setActiveTool]);

  return {
    options,
    handleChangeOption,
    handleChangePosition,
    handleApplyText,
    handleCancelText,
  };
}
