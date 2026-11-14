import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { DocsHomeHeader } from './DocsHomeHeader';
import { DocsTemplateStrip } from './DocsTemplateStrip';
import { DocsRecentList } from './DocsRecentList';
import { DocsDeleteConfirmModal } from './DocsDeleteConfirmModal';
import { useDocsHome, DocsOpenPayload } from './useDocsHome';

export type { DocsOpenPayload };

interface DocsHomeViewProps {
  onOpenDocument: (payload: DocsOpenPayload) => void;
  initialErrorMessage?: string | null;
}

export const DocsHomeView: React.FC<DocsHomeViewProps> = ({
  onOpenDocument,
  initialErrorMessage,
}) => {
  const {
    documents,
    searchQuery,
    setSearchQuery,
    isPreparing,
    preparingId,
    errorMessage,
    setErrorMessage,
    deletingDoc,
    setDeletingDoc,
    handleSelectTemplate,
    handleOpenFilePicker,
    handleOpenRecent,
    handlePromptRemove,
    handleConfirmRemoveFromRecents,
    handleConfirmDeleteFromDisk,
  } = useDocsHome({ onOpenDocument, initialErrorMessage });

  return (
    <div className="min-h-screen bg-white font-sans text-on-surface antialiased select-none flex flex-col animate-in fade-in duration-150 ease-out">
      {/* Top Header: Pure white with light-grey search pill */}
      <DocsHomeHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="w-full pt-14 flex-1 flex flex-col">
        {/* Top "Start a new document" Band: Soft pale-grey background */}
        {!searchQuery.trim() && (
          <div className="w-full bg-surface-container-low border-b border-surface-container/80 py-5">
            <div className="max-w-6xl mx-auto px-6">
              <DocsTemplateStrip
                onSelectTemplate={handleSelectTemplate}
                isPreparing={isPreparing}
                preparingId={preparingId}
              />
            </div>
          </div>
        )}

        {/* Bottom "Recent documents" Section: Pure white background */}
        <div className="w-full bg-white flex-1 py-6">
          <div className="max-w-6xl mx-auto px-6">
            {errorMessage && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <DocsRecentList
              documents={documents}
              searchQuery={searchQuery}
              onOpenDocument={handleOpenRecent}
              onRemoveDocument={handlePromptRemove}
              onOpenFilePicker={handleOpenFilePicker}
              isPreparing={isPreparing}
              preparingId={preparingId}
            />
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Safe Document Removal / Disk Deletion */}
      <DocsDeleteConfirmModal
        isOpen={Boolean(deletingDoc)}
        doc={deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onRemoveFromRecents={handleConfirmRemoveFromRecents}
        onDeleteFromDisk={handleConfirmDeleteFromDisk}
      />
    </div>
  );
};
