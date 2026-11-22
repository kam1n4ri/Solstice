import React from 'react';
import { ArrowLeft, FolderOpen } from 'lucide-react';

interface PdfSecurityHeaderProps {
  onClose: () => void;
  fileName?: string;
  hasFile: boolean;
  onSelectFile: () => void;
}

export const PdfSecurityHeader: React.FC<PdfSecurityHeaderProps> = ({
  onClose,
  fileName,
  hasFile,
  onSelectFile,
}) => {
  return (
    <div className="h-12 px-6 border-b border-stone-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-stone-100 transition-colors cursor-pointer"
          title="Back to Studio (Esc)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">PDF Security & Encryption</span>
          {fileName && (
            <>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-slate-500 truncate max-w-sm">{fileName}</span>
            </>
          )}
        </div>
      </div>

      {hasFile && (
        <button
          type="button"
          onClick={onSelectFile}
          className="px-3 py-1.5 rounded-xl border border-stone-200/80 hover:bg-stone-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Upload Different PDF</span>
        </button>
      )}
    </div>
  );
};
