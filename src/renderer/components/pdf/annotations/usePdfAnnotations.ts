import { useState, useCallback, useEffect } from 'react';
import {
  AnnotationTool,
  PdfAnnotation,
  HIGHLIGHT_COLORS,
  PEN_COLORS,
} from './PdfAnnotationTypes';
import { embedAnnotationsIntoPdf } from './PdfAnnotationSaver';

export function usePdfAnnotations() {
  const [history, setHistory] = useState<{
    past: PdfAnnotation[][];
    present: PdfAnnotation[];
    future: PdfAnnotation[][];
  }>({
    past: [],
    present: [],
    future: [],
  });

  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [highlightColor, setHighlightColor] = useState<string>(HIGHLIGHT_COLORS[0].color);
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0].hex);
  const [penWidth, setPenWidth] = useState<number>(2);

  const annotations = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const addAnnotation = useCallback((annotation: PdfAnnotation) => {
    setHistory((curr) => ({
      past: [...curr.past.slice(-49), curr.present],
      present: [...curr.present, annotation],
      future: [],
    }));
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setHistory((curr) => ({
      past: [...curr.past.slice(-49), curr.present],
      present: curr.present.filter((ann) => ann.id !== id),
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future.slice(0, 49)],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      return {
        past: [...curr.past.slice(-49), curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // Keyboard shortcut handler for tool switching and undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z (without shift)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'p':
          setActiveTool('pen');
          break;
        case 'h':
          setActiveTool('highlight');
          break;
        case 'escape':
          setActiveTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const exportDocumentWithAnnotations = useCallback(
    async (originalBytes: Uint8Array): Promise<Uint8Array> => {
      return await embedAnnotationsIntoPdf(originalBytes, annotations);
    },
    [annotations]
  );

  return {
    annotations,
    activeTool,
    setActiveTool,
    highlightColor,
    setHighlightColor,
    penColor,
    setPenColor,
    penWidth,
    setPenWidth,
    addAnnotation,
    deleteAnnotation,
    undo,
    redo,
    canUndo,
    canRedo,
    exportDocumentWithAnnotations,
  };
}
