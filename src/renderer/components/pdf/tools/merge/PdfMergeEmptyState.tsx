import React, { useState } from 'react';
import { Layers, Plus, ShieldCheck, Zap, ArrowUpDown } from 'lucide-react';

interface PdfMergeEmptyStateProps {
  onSelectFiles: () => void;
  onDropFiles: (files: FileList) => void;
}

export const PdfMergeEmptyState: React.FC<PdfMergeEmptyStateProps> = ({
  onSelectFiles,
  onDropFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onSelectFiles}
        className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-rose-400 bg-rose-50/40 scale-[1.01]'
            : 'border-stone-300/80 bg-white/70 hover:border-rose-300 hover:bg-rose-50/20'
        }`}
      >
        <div className="w-16 h-16 rounded-3xl bg-rose-50/80 border border-rose-100 text-rose-500 flex items-center justify-center mb-4 shadow-2xs">
          <Layers className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-stone-800">Select PDF Files to Merge</h3>
        <p className="text-xs text-stone-500 mt-1.5 max-w-md">
          Drag and drop PDF documents here, or click the button below to browse from your computer.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectFiles();
          }}
          className="mt-6 px-6 py-2.5 rounded-2xl bg-[#ffd8e4] hover:bg-[#f6cad7] text-[#3b0918] font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#3b0918]" />
          <span>Select PDF Files</span>
        </button>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-stone-200/60 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-rose-500" />
            <span>Drag & drop reordering</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            <span>100% offline & secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-500" />
            <span>Lossless page merging</span>
          </div>
        </div>
      </div>
    </div>
  );
};
