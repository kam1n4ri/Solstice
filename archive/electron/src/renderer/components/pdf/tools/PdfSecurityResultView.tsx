import React from 'react';
import { CheckCircle2, FileText, FolderCheck } from 'lucide-react';

interface PdfSecurityResultViewProps {
  result: {
    msg: string;
    filePath: string;
    fileName: string;
    data?: Uint8Array;
  };
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
}

export const PdfSecurityResultView: React.FC<PdfSecurityResultViewProps> = ({
  result,
  onOpenDocument,
}) => {
  return (
    <div className="py-6 text-center flex flex-col items-center animate-in zoom-in-95 duration-150">
      <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 border border-emerald-300/70 text-emerald-800 flex items-center justify-center mb-3 shadow-2xs">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">Security Updated!</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{result.msg}</p>

      <div className="flex items-center gap-3 mt-6">
        {result.data && (
          <button
            onClick={() => onOpenDocument(result.filePath, result.data!, result.fileName)}
            className="px-4 py-2 rounded-xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Open in Studio</span>
          </button>
        )}
        <button
          onClick={() => window.solsticeAPI?.revealInFolder?.(result.filePath)}
          className="px-4 py-2 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <FolderCheck className="w-4 h-4 text-slate-600" />
          <span>Reveal in Folder</span>
        </button>
      </div>
    </div>
  );
};
