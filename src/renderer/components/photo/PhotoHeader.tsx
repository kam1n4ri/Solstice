import React, { memo } from 'react';
import {
  ArrowLeft,
  Folder,
  CloudCheck,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Download,
  RotateCcw,
} from 'lucide-react';

interface PhotoHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  statusText?: string;
  filePath: string | null;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoom100: () => void;
  onRevealFolder: () => void;
  onExport: () => void;
  onBackToHome: () => void;
  onOpenUpscale?: () => void;
  onRevertToOriginal?: () => void;
}

export const PhotoHeader: React.FC<PhotoHeaderProps> = memo(({
  title,
  onTitleChange,
  statusText = 'Saved',
  filePath,
  zoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoom100,
  onRevealFolder,
  onExport,
  onBackToHome,
  onOpenUpscale,
  onRevertToOriginal,
}) => {
  return (
    <header className="h-12 border-b border-stone-200/80 bg-[#fafbfc]/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* 1. Left: Back Arrow, Brand Logo, Title Input, Explorer Folder, Saving Status */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onBackToHome}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          title="Return to Photos Home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Solstice Photo Brand Logo Text */}
        <div className="flex items-baseline select-none shrink-0 pr-1">
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Solstice
          </span>
          <span className="font-caveat text-xl font-bold text-stone-600/90 ml-1.5 lowercase tracking-wide">
            photo
          </span>
        </div>

        <div className="h-5 w-px bg-slate-300/60 mx-1 shrink-0" />

        {/* Editable Image Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled image"
          className="bg-transparent hover:outline hover:outline-1 hover:outline-stone-300 focus:bg-white px-2 py-0.5 rounded text-[15px] font-normal text-slate-800 leading-tight focus:outline-none focus:ring-1 focus:ring-stone-300 transition-colors w-36 sm:w-52 truncate"
          title="Click to rename"
        />

        {/* Show in File Explorer Button */}
        <button
          type="button"
          onClick={onRevealFolder}
          title={filePath ? `Reveal in File Explorer (${filePath})` : 'File not yet saved to disk'}
          className="p-1 rounded-md hover:bg-stone-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Folder className="h-4 w-4" />
        </button>

        {/* Revert to Original Source */}
        {onRevertToOriginal && (
          <button
            type="button"
            onClick={onRevertToOriginal}
            title="Revert to original file (discard all edits and reload external source)"
            className="p-1 rounded-md hover:bg-stone-200/60 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Saving Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-1 shrink-0">
          <CloudCheck className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-sans text-slate-500">{statusText}</span>
        </div>
      </div>

      {/* 2. Center: Undo and Redo History Controls */}
      <div className="flex items-center gap-1 bg-stone-100/70 border border-stone-200/60 rounded-lg p-0.5 shadow-xs">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded-md transition-colors ${
            canUndo
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80 cursor-pointer'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 rounded-md transition-colors ${
            canRedo
              ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80 cursor-pointer'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 3. Right: Zoom Controls and Pastel Export Button */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-0.5 bg-stone-100/70 border border-stone-200/60 rounded-lg p-0.5 text-xs text-slate-600">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom out"
            className="p-1 rounded hover:bg-white/80 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoom100}
            title="Reset to 100%"
            className="px-1.5 py-0.5 text-[11px] font-medium font-mono hover:bg-white/80 rounded transition-colors cursor-pointer min-w-[42px] text-center"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom in"
            className="p-1 rounded hover:bg-white/80 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomFit}
            title="Fit to Screen"
            className="p-1 rounded hover:bg-white/80 hover:text-slate-900 transition-colors cursor-pointer ml-0.5"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Super Resolution & Clarity Upscale */}
        {onOpenUpscale && (
          <button
            type="button"
            onClick={onOpenUpscale}
            className="h-8 px-3 rounded-md text-xs font-medium bg-stone-100 hover:bg-stone-200/90 text-stone-700 border border-stone-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Super Resolution & Clarity Upscale (2x / 4x)"
          >
            <Maximize2 className="h-3.5 w-3.5 text-stone-500" />
            <span>Upscale</span>
          </button>
        )}

        {/* Professional Desktop Export Button */}
        <button
          type="button"
          onClick={onExport}
          className="h-8 px-3.5 rounded-md text-xs font-medium bg-stone-900 hover:bg-black text-white border border-stone-900 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          title="Export image file"
        >
          <Download className="h-3.5 w-3.5 text-stone-300" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
});
