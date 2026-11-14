import React, { useState } from 'react';
import { Pencil, ArrowRight, FolderOpen, Plus, Loader2 } from 'lucide-react';

interface WhiteboardDeskHeroProps {
  onNewBlank: () => void;
  onOpenFilePicker: () => void;
  onDropFiles?: (files: FileList) => void;
  isPreparing?: boolean;
  preparingId?: string | null;
}

export const WhiteboardDeskHero: React.FC<WhiteboardDeskHeroProps> = ({
  onNewBlank,
  onOpenFilePicker,
  onDropFiles,
  isPreparing = false,
  preparingId = null,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDropFiles) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <section className="text-center select-none pt-4 pb-2">
      {/* Eyebrow: handwritten caveat font with sparkle */}
      <div className="font-caveat text-xl sm:text-2xl font-bold text-amber-600/90 tracking-wide flex items-center justify-center gap-1.5">
        <span>infinite sketchpad &amp; napkin thoughts</span>
        <span className="text-amber-500 text-lg">✦</span>
      </div>

      {/* Main Heading */}
      <div className="mt-1 inline-flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Where ideas take shape.
        </h1>
        {/* Hand-drawn SVG swoop underline */}
        <svg
          className="w-52 sm:w-64 h-3.5 text-amber-500/90 -mt-1 sm:-mt-1.5"
          viewBox="0 0 240 14"
          fill="none"
        >
          <path
            d="M 6 10 C 65 3, 175 3, 234 11"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-5 mt-7 max-w-xl mx-auto w-full px-4">
        {/* Button 1: New Board */}
        <button
          type="button"
          onClick={onNewBlank}
          disabled={isPreparing}
          className="flex-1 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 shadow-[0_8px_22px_rgba(245,158,11,0.24)] hover:shadow-[0_10px_28px_rgba(245,158,11,0.32)] transition-all duration-150 cursor-pointer text-slate-950 group disabled:opacity-75 disabled:cursor-wait"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-300/80 flex items-center justify-center shrink-0 shadow-2xs text-slate-950">
              {isPreparing && preparingId === 'blank' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Pencil className="h-4.5 w-4.5 stroke-[2.2]" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-slate-950 leading-tight">New Board</span>
              <span className="text-[11px] font-medium text-amber-950/75 leading-tight mt-0.5">
                Blank infinite sheet
              </span>
            </div>
          </div>
          <ArrowRight className="h-4.5 w-4.5 text-slate-950 stroke-[2.4] group-hover:translate-x-1 transition-transform shrink-0" />
        </button>

        {/* Button 2: Drop or Browse */}
        <div
          onClick={onOpenFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 bg-white/85 hover:bg-white active:scale-[0.98] border-2 border-dashed rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 shadow-2xs transition-all duration-150 cursor-pointer text-slate-800 group ${
            isDragOver
              ? 'border-amber-500 bg-amber-50/50 scale-[1.02]'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100/90 flex items-center justify-center shrink-0 text-slate-600 shadow-2xs">
              <FolderOpen className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-slate-800 leading-tight">Drop or browse</span>
              <span className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">
                .excalidraw or .json
              </span>
            </div>
          </div>
          <Plus className="h-4.5 w-4.5 text-slate-400 stroke-[2.2] group-hover:text-slate-700 transition-colors shrink-0" />
        </div>
      </div>
    </section>
  );
};
