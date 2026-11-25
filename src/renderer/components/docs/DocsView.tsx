import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DocsHeader } from './DocsHeader';
import { DocsToolbar } from './DocsToolbar';
import { DocsEditor } from './DocsEditor';
import { DocsOutlineSidebar } from './DocsOutlineSidebar';
import { DocsFindReplace } from './DocsFindReplace';
import { DocsViewModals } from './DocsViewModals';
import { INITIAL_DOCS_CONTENT } from './DocsConstants';
import { useDocsShortcuts } from './useDocsShortcuts';
import { useDocsEditor } from './useDocsEditor';
import { useDocsFileOps } from './useDocsFileOps';

export interface DocsInitialDocument {
  title: string;
  content: string;
  filePath?: string | null;
  format?: string;
  documentId?: string;
}

interface DocsViewProps {
  initialDocument?: DocsInitialDocument | null;
  onBackToHome?: () => void;
}

export const DocsView: React.FC<DocsViewProps> = ({ initialDocument, onBackToHome }) => {
  const [title, setTitle] = useState(initialDocument?.title || 'Untitled document');
  const [statusText, setStatusText] = useState('All changes saved');
  const [, setIsDirtyState] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(
    initialDocument?.filePath || null
  );
  const [isPrintLayout, setIsPrintLayout] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [spellCheck, setSpellCheck] = useState(true);
  const [showLiveWordCount, setShowLiveWordCount] = useState(true);

  // Panels & Modals State
  const [showOutlineSidebar, setShowOutlineSidebar] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findFocusTrigger, setFindFocusTrigger] = useState(0);
  const [showWordCountModal, setShowWordCountModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  const handleOpenFindReplace = useCallback(() => {
    setShowFindReplace(true);
    setFindFocusTrigger((prev) => prev + 1);
  }, []);

  const autoSaveCallbackRef = useRef<() => void>(() => {});
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setIsDirty = useCallback((dirty: boolean) => {
    setIsDirtyState(dirty);
    if (window.solsticeAPI?.docsSetDirty) {
      window.solsticeAPI.docsSetDirty(dirty);
    }
  }, []);

  const flashStatus = useCallback((msg: string) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    setStatusText(msg);
    const isTransientSuccess =
      msg === 'Saved to disk' ||
      msg === 'New document created' ||
      msg === 'Opened file' ||
      msg === 'Exported successfully';
    if (isTransientSuccess) {
      statusTimerRef.current = setTimeout(() => {
        setStatusText('All changes saved');
        statusTimerRef.current = null;
      }, 2400);
    }
  }, []);

  const { editor, wordCount, characterCount } = useDocsEditor(
    initialDocument?.content || INITIAL_DOCS_CONTENT,
    () => {
      autoSaveCallbackRef.current();
    }
  );

  const {
    fileInputRef,
    handleNewDocument,
    handleOpenFile,
    handleSaveDocument,
    handleSaveAsDocument,
    handleExport,
    handleFileChange,
    handleTitleChange,
    flushAutoSave,
    scheduleAutoSave,
    promptUnsavedGuard,
  } = useDocsFileOps({
    editor,
    title,
    setTitle,
    currentFilePath,
    setCurrentFilePath,
    setIsDirty,
    flashStatus,
  });

  useEffect(() => {
    autoSaveCallbackRef.current = scheduleAutoSave;
  }, [scheduleAutoSave]);

  const handleBackToHome = useCallback(async () => {
    const canProceed = await promptUnsavedGuard();
    if (!canProceed) return;
    onBackToHome?.();
  }, [promptUnsavedGuard, onBackToHome]);

  useEffect(() => {
    if (window.solsticeAPI?.onSaveAndCloseRequested) {
      const unsubscribe = window.solsticeAPI.onSaveAndCloseRequested(async () => {
        const canProceed = await promptUnsavedGuard();
        if (!canProceed) {
          window.solsticeAPI?.cancelClose?.();
          return;
        }
        window.solsticeAPI?.closeWindow?.(true);
      });
      return unsubscribe;
    }
  }, [promptUnsavedGuard]);

  useEffect(() => {
    if (window.solsticeAPI?.onOpenFileRequested) {
      const unsubscribe = window.solsticeAPI.onOpenFileRequested(async (newPath) => {
        if (newPath) {
          await handleOpenFile(newPath);
        }
      });
      return unsubscribe;
    }
  }, [handleOpenFile]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.max(50, Math.min(200, Math.round((prev + 10) / 5) * 5)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(50, Math.min(200, Math.round((prev - 10) / 5) * 5)));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(100);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushAutoSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
      flushAutoSave();
      window.solsticeAPI?.docsSetDirty?.(false);
    };
  }, [flushAutoSave]);

  useDocsShortcuts({
    onToggleFindReplace: () => setShowFindReplace((prev) => !prev),
    onOpenFindReplace: handleOpenFindReplace,
    onToggleWordCount: () => setShowWordCountModal((prev) => !prev),
    onOpenLinkModal: () => setShowLinkModal(true),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomReset: handleZoomReset,
    onNew: handleNewDocument,
    onPrint: () => window.print(),
    onSave: handleSaveDocument,
    onSaveAs: handleSaveAsDocument,
    onOpen: handleOpenFile,
  });

  return (
    <div className="DocsView-container flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafd] text-slate-800 animate-in fade-in duration-150 ease-out print:h-auto print:w-auto print:overflow-visible print:bg-white print:static">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.html,.htm,.md,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      {!isHeaderHidden && (
        <DocsHeader
          title={title}
          filePath={currentFilePath}
          onTitleChange={handleTitleChange}
          statusText={statusText}
          onBackToHome={handleBackToHome}
          editor={editor}
          onNewDocument={handleNewDocument}
          onOpenFile={handleOpenFile}
          onSaveDocument={handleSaveDocument}
          onSaveAsDocument={handleSaveAsDocument}
          onExport={handleExport}
          isPrintLayout={isPrintLayout}
          onToggleLayout={() => setIsPrintLayout((prev) => !prev)}
          onSetPrintLayout={setIsPrintLayout}
          showOutlineSidebar={showOutlineSidebar}
          onToggleOutlineSidebar={() => setShowOutlineSidebar((prev) => !prev)}
          zoomLevel={zoomLevel}
          onChangeZoom={setZoomLevel}
          onOpenFindReplace={handleOpenFindReplace}
          onOpenWordCount={() => setShowWordCountModal(true)}
          spellCheck={spellCheck}
          onToggleSpellCheck={() => setSpellCheck((prev) => !prev)}
          onOpenLinkModal={() => setShowLinkModal(true)}
          onOpenImageModal={() => setShowImageModal(true)}
        />
      )}

      <DocsToolbar
        editor={editor}
        zoomLevel={zoomLevel}
        onChangeZoom={setZoomLevel}
        onOpenLinkModal={() => setShowLinkModal(true)}
        onOpenImageModal={() => setShowImageModal(true)}
        onPrint={() => window.print()}
        isHeaderHidden={isHeaderHidden}
        onToggleHeader={() => setIsHeaderHidden((prev) => !prev)}
        onOpenFindReplace={handleOpenFindReplace}
      />

      <div className="flex-1 flex overflow-hidden relative print:h-auto print:w-auto print:overflow-visible print:static">
        <DocsOutlineSidebar
          editor={editor}
          isOpen={showOutlineSidebar}
          onClose={() => setShowOutlineSidebar(false)}
        />

        <DocsEditor
          editor={editor}
          isPrintLayout={isPrintLayout}
          wordCount={wordCount}
          characterCount={characterCount}
          zoomLevel={zoomLevel}
          onChangeZoom={setZoomLevel}
          spellCheck={spellCheck}
          showLiveWordCount={showLiveWordCount}
          onOpenLinkModal={() => setShowLinkModal(true)}
          onOpenImageModal={() => setShowImageModal(true)}
        />

        <DocsFindReplace
          editor={editor}
          isOpen={showFindReplace}
          onClose={() => setShowFindReplace(false)}
          focusTrigger={findFocusTrigger}
        />
      </div>

      <DocsViewModals
        editor={editor}
        showWordCountModal={showWordCountModal}
        onCloseWordCount={() => setShowWordCountModal(false)}
        showLiveWordCount={showLiveWordCount}
        onToggleLiveWordCount={setShowLiveWordCount}
        showLinkModal={showLinkModal}
        onCloseLink={() => setShowLinkModal(false)}
        showImageModal={showImageModal}
        onCloseImage={() => setShowImageModal(false)}
      />
    </div>
  );
};