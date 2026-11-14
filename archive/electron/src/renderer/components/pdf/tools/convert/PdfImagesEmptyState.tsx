import React from 'react';
import { Plus, Image as ImageIcon, ShieldCheck, Zap, Layers } from 'lucide-react';

interface PdfImagesEmptyStateProps {
  onSelectImages: () => void;
}

export const PdfImagesEmptyState: React.FC<PdfImagesEmptyStateProps> = ({
  onSelectImages,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div
        onClick={onSelectImages}
        className="w-full max-w-2xl border-2 border-dashed border-stone-300/80 bg-white/70 hover:border-rose-300 hover:bg-rose-50/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
      >
        <div className="w-16 h-16 rounded-3xl bg-rose-50/80 border border-rose-100 text-rose-500 flex items-center justify-center mb-4 shadow-2xs">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-800">Select Images to Convert to PDF</h3>
        <p className="text-xs text-stone-500 mt-1.5 max-w-md">
          Drag and drop JPG, PNG, or WebP photos here, or click to browse from your computer.
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectImages();
          }}
          className="mt-6 px-6 py-2.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-rose-600" />
          <span>Select Images</span>
        </button>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-stone-200/60 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>Drag & drop reordering</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            <span>100% offline & secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-500" />
            <span>High-DPI vector PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
