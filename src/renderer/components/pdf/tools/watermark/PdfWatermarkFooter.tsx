import React from 'react';
import { Loader2 } from 'lucide-react';

interface PdfWatermarkFooterProps {
  outputName: string;
  setOutputName: (name: string) => void;
  error: string | null;
  totalPages: number;
  isProcessing: boolean;
  canApply: boolean;
  onApplyWatermark: () => void;
}

export const PdfWatermarkFooter: React.FC<PdfWatermarkFooterProps> = ({
  outputName,
  setOutputName,
  error,
  totalPages,
  isProcessing,
  canApply,
  onApplyWatermark,
}) => {
  return (
    <footer className="h-16 px-8 border-t border-stone-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <label className="text-xs font-semibold text-stone-600 whitespace-nowrap">
          Output Name:
        </label>
        <input
          type="text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder="Watermarked_Document.pdf"
          className="w-full px-3 py-1.5 rounded-xl border border-stone-200/90 bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-rose-300 font-medium"
        />
      </div>

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 mx-4 truncate">
          {error}
        </p>
      )}

      <button
        disabled={totalPages === 0 || isProcessing || !canApply}
        onClick={onApplyWatermark}
        className="px-6 py-2.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
      >
        {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <span>{isProcessing ? 'Stamping Watermark...' : 'Apply Watermark to PDF'}</span>
      </button>
    </footer>
  );
};
