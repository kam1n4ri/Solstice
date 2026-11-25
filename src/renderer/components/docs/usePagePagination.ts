import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
  A4_PAGE_HEIGHT_PX,
  PAGE_PITCH_PX,
} from './paginationConstants';

export interface PagePaginationState {
  totalPages: number;
  currentPage: number;
}

/**
 * Calculates page boundaries and discrete page pagination for Solstice Docs.
 * In Print Layout mode:
 * - Dynamically determines content overflow using actual DOM scroll and element bounds.
 * - Synchronizes totalPages with physical sheets rendered in DocsPageSheetsBackground
 *   and CSS float seams in DocsPageBreakSpacers.
 * - Tracks viewport scroll to update the live current page indicator.
 */
export function usePagePagination(
  editor: Editor | null,
  pageContainerRef: React.RefObject<HTMLDivElement | null>,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  isPrintLayout: boolean,
  zoomLevel: number = 100
): PagePaginationState {
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rafIdRef = useRef<number | null>(null);

  const recalculateBreaks = useCallback(() => {
    if (!isPrintLayout || !pageContainerRef.current) {
      setTotalPages(1);
      return;
    }

    const container = pageContainerRef.current;
    const proseMirror = container.querySelector('.ProseMirror') as HTMLElement | null;
    if (!proseMirror) return;

    const scale = (zoomLevel || 100) / 100;
    const containerRect = container.getBoundingClientRect();

    // Check maximum extent of content elements
    let maxContentBottom = 0;
    const blocks = proseMirror.children;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i] as HTMLElement;
      if (block.classList.contains('DocsPageBreakSpacers')) continue;

      const bRect = block.getBoundingClientRect();
      const bBottom = (bRect.bottom - containerRect.top) / scale;
      if (bBottom > maxContentBottom) {
        maxContentBottom = bBottom;
      }
    }

    const unscaledScrollHeight =
      proseMirror.scrollHeight || proseMirror.offsetHeight || container.scrollHeight;
    const effectiveHeight = Math.max(unscaledScrollHeight, maxContentBottom);

    // Calculate required pages from the rendered content height:
    let calculatedPages = 1;
    while (effectiveHeight > (calculatedPages - 1) * PAGE_PITCH_PX + A4_PAGE_HEIGHT_PX) {
      calculatedPages++;
    }

    setTotalPages(calculatedPages);
  }, [isPrintLayout, pageContainerRef, zoomLevel]);

  // Debounced recalculation on requestAnimationFrame
  const scheduleRecalculate = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      recalculateBreaks();
    });
  }, [recalculateBreaks]);

  // Recalculate on editor changes or layout toggle
  useEffect(() => {
    scheduleRecalculate();
    if (!editor) return;

    editor.on('transaction', scheduleRecalculate);
    return () => {
      editor.off('transaction', scheduleRecalculate);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [editor, scheduleRecalculate]);

  // ResizeObserver for dynamic document layout changes
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container || !isPrintLayout) return;

    const observer = new ResizeObserver(() => {
      scheduleRecalculate();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isPrintLayout, pageContainerRef, scheduleRecalculate]);

  // Viewport scroll tracking for live current page indicator
  const updateCurrentPage = useCallback(() => {
    if (!scrollContainerRef.current || !pageContainerRef.current) return;
    const scrollContainer = scrollContainerRef.current;

    const scrollY = scrollContainer.scrollTop + scrollContainer.clientHeight / 3;
    const computedPage = Math.min(
      totalPages,
      Math.max(1, Math.floor(scrollY / (PAGE_PITCH_PX * ((zoomLevel || 100) / 100))) + 1)
    );

    setCurrentPage(computedPage);
  }, [scrollContainerRef, pageContainerRef, totalPages, zoomLevel]);

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    scrollEl.addEventListener('scroll', updateCurrentPage, { passive: true });
    updateCurrentPage();

    return () => {
      scrollEl.removeEventListener('scroll', updateCurrentPage);
    };
  }, [scrollContainerRef, updateCurrentPage]);

  return {
    totalPages,
    currentPage,
  };
}
