import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { PdfHomeSidebar } from './PdfHomeSidebar';
import { PdfHomeHeader } from './PdfHomeHeader';
import { PdfDropHero } from './PdfDropHero';
import { PdfToolsStrip } from './PdfToolsStrip';
import { PdfRecentList } from './PdfRecentList';
import { PdfAllToolsView } from './PdfAllToolsView';
import { PdfDeleteConfirmModal } from './PdfDeleteConfirmModal';
import { usePdfHome } from './usePdfHome';

interface PdfHomeViewProps {
  onDocumentSelected: (filePath: string | null, data: Uint8Array, fileName: string) => void;
  onOpenTool: (toolId: string) => void;
  disableFileDrop?: boolean;
}

export const PdfHomeView: React.FC<PdfHomeViewProps> = ({
  onDocumentSelected,
  onOpenTool,
  disableFileDrop = false,
}) => {
  const {
    activeTab, setActiveTab,
    recentItems, searchQuery, setSearchQuery,
    isLoading, isOpening, errorMessage, setErrorMessage,
    pendingDeleteItem, setPendingDeleteItem,
    handleOpenFile, handleCreateBlank, handleDropFiles,
    handleOpenItem, handleToggleStar, handleRevealFolder,
    handleDeleteItem, handleRemoveFromRecents, handleDeleteFromDisk,
  } = usePdfHome({ onDocumentSelected, disableFileDrop });

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-800 select-none overflow-hidden font-sans animate-in fade-in duration-150 selection:bg-rose-100 selection:text-rose-900">
      <PdfHomeSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar bg-white">
        <main className="flex-1 max-w-5xl w-full mx-auto px-8 pb-16 flex flex-col">
          <PdfHomeHeader
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {errorMessage && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70 text-rose-700/90 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500/80" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-0.5 rounded-md hover:bg-rose-100/70 text-rose-500/80 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'home' ? (
            <>
              <PdfDropHero
                onOpenFile={handleOpenFile}
                onCreateBlank={handleCreateBlank}
                onDropFiles={handleDropFiles}
                isOpening={isOpening}
              />

              <PdfToolsStrip
                onOpenTool={onOpenTool}
                onOpenAllTools={() => setActiveTab('tools')}
              />

              {isLoading ? (
                <div className="flex items-center justify-center p-16 text-xs text-slate-400 font-medium">
                  Loading recent documents...
                </div>
              ) : (
                <PdfRecentList
                  items={recentItems}
                  searchQuery={searchQuery}
                  onOpenItem={handleOpenItem}
                  onToggleStar={handleToggleStar}
                  onRevealFolder={handleRevealFolder}
                  onDeleteItem={handleDeleteItem}
                />
              )}
            </>
          ) : (
            <PdfAllToolsView
              searchQuery={searchQuery}
              onOpenTool={onOpenTool}
            />
          )}
        </main>
      </div>

      <PdfDeleteConfirmModal
        isOpen={Boolean(pendingDeleteItem)}
        item={pendingDeleteItem}
        onClose={() => setPendingDeleteItem(null)}
        onRemoveFromRecents={handleRemoveFromRecents}
        onDeleteFromDisk={handleDeleteFromDisk}
      />
    </div>
  );
};
