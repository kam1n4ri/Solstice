import React, { useState, useCallback, useEffect } from 'react';
import { usePdfDocument } from './usePdfDocument';
import { PdfHeader } from './PdfHeader';
import { PdfCanvas } from './PdfCanvas';
import { PdfSidebar } from './sidebar/PdfSidebar';
import { PdfSearchBar } from './PdfSearchBar';
import { PdfToolbar } from './PdfToolbar';
import { usePdfAnnotations } from './annotations/usePdfAnnotations';
import { usePdfFileOps } from './usePdfFileOps';
import { ActivePdfDocument } from './PdfContainer';
import { AlertCircle } from 'lucide-react';
import { PdfOrganizeView } from './organize/PdfOrganizeView';
import { PdfLayoutMode, PdfColorTheme } from './PdfViewerTypes';

interface PdfWorkspaceProps {
  document: ActivePdfDocument;
  onBackToHome: () => void;
  onOpenTool?: (toolId: string) => void;
  onDocumentUpdate?: (filePath: string | null, data: Uint8Array, fileName: string) => void;
}

export const PdfWorkspace: React.FC<PdfWorkspaceProps> = ({
  document,
  onBackToHome,
  onOpenTool,
  onDocumentUpdate,
}) => {
  const { doc, numPages, outline, defaultPageDimensions, isLoading, error, getPage } =
    usePdfDocument(document.data);

  const [scale, setScale] = useState<number>(1.15);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scrollToPage, setScrollToPage] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<PdfLayoutMode>('single');
  const [colorTheme, setColorTheme] = useState<PdfColorTheme>('default');
  const [isOrganizeMode, setIsOrganizeMode] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);

  const ann = usePdfAnnotations();

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setScrollToPage(page);
  }, []);

  // Keyboard navigation shortcuts: Ctrl+F, PageUp, PageDown, Home, End, Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = window.document.activeElement;
      const activeTag = (activeEl?.tagName || '').toLowerCase();
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (activeEl as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        const step = layoutMode === 'spread' ? 2 : 1;
        handlePageChange(Math.min(numPages, currentPage + step));
      } else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        const step = layoutMode === 'spread' ? 2 : 1;
        handlePageChange(Math.max(1, currentPage - step));
      } else if (e.key === 'Home') {
        e.preventDefault();
        handlePageChange(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        handlePageChange(numPages);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, layoutMode, handlePageChange]);

  const handleSearchFromSelection = useCallback((text: string) => {
    setSearchQuery(text);
    setIsSearchOpen(true);
  }, []);

  const handleZoomChange = useCallback((s: number) => setScale(Math.max(0.4, Math.min(3.0, s))), []);
  const handleRotate = useCallback(() => setRotation((prev) => (prev + 90) % 360), []);
  const handlePrint = useCallback(() => window.solsticeAPI?.pdfPrint?.(), []);

  // Dedicated Auto-Save, Rename, Reveal & Export Operations
  const {
    filePath,
    title,
    setTitle,
    commitTitleRename,
    statusText,
    handleRevealFolder,
    handleExport,
    flushAutoSave,
  } = usePdfFileOps({
    initialFilePath: document.filePath,
    initialFileName: document.fileName,
    documentData: document.data,
    annotations: ann.annotations,
    exportDocumentWithAnnotations: ann.exportDocumentWithAnnotations,
  });

  const handleBackToHome = useCallback(async () => {
    await flushAutoSave();
    onBackToHome();
  }, [flushAutoSave, onBackToHome]);

  useEffect(() => {
    const unsub = window.solsticeAPI?.onSaveAndCloseRequested?.(async () => {
      await flushAutoSave();
      window.solsticeAPI?.closeWindow?.(true);
    });
    const handleBeforeUnload = () => flushAutoSave();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      unsub?.();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushAutoSave();
    };
  }, [flushAutoSave]);

  const handleFitWidth = useCallback(() => {
    const containerWidth = window.innerWidth - sidebarWidth - 64;
    setScale(Math.max(0.5, Math.min(2.5, containerWidth / (defaultPageDimensions.width || 600))));
  }, [defaultPageDimensions.width, sidebarWidth]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3 shadow-sm">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">Failed to Open PDF Document</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md">{error}</p>
        <button
          onClick={onBackToHome}
          className="mt-4 px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-slate-700 hover:bg-stone-50 shadow-sm transition-all"
        >
          Return to Studio Home
        </button>
      </div>
    );
  }

  if (isOrganizeMode) {
    return (
      <div className="h-screen w-screen bg-[#fafbfc] flex flex-col font-sans overflow-hidden">
        <PdfHeader
          title={title}
          onTitleChange={setTitle}
          onTitleCommit={commitTitleRename}
          statusText="Organize Mode"
          filePath={filePath}
          onRevealFolder={handleRevealFolder}
          onPrint={handlePrint}
          onExport={handleExport}
          onBackToHome={() => setIsOrganizeMode(false)}
        />
        <PdfOrganizeView
          initialFilePath={filePath}
          initialFileName={title.endsWith('.pdf') ? title : `${title}.pdf`}
          initialData={document.data}
          onSuccess={(newFilePath, newData, newFileName) => {
            setIsOrganizeMode(false);
            onDocumentUpdate?.(newFilePath, newData, newFileName);
          }}
          onCancel={() => setIsOrganizeMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#fafbfc] flex flex-col font-sans overflow-hidden">
      <PdfHeader
        title={title}
        onTitleChange={setTitle}
        onTitleCommit={commitTitleRename}
        statusText={statusText}
        filePath={filePath}
        onRevealFolder={handleRevealFolder}
        onPrint={handlePrint}
        onExport={handleExport}
        onBackToHome={handleBackToHome}
        onOpenOrganize={() => setIsOrganizeMode(true)}
        onOpenTool={onOpenTool}
      />

      <div className="flex-1 relative flex overflow-hidden">
        {/* Left: Resizable Sidebar Drawer (Thumbnails Preview & Outline) */}
        <PdfSidebar
          width={sidebarWidth}
          onResize={setSidebarWidth}
          numPages={numPages}
          currentPage={currentPage}
          getPage={getPage}
          doc={doc}
          outline={outline}
          onJumpToPage={handlePageChange}
        />

        {/* Center / Canvas Column (fills remaining workspace) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="relative z-40 shrink-0">
            <PdfToolbar
              scale={scale}
              onZoomChange={handleZoomChange}
              onFitWidth={handleFitWidth}
              onRotate={handleRotate}
              isSearchOpen={isSearchOpen}
              onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
              activeTool={ann.activeTool}
              onSelectTool={ann.setActiveTool}
              highlightColor={ann.highlightColor}
              onSelectHighlightColor={ann.setHighlightColor}
              penColor={ann.penColor}
              onSelectPenColor={ann.setPenColor}
              penWidth={ann.penWidth}
              onSelectPenWidth={ann.setPenWidth}
              onUndo={ann.undo}
              canUndo={ann.canUndo}
              onRedo={ann.redo}
              canRedo={ann.canRedo}
              currentPage={currentPage}
              numPages={numPages}
              onPageChange={handlePageChange}
              layoutMode={layoutMode}
              onSelectLayoutMode={setLayoutMode}
              colorTheme={colorTheme}
              onSelectColorTheme={setColorTheme}
            />
          </div>

          <div className="flex-1 relative flex overflow-hidden z-0">
            <PdfSearchBar
              isOpen={isSearchOpen}
              onClose={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              doc={doc}
              onJumpToPage={handlePageChange}
              initialQuery={searchQuery}
            />

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-medium">
                <span className="animate-pulse">Rendering PDF document...</span>
              </div>
            ) : (
              <PdfCanvas
                numPages={numPages}
                getPage={getPage}
                scale={scale}
                rotation={rotation}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                defaultDims={defaultPageDimensions}
                scrollToPage={scrollToPage}
                annotations={ann.annotations}
                activeTool={ann.activeTool}
                highlightColor={ann.highlightColor}
                penColor={ann.penColor}
                penWidth={ann.penWidth}
                onAddAnnotation={ann.addAnnotation}
                onDeleteAnnotation={ann.deleteAnnotation}
                layoutMode={layoutMode}
                colorTheme={colorTheme}
                onSearchText={handleSearchFromSelection}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
