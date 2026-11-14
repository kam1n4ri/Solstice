import React, { useState } from 'react';
import { Scissors, Plus, ShieldCheck, Zap, SplitSquareVertical } from 'lucide-react';

interface PdfSplitEmptyStateProps {
  onSelectFile: () => void;
  onDropFile: (file: File) => void;
}

export const PdfSplitEmptyState: React.FC<PdfSplitEmptyStateProps> = ({
  onSelectFile,
  onDropFile,
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
      onDropFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onSelectFile}
        className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-rose-400 bg-rose-50/40 scale-[1.01]'
            : 'border-stone-300/80 bg-white/70 hover:border-rose-300 hover:bg-rose-50/20'
        }`}
      >
        <div className="w-16 h-16 rounded-3xl bg-rose-50/80 border border-rose-100 text-rose-500 flex items-center justify-center mb-4 shadow-2xs">
          <Scissors className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-stone-800">Select PDF File to Split</h3>
        <p className="text-xs text-stone-500 mt-1.5 max-w-md">
          Drag and drop your PDF here, or click to choose from your computer. You can preview all pages and visually set partition ranges.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectFile();
          }}
          className="mt-6 px-6 py-2.5 rounded-2xl bg-[#ffd8e4] hover:bg-[#f6cad7] text-[#3b0918] font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#3b0918]" />
          <span>Select PDF File</span>
        </button>

        {/* Feature Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-stone-200/60 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <SplitSquareVertical className="w-3.5 h-3.5 text-rose-500" />
            <span>Interactive visual ranges</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            <span>100% offline & secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-500" />
            <span>Lossless page extraction</span>
          </div>
        </div>
      </div>
    </div>
  );
};
