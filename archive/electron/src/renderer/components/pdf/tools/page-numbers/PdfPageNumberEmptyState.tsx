import React, { useState } from 'react';
import { Hash, Upload, FileUp } from 'lucide-react';

interface PdfPageNumberEmptyStateProps {
  onSelectFile: () => void;
  onDropFile: (file: File) => void;
}

export const PdfPageNumberEmptyState: React.FC<PdfPageNumberEmptyStateProps> = ({
  onSelectFile,
  onDropFile,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onDropFile(file);
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full max-w-xl p-10 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center text-center ${
          isDragOver
            ? 'border-rose-400 bg-rose-50/50 shadow-md scale-[1.01]'
            : 'border-stone-300/80 hover:border-rose-300 bg-white/70 shadow-xs'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-50/90 border border-rose-200/80 text-rose-700 flex items-center justify-center mb-4 shadow-2xs">
          <Hash className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-slate-800">Add Page Numbers to PDF</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
          Stamp customizable page numbers across headers or footers with real-time visual positioning, cover page skipping, and flexible formatting.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onSelectFile}
            className="px-6 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/80 text-rose-800 font-semibold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-rose-600" />
            <span>Choose PDF File</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-5">
          <FileUp className="w-3.5 h-3.5" />
          <span>Or drag and drop your PDF anywhere here</span>
        </div>
      </div>
    </div>
  );
};
