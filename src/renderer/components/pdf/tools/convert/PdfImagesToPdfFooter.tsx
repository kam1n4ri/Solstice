import React from 'react';
import { Loader2 } from 'lucide-react';
import { FitMode, Orientation } from './PdfConvertTypes';

interface PdfImagesToPdfFooterProps {
  fitMode: FitMode;
  setFitMode: (mode: FitMode) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  margin: number;
  setMargin: (m: number) => void;
  outputName: string;
  setOutputName: (name: string) => void;
  error: string | null;
  imageCount: number;
  isProcessing: boolean;
  onConvert: () => void;
}

export const PdfImagesToPdfFooter: React.FC<PdfImagesToPdfFooterProps> = ({
  fitMode,
  setFitMode,
  orientation,
  setOrientation,
  margin,
  setMargin,
  outputName,
  setOutputName,
  error,
  imageCount,
  isProcessing,
  onConvert,
}) => {
  return (
    <footer className="h-18 px-8 border-t border-stone-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between flex-shrink-0 gap-4">
      <div className="flex items-center gap-3 text-xs">
        <div>
          <label className="text-[10px] font-semibold text-stone-500 block">Page Sizing</label>
          <select
            value={fitMode}
            onChange={(e) => setFitMode(e.target.value as FitMode)}
            className="mt-0.5 px-2.5 py-1 rounded-xl border border-stone-200/90 bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-rose-300"
          >
            <option value="a4-contain">Standard A4</option>
            <option value="original">Original Image Size</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-stone-500 block">Orientation</label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
            className="mt-0.5 px-2.5 py-1 rounded-xl border border-stone-200/90 bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-rose-300"
          >
            <option value="auto">Auto Match</option>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-stone-500 block">Margins</label>
          <select
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value, 10))}
            className="mt-0.5 px-2.5 py-1 rounded-xl border border-stone-200/90 bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-rose-300"
          >
            <option value={0}>Borderless (0pt)</option>
            <option value={18}>Standard (18pt)</option>
            <option value={36}>Generous (36pt)</option>
          </select>
        </div>

        <div className="max-w-xs">
          <label className="text-[10px] font-semibold text-stone-500 block">Output Name</label>
          <input
            type="text"
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            className="mt-0.5 px-3 py-1 rounded-xl border border-stone-200/90 bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-rose-300"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 truncate max-w-xs">
          {error}
        </p>
      )}

      <button
        disabled={imageCount === 0 || isProcessing}
        onClick={onConvert}
        className="px-6 py-2.5 rounded-2xl bg-[#ffd8e4] hover:bg-[#f6cad7] text-[#3b0918] font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
      >
        {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <span>{isProcessing ? 'Generating PDF...' : `Convert ${imageCount} Images`}</span>
      </button>
    </footer>
  );
};
