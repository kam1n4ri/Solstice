import React, { useState, useRef, useEffect } from 'react';
import { Columns2, FileText, Sun, Moon, Coffee, SlidersHorizontal } from 'lucide-react';
import { PdfLayoutMode, PdfColorTheme } from './PdfViewerTypes';

interface PdfViewModeMenuProps {
  layoutMode: PdfLayoutMode;
  onSelectLayoutMode: (mode: PdfLayoutMode) => void;
  colorTheme: PdfColorTheme;
  onSelectColorTheme: (theme: PdfColorTheme) => void;
}

export const PdfViewModeMenu: React.FC<PdfViewModeMenuProps> = ({
  layoutMode,
  onSelectLayoutMode,
  colorTheme,
  onSelectColorTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          isOpen || layoutMode === 'spread' || colorTheme !== 'default'
            ? 'bg-rose-50/90 text-rose-700'
            : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
        }`}
        title="View & Theme Options (Spread layout, Sepia, Dark mode)"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-52 bg-white/95 backdrop-blur-md rounded-xl border border-stone-200/90 shadow-lg p-2.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-100 select-none">
          {/* Layout Mode Section */}
          <div className="mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
              Page Layout
            </span>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectLayoutMode('single');
                  setIsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                  layoutMode === 'single'
                    ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200/60'
                    : 'text-slate-700 hover:bg-stone-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Single Page</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectLayoutMode('spread');
                  setIsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                  layoutMode === 'spread'
                    ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200/60'
                    : 'text-slate-700 hover:bg-stone-100'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Book Spread</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-stone-100 my-1.5" />

          {/* Reading Color Theme Section */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
              Reading Theme
            </span>
            <div className="grid grid-cols-3 gap-1 mt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectColorTheme('default');
                  setIsOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all cursor-pointer ${
                  colorTheme === 'default'
                    ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200/60'
                    : 'text-slate-700 hover:bg-stone-100'
                }`}
                title="Default Pure White"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px]">Normal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectColorTheme('sepia');
                  setIsOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all cursor-pointer ${
                  colorTheme === 'sepia'
                    ? 'bg-amber-100/70 text-amber-900 font-semibold border border-amber-300/60'
                    : 'text-slate-700 hover:bg-amber-50/60'
                }`}
                title="Warm Parchment Sepia"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[10px]">Sepia</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectColorTheme('dark');
                  setIsOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all cursor-pointer ${
                  colorTheme === 'dark'
                    ? 'bg-slate-900 text-white font-semibold border border-slate-700'
                    : 'text-slate-700 hover:bg-stone-100'
                }`}
                title="Soft Inverted Night Mode"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px]">Dark</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
