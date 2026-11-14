import React from 'react';
import { CheckCircle2, Download, FolderCheck, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react';
import { RenderedPageImage } from './PdfConvertTypes';

interface PdfToImagesResultViewProps {
  images: RenderedPageImage[];
  isProcessing: boolean;
  savedFolder: string | null;
  onSaveAll: () => void;
  onDownloadSingle: (img: RenderedPageImage) => void;
  onReset: () => void;
  onClose: () => void;
}

export const PdfToImagesResultView: React.FC<PdfToImagesResultViewProps> = ({
  images,
  isProcessing,
  savedFolder,
  onSaveAll,
  onDownloadSingle,
  onReset,
  onClose,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto animate-in fade-in-50 duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-stone-200/80 p-8 shadow-sm flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-stone-800 tracking-tight">PDF Pages Rendered as Images!</h3>
        <p className="text-xs text-stone-500 mt-1">
          Successfully generated <span className="font-semibold text-stone-700">{images.length}</span> high-resolution images.
        </p>

        {/* Download All Button */}
        <div className="w-full max-w-md mt-6">
          <button
            onClick={onSaveAll}
            disabled={isProcessing}
            className="w-full py-3 px-5 rounded-2xl bg-[#ffd8e4] hover:bg-[#f6cad7] text-[#3b0918] font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#3b0918]" />}
            <span>Save All {images.length} Images to Folder</span>
          </button>

          {savedFolder && (
            <div className="mt-2.5 flex items-center justify-between p-2.5 px-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-800">
              <span className="truncate pr-2 text-[11px]">Saved to {savedFolder}</span>
              <button
                onClick={() => window.solsticeAPI?.revealInFolder?.(savedFolder)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <FolderCheck className="w-3.5 h-3.5" />
                <span>Show folder</span>
              </button>
            </div>
          )}
        </div>

        {/* Rendered Images Grid */}
        <div className="w-full mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-72 overflow-y-auto p-2 border rounded-2xl border-stone-100 bg-stone-50/40 custom-scrollbar">
          {images.map((img) => (
            <div key={img.pageNumber} className="flex flex-col items-center bg-white p-2 rounded-xl border border-stone-200/80 shadow-2xs group">
              <div className="w-full h-32 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center mb-1.5">
                <img src={img.dataUrl} alt={img.fileName} className="max-w-full max-h-full object-contain" />
              </div>
              <span className="text-[10px] font-mono font-medium text-stone-600 truncate w-full text-center">{img.fileName}</span>
              <button
                onClick={() => onDownloadSingle(img)}
                className="mt-1.5 w-full py-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-[10px] font-semibold text-stone-700 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-rose-500" />
                <span>Save</span>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="w-full mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
          <button onClick={onClose} className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Tools</span>
          </button>
          <button
            onClick={onReset}
            className="text-xs font-semibold text-stone-700 hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Convert Another PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
