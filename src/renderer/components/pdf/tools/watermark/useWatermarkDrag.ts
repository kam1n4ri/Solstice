import { useState, useCallback, useEffect, useRef } from 'react';
import { WatermarkOptions } from './PdfWatermarkTypes';

interface UseWatermarkDragProps {
  options: WatermarkOptions;
  onChangePosition: (xPercent: number, yPercent: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface ActiveGuides {
  vertical?: number; // e.g. 50 (%)
  horizontal?: number; // e.g. 50 (%)
}

const SNAP_THRESHOLD_PERCENT = 3.5;

export function useWatermarkDrag({
  options,
  onChangePosition,
  containerRef,
}: UseWatermarkDragProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeGuides, setActiveGuides] = useState<ActiveGuides | null>(null);

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialXPercent: number;
    initialYPercent: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      setIsDragging(true);
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialXPercent: options.xPercent,
        initialYPercent: options.yPercent,
      };
    },
    [options.xPercent, options.yPercent]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current;
      const start = dragStartRef.current;
      if (!container || !start) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaX = e.clientX - start.startX;
      const deltaY = e.clientY - start.startY;

      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      let rawX = start.initialXPercent + deltaXPercent;
      let rawY = start.initialYPercent + deltaYPercent;

      const guides: ActiveGuides = {};

      // Horizontal Snaps (X Axis)
      if (Math.abs(rawX - 50) <= SNAP_THRESHOLD_PERCENT) {
        rawX = 50;
        guides.vertical = 50;
      } else if (Math.abs(rawX - 15) <= SNAP_THRESHOLD_PERCENT) {
        rawX = 15;
        guides.vertical = 15;
      } else if (Math.abs(rawX - 85) <= SNAP_THRESHOLD_PERCENT) {
        rawX = 85;
        guides.vertical = 85;
      }

      // Vertical Snaps (Y Axis)
      if (Math.abs(rawY - 50) <= SNAP_THRESHOLD_PERCENT) {
        rawY = 50;
        guides.horizontal = 50;
      } else if (Math.abs(rawY - 15) <= SNAP_THRESHOLD_PERCENT) {
        rawY = 15;
        guides.horizontal = 15;
      } else if (Math.abs(rawY - 85) <= SNAP_THRESHOLD_PERCENT) {
        rawY = 85;
        guides.horizontal = 85;
      }

      // Clamp within visible page margins (5% to 95%)
      const clampedX = Math.max(5, Math.min(95, Math.round(rawX * 10) / 10));
      const clampedY = Math.max(5, Math.min(95, Math.round(rawY * 10) / 10));

      setActiveGuides(Object.keys(guides).length > 0 ? guides : null);
      onChangePosition(clampedX, clampedY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setActiveGuides(null);
      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, containerRef, onChangePosition]);

  return {
    isDragging,
    activeGuides,
    handlePointerDown,
  };
}
