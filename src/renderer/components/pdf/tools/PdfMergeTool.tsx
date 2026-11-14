import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { PdfMergeCard } from './merge/PdfMergeCard';
import { PdfMergeResultView } from './merge/PdfMergeResultView';
import { PdfMergeEmptyState } from './merge/PdfMergeEmptyState';
import { PdfMergeHeader } from './merge/PdfMergeHeader';
import { usePdfMergeState } from './merge/usePdfMergeState';

interface PdfMergeToolProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
  currentDocument?: ActivePdfDocument | null;
}

export const PdfMergeTool: React.FC<PdfMergeToolProps> = ({
  onClose,
  onOpenDocument,
  currentDocument,
}) => {
  const {
    files,
    setFiles,
    outputName,
    setOutputName,
    isProcessing,
    error,
    result,
    setResult,
    draggedIdx,
    handleAddFiles,
    handleDropFiles,
    handleMove,
    handleRemove,
    handleSortAlphabetical,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleMerge,
  } = usePdfMergeState(currentDocument);

  return (
    <div className="fixed inset-0 z-50 bg-[#fafbfc] flex flex-col font-sans select-none animate-in fade-in-50 duration-150">
      <PdfMergeHeader
        onClose={onClose}
        fileCount={files.length}
        hasResult={Boolean(result)}
        onSortAlphabetical={handleSortAlphabetical}
        onClearFiles={() => setFiles([])}
        onAddFiles={handleAddFiles}
      />

      {result ? (
        <PdfMergeResultView
          result={result}
          onReset={() => {
            setResult(null);
            setFiles([]);
          }}
          onClose={onClose}
          onOpenDocument={onOpenDocument}
        />
      ) : files.length === 0 ? (
        <PdfMergeEmptyState onSelectFiles={handleAddFiles} onDropFiles={handleDropFiles} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-stone-600">
                  Merge Order <span className="font-normal text-stone-400">(Drag cards to rearrange)</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-4 items-start">
                {files.map((file, idx) => (
                  <PdfMergeCard
                    key={file.id}
                    file={file}
                    index={idx}
                    totalCount={files.length}
                    onMove={handleMove}
                    onRemove={handleRemove}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragging={draggedIdx === idx}
                  />
                ))}

                <button
                  type="button"
                  onClick={handleAddFiles}
                  className="w-56 h-64 rounded-2xl border-2 border-dashed border-stone-200 hover:border-rose-300 hover:bg-rose-50/20 bg-white/40 flex flex-col items-center justify-center text-stone-400 hover:text-rose-600 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-rose-100/80 text-stone-400 group-hover:text-rose-600 flex items-center justify-center mb-2 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">Add more files</span>
                  <span className="text-[10px] text-stone-400 mt-0.5">Click to browse</span>
                </button>
              </div>
            </div>
          </div>

          <footer className="h-18 px-8 border-t border-stone-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 flex-1 max-w-sm">
              <label className="text-xs font-semibold text-stone-600 whitespace-nowrap">Output File:</label>
              <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="Merged_Document.pdf"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200/90 bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-rose-300 focus:bg-white transition-all font-medium"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 mx-4 truncate">
                {error}
              </p>
            )}

            <button
              disabled={files.length < 2 || isProcessing}
              onClick={handleMerge}
              className="px-6 py-2.5 rounded-2xl bg-[#ffd8e4] hover:bg-[#f6cad7] text-[#3b0918] font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isProcessing ? 'Merging PDFs...' : `Merge ${files.length} PDFs`}</span>
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};
