import { useState, useCallback, useRef, useEffect } from 'react';
import { serializeAsJSON } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { DEFAULT_WHITEBOARD_TITLE } from './WhiteboardConstants';
import { saveRecentWhiteboard } from './home/WhiteboardRecentStorage';
import { exportWhiteboard } from './WhiteboardExportHelper';

interface UseWhiteboardFileOpsProps {
  excalidrawApiRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
  latestSceneRef?: React.MutableRefObject<{ elements?: readonly any[]; appState?: any; files?: any } | null>;
  initialTitle?: string;
  initialFilePath?: string | null;
  boardId?: string;
}

export function useWhiteboardFileOps({
  excalidrawApiRef,
  latestSceneRef,
  initialTitle = DEFAULT_WHITEBOARD_TITLE,
  initialFilePath = null,
  boardId,
}: UseWhiteboardFileOpsProps) {
  const [title, setTitleState] = useState(initialTitle);
  const [currentFilePath, setCurrentFilePathState] = useState<string | null>(initialFilePath);
  const [statusText, setStatusText] = useState('All changes saved');
  const [isDirty, setIsDirty] = useState(false);

  const titleRef = useRef(initialTitle);
  const currentFilePathRef = useRef<string | null>(initialFilePath);
  const draftIdRef = useRef<string>(boardId || `board_${Date.now()}`);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const isDirtyRef = useRef(false);

  const setTitle = useCallback((newTitle: string) => {
    titleRef.current = newTitle;
    setTitleState(newTitle);
  }, []);

  const setCurrentFilePath = useCallback((newPath: string | null) => {
    currentFilePathRef.current = newPath;
    setCurrentFilePathState(newPath);
  }, []);

  const flashStatus = useCallback((msg: string) => {
    setStatusText(msg);
    if (msg !== 'Saving...') {
      setTimeout(() => setStatusText('All changes saved'), 2400);
    }
  }, []);

  const getSerializedSnapshot = useCallback((): string | null => {
    try {
      const api = excalidrawApiRef.current;
      let elements = api?.getSceneElements();
      let appState = api?.getAppState();
      let files = api?.getFiles();

      if ((!elements || elements.length === 0) && latestSceneRef?.current?.elements?.length) {
        elements = latestSceneRef.current.elements as any;
        appState = latestSceneRef.current.appState || appState;
        files = latestSceneRef.current.files || files;
      }

      if (!elements) return null;
      return serializeAsJSON(elements, appState || ({} as any), files || {}, 'local');
    } catch (err) {
      console.error('Failed to serialize Excalidraw snapshot:', err);
      return null;
    }
  }, [excalidrawApiRef, latestSceneRef]);

  // Execute background auto-save to disk quietly
  const flushAutoSave = useCallback(async (force = false): Promise<boolean> => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (!isDirtyRef.current && !force) return false;
    if (isSavingRef.current) return false;

    const content = getSerializedSnapshot();
    if (!content) return false;

    if (!window.solsticeAPI?.whiteboardAutoSave) return false;

    try {
      isSavingRef.current = true;
      setStatusText('Saving...');

      const activeTitle = titleRef.current;
      const activePath = currentFilePathRef.current;

      const res = await window.solsticeAPI.whiteboardAutoSave({
        filePath: activePath,
        title: activeTitle,
        content,
        draftId: draftIdRef.current,
      });

      if (res.success) {
        if (res.filePath && res.filePath !== currentFilePathRef.current) {
          setCurrentFilePath(res.filePath);
        }
        isDirtyRef.current = false;
        setIsDirty(false);
        saveRecentWhiteboard({
          id: res.filePath || draftIdRef.current,
          title: activeTitle || DEFAULT_WHITEBOARD_TITLE,
          filePath: res.filePath || activePath,
          lastModified: Date.now(),
        });
        setStatusText('All changes saved');
        return true;
      }
      setStatusText('Save failed');
      return false;
    } catch (err) {
      console.error('Auto-save error:', err);
      setStatusText('Save failed');
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [getSerializedSnapshot, setCurrentFilePath]);

  // Debounced auto-save schedule (1000ms after user pauses drawing)
  const scheduleAutoSave = useCallback(() => {
    isDirtyRef.current = true;
    setIsDirty(true);
    setStatusText('Unsaved changes');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      flushAutoSave();
    }, 1000);
  }, [flushAutoSave]);

  // Safe window close flush handshake
  useEffect(() => {
    if (window.solsticeAPI?.onSaveAndCloseRequested) {
      const unsub = window.solsticeAPI.onSaveAndCloseRequested(async () => {
        if (isDirtyRef.current) {
          await flushAutoSave(true);
        }
        window.solsticeAPI?.closeWindow?.(true);
      });
      return unsub;
    }
  }, [flushAutoSave]);

  // Before unload flush (only if unsaved dirty changes exist)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        flushAutoSave(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flushAutoSave]);

  // Manual Save As Dialog
  const handleSaveAs = useCallback(async () => {
    const content = getSerializedSnapshot();
    if (!content || !window.solsticeAPI?.whiteboardSaveFile) return;

    try {
      setStatusText('Saving...');
      const res = await window.solsticeAPI.whiteboardSaveFile({
        filePath: currentFilePathRef.current || undefined,
        title: titleRef.current,
        content,
      });

      if (res.success && res.filePath) {
        setCurrentFilePath(res.filePath);
        if (res.title) setTitle(res.title);
        isDirtyRef.current = false;
        setIsDirty(false);
        saveRecentWhiteboard({
          id: res.filePath,
          title: res.title || titleRef.current,
          filePath: res.filePath,
          lastModified: Date.now(),
        });
        flashStatus('Saved successfully');
      } else if (!res.canceled) {
        flashStatus('Save failed');
      } else {
        setStatusText(isDirtyRef.current ? 'Unsaved changes' : 'All changes saved');
      }
    } catch (err) {
      console.error('Save error:', err);
      flashStatus('Save failed');
    }
  }, [getSerializedSnapshot, setCurrentFilePath, setTitle, flashStatus]);

  // Keyboard shortcuts (Ctrl+S, Ctrl+Shift+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          flushAutoSave(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flushAutoSave, handleSaveAs]);

  // Export as PNG, SVG, or JSON
  const handleExport = useCallback(
    async (format: 'png' | 'svg' | 'json') => {
      const api = excalidrawApiRef.current;
      if (!api) return;
      await exportWhiteboard(api, titleRef.current, format, flashStatus);
    },
    [excalidrawApiRef, flashStatus]
  );

  return {
    title,
    setTitle,
    currentFilePath,
    setCurrentFilePath,
    statusText,
    isDirty,
    scheduleAutoSave,
    flushAutoSave,
    handleSaveAs,
    handleExport,
  };
}
