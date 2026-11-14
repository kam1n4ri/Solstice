import React from 'react';
import { ArrowLeft, Layers, Plus, ArrowUpDown, RotateCcw } from 'lucide-react';

interface PdfMergeHeaderProps {
  onClose: () => void;
  fileCount: number;
  hasResult: boolean;
  onSortAlphabetical: () => void;
  onClearFiles: () => void;
  onAddFiles: () => void;
}

export const PdfMergeHeader: React.FC<PdfMergeHeaderProps> = ({
  onClose,
  fileCount,
  hasResult,
  onSortAlphabetical,
  onClearFiles,
  onAddFiles,
}) => {
  return (
    <header className="h-14 px-6 border-b border-stone-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-1.5"
          title="Back to Tools"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Back</span>
        </button>

        <div className="h-4 w-px bg-stone-200" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-stone-800 tracking-tight">Merge PDF</h2>
            <p className="text-[10px] text-stone-400 -mt-0.5">Combine documents into one file</p>
          </div>
        </div>
      </div>

      {!hasResult && fileCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-stone-500 bg-stone-100/80 px-2.5 py-1 rounded-lg border border-stone-200/60">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </span>

          <button
            onClick={onSortAlphabetical}
            className="px-2.5 py-1 rounded-lg border border-stone-200/80 hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Sort alphabetically"
          >
            <ArrowUpDown className="w-3 h-3 text-stone-400" />
            <span>Sort A-Z</span>
          </button>

          <button
            onClick={onClearFiles}
            className="px-2.5 py-1 rounded-lg border border-stone-200/80 hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Clear all"
          >
            <RotateCcw className="w-3 h-3 text-stone-400" />
            <span>Clear</span>
          </button>

          <button
            onClick={onAddFiles}
            className="px-3 py-1 rounded-lg bg-rose-50/80 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-rose-600" />
            <span>Add Files</span>
          </button>
        </div>
      )}
    </header>
  );
};
