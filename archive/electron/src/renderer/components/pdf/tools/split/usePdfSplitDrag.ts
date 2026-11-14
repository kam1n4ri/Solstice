import { useState, useEffect, useCallback, useMemo } from 'react';
import { SplitPartition } from './PdfSplitTypes';

interface UsePdfSplitDragProps {
  activePartitionId: string | null;
  partitions: SplitPartition[];
  onUpdatePartition: (id: string, fromPage: number, toPage: number) => void;
  onSelectPartition: (id: string) => void;
  enabled?: boolean;
}

export function usePdfSplitDrag({
  activePartitionId,
  partitions,
  onUpdatePartition,
  onSelectPartition,
  enabled = true,
}: UsePdfSplitDragProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPage, setDragStartPage] = useState<number | null>(null);
  const [dragCurrentPage, setDragCurrentPage] = useState<number | null>(null);

  const handlePointerDown = useCallback(
    (pageNumber: number, e: React.PointerEvent) => {
      if (!enabled) return;
      // Only drag on primary left mouse click
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStartPage(pageNumber);
      setDragCurrentPage(pageNumber);
    },
    [enabled]
  );

  const handlePointerEnter = useCallback(
    (pageNumber: number) => {
      if (enabled && isDragging) {
        setDragCurrentPage(pageNumber);
      }
    },
    [enabled, isDragging]
  );

  // Global pointer up listener to commit drag selection anywhere on the window
  useEffect(() => {
    if (!isDragging) return;

    const onGlobalPointerUp = () => {
      if (dragStartPage !== null && dragCurrentPage !== null) {
        const from = Math.min(dragStartPage, dragCurrentPage);
        const to = Math.max(dragStartPage, dragCurrentPage);

        // If the user actually dragged across pages (or clicked a range)
        if (from !== to) {
          const targetId = activePartitionId || partitions[0]?.id;
          if (targetId) {
            onUpdatePartition(targetId, from, to);
            onSelectPartition(targetId);
          }
        }
      }

      setIsDragging(false);
      setDragStartPage(null);
      setDragCurrentPage(null);
    };

    window.addEventListener('pointerup', onGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', onGlobalPointerUp);
    };
  }, [isDragging, dragStartPage, dragCurrentPage, activePartitionId, partitions, onUpdatePartition, onSelectPartition]);

  const dragRange = useMemo(() => {
    if (!isDragging || dragStartPage === null || dragCurrentPage === null) return null;
    return {
      start: Math.min(dragStartPage, dragCurrentPage),
      end: Math.max(dragStartPage, dragCurrentPage),
    };
  }, [isDragging, dragStartPage, dragCurrentPage]);

  return {
    isDragging,
    dragRange,
    handlePointerDown,
    handlePointerEnter,
  };
}
