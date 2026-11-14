import React from 'react';
import { FolderOpen, Loader2, Image as ImageIcon } from 'lucide-react';

interface PdfToImagesConfigCardProps {
  fileName: string;
  totalPages: number;
  format: 'png' | 'jpeg';
  setFormat: (fmt: 'png' | 'jpeg') => void;
  scaleFactor: number;
  setScaleFactor: (factor: number) => void;
  isProcessing: boolean;
  progressMsg: string;
  error: string | null;
  onSelectPdf: () => void;
  onConvert: () => void;
}

export const PdfToImagesConfigCard: React.FC<PdfToImagesConfigCardProps> = ({
  fileName,
  totalPages,
  format,
  setFormat,
  scaleFactor,
  setScaleFactor,
  isProcessing,
  progressMsg,
  error,
  onSelectPdf,
  onConvert,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-stone-200/80 p-8 shadow-sm flex flex-col text-center items-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50/80 border border-rose-200/70 text-rose-600 flex items-center justify-center mb-4 shadow-2xs">
          <ImageIcon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-stone-800">{fileName}</h3>
        <p className="text-xs text-stone-500 mt-1">
          Ready to render all <span className="font-semibold text-stone-700">{totalPages} pages</span> to graphics.
        </p>

        <button
          onClick={onSelectPdf}
          className="mt-2 text-xs font-semibold text-stone-600 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Change PDF</span>
        </button>

        {/* Settings */}
        <div className="w-full grid grid-cols-2 gap-4 mt-6 text-left">
          <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/70">
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">Image Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-800 focus:outline-none focus:border-rose-300"
            >
              <option value="png">PNG (Lossless & Crisp)</option>
              <option value="jpeg">JPEG (Compressed)</option>
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/70">
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">Resolution & Scale</label>
            <select
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-800 focus:outline-none focus:border-rose-300"
            >
              <option value={1.5}>Standard Quality (150 DPI)</option>
              <option value={2.0}>High-DPI 2x (300 DPI)</option>
              <option value={3.0}>Ultra-DPI 3x (Print Quality)</option>
            </select>
          </div>
        </div>

        {progressMsg && (
          <p className="text-xs text-rose-700 font-mono mt-4 animate-pulse">{progressMsg}</p>
        )}

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 mt-4 text-left w-full">{error}</p>
        )}

        <button
          disabled={isProcessing}
          onClick={onConvert}
          className="w-full mt-6 py-3 px-5 rounded-2xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs tracking-wide shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-rose-600" />}
          <span>{isProcessing ? 'Converting Pages...' : `Convert All ${totalPages} Pages to ${format.toUpperCase()}`}</span>
        </button>
      </div>
    </div>
  );
};
