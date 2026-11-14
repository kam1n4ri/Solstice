import { useState, useCallback, useMemo, useEffect } from 'react';
import { PhotoToolType } from '@shared/types';
import {
  PhotoAdjustments,
  DEFAULT_ADJUSTMENTS,
  FILTER_PRESETS,
  FilterPreset,
  applyToneAndFilterTransform,
} from '../tools/photoFilterHelper';

interface UsePhotoAdjustmentsProps {
  currentImageSrc: string;
  activeTool: PhotoToolType | null;
  setActiveTool: (tool: PhotoToolType | null) => void;
  onCommitImage: (dataUrl: string) => void;
  storageKey?: string | null;
}

function getInitialAdjustments(key?: string | null): PhotoAdjustments {
  if (!key) return DEFAULT_ADJUSTMENTS;
  try {
    const raw = localStorage.getItem(`solstice:adjustments:${key}`);
    if (raw) return { ...DEFAULT_ADJUSTMENTS, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_ADJUSTMENTS;
}

export function usePhotoAdjustments({
  currentImageSrc,
  activeTool: _activeTool,
  setActiveTool,
  onCommitImage,
  storageKey,
}: UsePhotoAdjustmentsProps) {
  // Adjustments state (persisted per project/file)
  const [adjustments, setAdjustments] = useState<PhotoAdjustments>(() =>
    getInitialAdjustments(storageKey)
  );

  useEffect(() => {
    if (!storageKey) return;
    try {
      const isModified = Object.values(adjustments).some((v) => v !== 0);
      if (isModified) {
        localStorage.setItem(`solstice:adjustments:${storageKey}`, JSON.stringify(adjustments));
      } else {
        localStorage.removeItem(`solstice:adjustments:${storageKey}`);
      }
    } catch {
      // ignore
    }
  }, [adjustments, storageKey]);

  // Filters state
  const [selectedFilterId, setSelectedFilterId] = useState<string>('normal');
  const [filterIntensity, setFilterIntensity] = useState<number>(100);

  const activeFilterPreset = useMemo(
    () => FILTER_PRESETS.find((p) => p.id === selectedFilterId) || FILTER_PRESETS[0],
    [selectedFilterId]
  );

  const handleChangeAdjustment = useCallback(
    <K extends keyof PhotoAdjustments>(key: K, value: PhotoAdjustments[K]) => {
      setAdjustments((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleResetAllAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    if (storageKey) {
      try {
        localStorage.removeItem(`solstice:adjustments:${storageKey}`);
      } catch {
        // ignore
      }
    }
  }, [storageKey]);

  const handleApplyAdjustments = useCallback(() => {
    setActiveTool(null);
  }, [setActiveTool]);

  const handleCancelAdjustments = useCallback(() => {
    setActiveTool(null);
  }, [setActiveTool]);

  const handleSelectFilter = useCallback((preset: FilterPreset) => {
    setSelectedFilterId(preset.id);
    setFilterIntensity(100);
  }, []);

  const handleApplyFilter = useCallback(() => {
    if (!currentImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      const transformedUrl = applyToneAndFilterTransform(
        img,
        DEFAULT_ADJUSTMENTS,
        activeFilterPreset,
        filterIntensity
      );
      onCommitImage(transformedUrl);
      setSelectedFilterId('normal');
      setFilterIntensity(100);
      setActiveTool(null);
    };
  }, [currentImageSrc, activeFilterPreset, filterIntensity, onCommitImage, setActiveTool]);

  const handleCancelFilter = useCallback(() => {
    setSelectedFilterId('normal');
    setFilterIntensity(100);
    setActiveTool(null);
  }, [setActiveTool]);

  return {
    // Adjustments
    adjustments,
    handleChangeAdjustment,
    handleResetAllAdjustments,
    handleApplyAdjustments,
    handleCancelAdjustments,

    // Filters
    selectedFilterId,
    filterIntensity,
    activeFilterPreset,
    handleSelectFilter,
    setFilterIntensity,
    handleApplyFilter,
    handleCancelFilter,
  };
}
