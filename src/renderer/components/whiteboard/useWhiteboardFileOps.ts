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
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);
  const editVersionRef = useRef(0);
  const isDirtyRef = useRef(false);

  const setCurrentFilePath = useCallback((newPath: string | null) => {
    currentFilePathRef.current = newPath;
    setCurrentFilePathState(newPath);
  }, []);

  const flashStatus = useCallback((msg: string) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    setStatusText(msg);
    if (msg !== 'Saving...') {
      statusTimerRef.current = setTimeout(() => {
        statusTimerRef.current = null;
        setStatusText(isDirtyRef.current ? 'Unsaved changes' : 'All changes saved');
      }, 2400);
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

  // Execute background auto-save to disk sequentially without dropping concurrent edits
  const flushAutoSave = useCallback(async (force = false): Promise<boolean> => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    while (inFlightSaveRef.current) {
      await inFlightSaveRef.current;
    }

    if (!isDirtyRef.current && !force) return true;
    const content = getSerializedSnapshot();
    const autoSaveFn = window.solsticeAPI?.whiteboardAutoSave;
    if (!content || !autoSaveFn) return false;

    let shouldRetry = false;
    const savePromise = (async (): Promise<boolean> => {
      const versionAtStart = editVersionRef.current;
      setStatusText('Saving...');

      try {
        const activeTitle = titleRef.current;
        const activePath = currentFilePathRef.current;
        const res = await autoSaveFn({
          filePath: activePath,
          title: activeTitle,
          content,
          draftId: draftIdRef.current,
        });

        if (res.success) {
          if (res.filePath && res.filePath !== currentFilePathRef.current) {
            setCurrentFilePath(res.filePath);
          }
          saveRecentWhiteboard({
            id: res.filePath || draftIdRef.current,
            title: activeTitle || DEFAULT_WHITEBOARD_TITLE,
            filePath: res.filePath || activePath,
            lastModified: Date.now(),
          });
          if (editVersionRef.current === versionAtStart) {
            isDirtyRef.current = false;
            setIsDirty(false);
            setStatusText('All changes saved');
          } else {
            shouldRetry = true;
          }
          return true;
        }
        setStatusText('Save failed');
        return false;
      } catch (err) {
        console.error('Auto-save error:', err);
        setStatusText('Save failed');
        return false;
      } finally {
        inFlightSaveRef.current = null;
      }
    })();

    inFlightSaveRef.current = savePromise;
    const ok = await savePromise;
    if (shouldRetry && force) {
      return await flushAutoSave(false);
    }
    return ok;
  }, [getSerializedSnapshot, setCurrentFilePath]);

  const scheduleAutoSave = useCallback(() => {
    editVersionRef.current += 1;
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

  const setTitle = useCallback((newTitle: string) => {
    titleRef.current = newTitle;
    setTitleState(newTitle);
  }, []);

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
        if (res.title) {
          titleRef.current = res.title;
          setTitleState(res.title);
        }
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
  }, [getSerializedSnapshot, setCurrentFilePath, flashStatus]);

  const flushAutoSaveRef = useRef(flushAutoSave);
  flushAutoSaveRef.current = flushAutoSave;
  const handleSaveAsRef = useRef(handleSaveAs);
  handleSaveAsRef.current = handleSaveAs;

  // Single mount-bound listeners (prevents duplicate listeners and effect-cleanup double-saves)
  useEffect(() => {
    const unsubClose = window.solsticeAPI?.onSaveAndCloseRequested?.(async () => {
      if (isDirtyRef.current) {
        await flushAutoSaveRef.current(true);
      }
      window.solsticeAPI?.closeWindow?.(true);
    });

    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        flushAutoSaveRef.current(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAsRef.current();
        } else {
          flushAutoSaveRef.current(true);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubClose?.();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (isDirtyRef.current) {
        flushAutoSaveRef.current(true);
      }
    };
  }, []);

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
