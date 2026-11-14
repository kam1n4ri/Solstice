import React, { useState } from 'react';
import { UploadCloud, FolderOpen, FileText, Loader2 } from 'lucide-react';

interface PdfDropHeroProps {
  onOpenFile: () => void;
  onCreateBlank: () => void;
  onDropFiles?: (files: FileList) => void;
  isOpening?: boolean;
}

export const PdfDropHero: React.FC<PdfDropHeroProps> = ({
  onOpenFile,
  onCreateBlank,
  onDropFiles,
  isOpening = false,
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDropFiles) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <section className="w-full mb-8 select-none">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full rounded-3xl border-2 border-dashed p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-150 ${
          isDragOver
            ? 'bg-rose-50/70 border-rose-400 ring-4 ring-rose-200/40'
            : 'bg-white border-slate-200/90 shadow-2xs'
        }`}
      >
        {/* Upload Cloud Icon Badge */}
        <div className="w-11 h-11 rounded-2xl bg-rose-50/80 border border-rose-200/60 flex items-center justify-center text-rose-600 mb-3 shadow-2xs">
          {isOpening ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UploadCloud className="w-5 h-5 stroke-[2]" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
          Drop PDF here, or browse files
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          Drag and drop files to view, convert, reorder, or edit instantly
        </p>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            type="button"
            onClick={onOpenFile}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Browse Files</span>
          </button>

          <button
            type="button"
            onClick={onCreateBlank}
            className="px-4 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>New Blank Note</span>
          </button>
        </div>
      </div>
    </section>
  );
};
