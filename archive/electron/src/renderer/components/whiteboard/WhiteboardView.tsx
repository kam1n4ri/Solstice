import React, { useRef, useCallback, useEffect } from 'react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { WhiteboardHeader } from './WhiteboardHeader';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { useWhiteboardFileOps } from './useWhiteboardFileOps';
import { WhiteboardInitialData, DEFAULT_WHITEBOARD_TITLE } from './WhiteboardConstants';

interface WhiteboardViewProps {
  initialBoard?: WhiteboardInitialData | null;
  onBackToHome?: () => void;
}

export const WhiteboardView: React.FC<WhiteboardViewProps> = ({
  initialBoard,
  onBackToHome,
}) => {
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const latestSceneRef = useRef<{ elements?: readonly any[]; appState?: any; files?: any } | null>(null);

  const {
    title,
    setTitle,
    currentFilePath,
    statusText,
    isDirty,
    scheduleAutoSave,
    flushAutoSave,
    handleExport,
  } = useWhiteboardFileOps({
    excalidrawApiRef,
    latestSceneRef,
    initialTitle: initialBoard?.title || DEFAULT_WHITEBOARD_TITLE,
    initialFilePath: initialBoard?.filePath || null,
    boardId: initialBoard?.boardId,
  });

  const handleApiReady = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawApiRef.current = api;
  }, []);

  const handleCanvasChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      latestSceneRef.current = { elements, appState, files };
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const handleBackToHome = useCallback(async () => {
    if (isDirty) {
      await flushAutoSave(true);
    }
    onBackToHome?.();
  }, [isDirty, flushAutoSave, onBackToHome]);

  // Synchronize dirty state to Main process
  useEffect(() => {
    window.solsticeAPI?.whiteboardSetDirty?.(isDirty);
  }, [isDirty]);

  useEffect(() => {
    return () => {
      window.solsticeAPI?.whiteboardSetDirty?.(false);
    };
  }, []);

  // Flush pending canvas changes when window close is requested
  useEffect(() => {
    if (window.solsticeAPI?.onSaveAndCloseRequested) {
      const unsubscribe = window.solsticeAPI.onSaveAndCloseRequested(async () => {
        if (isDirty) {
          await flushAutoSave(true);
        }
        window.solsticeAPI?.closeWindow?.(true);
      });
      return unsubscribe;
    }
  }, [isDirty, flushAutoSave]);

  // Safety flush on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty) {
        flushAutoSave(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isDirty) {
        flushAutoSave(true);
      }
    };
  }, [isDirty, flushAutoSave]);

  return (
    <div className="flex-1 flex flex-col h-screen w-screen overflow-hidden bg-[#faf8f5] select-none">
      <WhiteboardHeader
        title={title}
        onTitleChange={(newTitle) => {
          setTitle(newTitle);
          scheduleAutoSave();
        }}
        statusText={statusText}
        currentFilePath={currentFilePath}
        onExport={handleExport}
        onBackToHome={handleBackToHome}
      />

      <WhiteboardCanvas
        title={title}
        initialSnapshot={initialBoard?.content}
        templateId={initialBoard?.templateId}
        onApiReady={handleApiReady}
        onChange={handleCanvasChange}
      />
    </div>
  );
};
