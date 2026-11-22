import React from 'react';
import { Shield, FolderOpen, FileText, AlertCircle } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';

interface PdfSecurityEmptyStateProps {
  onSelectFile: () => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  setIsDragOver: (over: boolean) => void;
  error: string | null;
  currentDocument?: ActivePdfDocument | null;
  onUseCurrentDocument?: () => void;
}

export const PdfSecurityEmptyState: React.FC<PdfSecurityEmptyStateProps> = ({
  onSelectFile,
  onDrop,
  isDragOver,
  setIsDragOver,
  error,
  currentDocument,
  onUseCurrentDocument,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={onSelectFile}
        className={`w-full max-w-xl border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-rose-400 bg-rose-50/40 scale-[1.01]'
            : 'border-stone-300/80 bg-white/70 hover:border-rose-300 hover:bg-rose-50/20'
        }`}
      >
        <div className="w-16 h-16 rounded-3xl bg-rose-50/80 border border-rose-100 text-rose-500 flex items-center justify-center mb-4 shadow-2xs">
          <Shield className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-stone-800">Select PDF to Protect or Unlock</h3>
        <p className="text-xs text-stone-500 mt-1.5 max-w-md">
          Drag and drop your PDF here, or click to upload. Apply industry-standard AES-256 encryption, or permanently strip existing restrictions.
        </p>

        {error && (
          <div className="mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectFile();
          }}
          className="mt-6 px-5 py-2.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/90 text-rose-800 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Upload PDF Document</span>
        </button>

        {currentDocument && onUseCurrentDocument && (
          <div className="mt-4 pt-4 border-t border-stone-200/60 w-full flex flex-col items-center">
            <p className="text-[11px] text-stone-400 mb-2">Or continue with currently opened document</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUseCurrentDocument();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100/80 hover:bg-stone-200/70 text-slate-700 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span className="truncate max-w-xs">{currentDocument.fileName}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
