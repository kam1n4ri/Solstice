import React, { useState } from 'react';
import { Plus, ArrowUpDown, RotateCw, RotateCcw, Undo2 } from 'lucide-react';
import { OrganizeCardSize } from './PdfOrganizeTypes';

interface PdfOrganizeControlsProps {
  cardSize: OrganizeCardSize;
  onCardSizeChange: (size: OrganizeCardSize) => void;
  onReverseOrder: () => void;
  onRotateAll: (delta: number) => void;
  onResetOrder: () => void;
  onAddFiles: () => void;
  fileCount: number;
}

export const PdfOrganizeControls: React.FC<PdfOrganizeControlsProps> = ({
  cardSize,
  onCardSizeChange,
  onReverseOrder,
  onRotateAll,
  onResetOrder,
  onAddFiles,
  fileCount,
}) => {
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  return (
    <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
      {/* Thumbnail Size Segmented Toggle */}
      <div className="flex items-center p-0.5 rounded-full bg-white/95 border border-stone-200/90 shadow-2xs text-[11px] font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => onCardSizeChange('small')}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            cardSize === 'small'
              ? 'bg-stone-100 text-slate-800 font-bold shadow-2xs'
              : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Compact View"
        >
          S
        </button>
        <button
          type="button"
          onClick={() => onCardSizeChange('medium')}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            cardSize === 'medium'
              ? 'bg-stone-100 text-slate-800 font-bold shadow-2xs'
              : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Medium (Tall Page View)"
        >
          M
        </button>
        <button
          type="button"
          onClick={() => onCardSizeChange('large')}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            cardSize === 'large'
              ? 'bg-stone-100 text-slate-800 font-bold shadow-2xs'
              : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Large (Detailed View)"
        >
          L
        </button>
      </div>

      {/* Sort / Rotate Quick Popover Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsSortMenuOpen((prev) => !prev)}
          className="w-8 h-8 rounded-full bg-white/95 border border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-stone-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
          title="Sort & Transform Options"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
        </button>

        {isSortMenuOpen && (
          <div className="absolute right-0 top-10 w-48 rounded-xl bg-white border border-stone-200/90 shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs">
            <button
              type="button"
              onClick={() => {
                onReverseOrder();
                setIsSortMenuOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-stone-100 flex items-center gap-2 cursor-pointer font-medium"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Reverse Page Order</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onRotateAll(90);
                setIsSortMenuOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-stone-100 flex items-center gap-2 cursor-pointer font-medium"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Rotate All 90° CW</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onRotateAll(-90);
                setIsSortMenuOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-stone-100 flex items-center gap-2 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Rotate All 90° CCW</span>
            </button>
            <div className="h-px bg-stone-100 my-1" />
            <button
              type="button"
              onClick={() => {
                onResetOrder();
                setIsSortMenuOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
            >
              <Undo2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset to Original</span>
            </button>
          </div>
        )}
      </div>

      {/* Circular '+' Add File Button with Badge */}
      <button
        type="button"
        onClick={onAddFiles}
        className="relative w-8 h-8 rounded-full bg-[#ffd8e4] hover:bg-[#f6cad7] active:scale-95 text-[#3b0918] border border-rose-200/80 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all cursor-pointer"
        title="Add another PDF file to merge & organize"
      >
        <Plus className="w-4 h-4 text-[#3b0918]" />
        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-slate-800 text-white text-[9px] font-bold font-mono flex items-center justify-center border border-white">
          {fileCount}
        </span>
      </button>
    </div>
  );
};
