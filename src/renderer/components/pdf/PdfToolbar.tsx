import React, { useState, useEffect, useRef } from 'react';
import {
  MousePointer, PenTool, Highlighter, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize2, RotateCw, Search,
} from 'lucide-react';
import { AnnotationTool } from './annotations/PdfAnnotationTypes';
import { PdfToolOptionsPopover } from './annotations/PdfToolOptionsPopover';
import { PdfPageNavigator } from './PdfPageNavigator';

interface PdfToolbarProps {
  scale: number;
  onZoomChange: (scale: number) => void;
  onFitWidth?: () => void;
  onRotate: () => void;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
  activeTool: AnnotationTool;
  onSelectTool: (tool: AnnotationTool) => void;
  highlightColor: string;
  onSelectHighlightColor: (color: string) => void;
  penColor: string;
  onSelectPenColor: (color: string) => void;
  penWidth: number;
  onSelectPenWidth: (width: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  currentPage: number;
  numPages: number;
  onPageChange: (pageNumber: number) => void;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = (props) => {
  const {
    scale, onZoomChange, onFitWidth, onRotate, isSearchOpen, onToggleSearch,
    activeTool, onSelectTool, highlightColor, onSelectHighlightColor,
    penColor, onSelectPenColor, penWidth, onSelectPenWidth, onUndo, canUndo, onRedo, canRedo,
    currentPage, numPages, onPageChange,
  } = props;

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const prevToolRef = useRef(activeTool);

  // Automatically open popover when tool switches to pen or highlighter
  useEffect(() => {
    if (prevToolRef.current !== activeTool) {
      setIsOptionsOpen(activeTool === 'pen' || activeTool === 'highlight');
      prevToolRef.current = activeTool;
    }
  }, [activeTool]);

  const handleToolClick = (tool: 'pen' | 'highlight') => {
    if (activeTool !== tool) {
      onSelectTool(tool);
      setIsOptionsOpen(true);
    } else {
      setIsOptionsOpen((prev) => !prev);
    }
  };

  const zoomPercent = Math.round(scale * 100);

  return (
    <div className="w-full flex justify-center bg-transparent select-none shrink-0 relative z-40 pointer-events-none">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md border-x border-b border-stone-200/90 rounded-b-2xl px-3 py-1 flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-xs font-sans relative">
        {/* Precision Page Navigation (Prev, Jump-to-Page Input, Next) */}
        <PdfPageNavigator
          currentPage={currentPage}
          numPages={numPages}
          onPageChange={onPageChange}
        />

        {/* Section Divider */}
        <div className="h-4 w-px bg-stone-200 mx-1" />

        {/* Selection Tool */}
        <button
          type="button"
          onClick={() => { onSelectTool('select'); setIsOptionsOpen(false); }}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            activeTool === 'select'
              ? 'bg-slate-100/90 text-slate-800 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-stone-100'
          }`}
          title="Select & Text Cursor (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Pen Tool with Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => handleToolClick('pen')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
              activeTool === 'pen'
                ? 'bg-rose-50/90 text-rose-700 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-stone-100'
            }`}
            title="Freehand Pen (P) — Click to toggle options"
          >
            <PenTool className="w-4 h-4" />
            <span
              className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full border border-white"
              style={{ backgroundColor: penColor }}
            />
          </button>

          {activeTool === 'pen' && (
            <PdfToolOptionsPopover
              isOpen={isOptionsOpen}
              tool="pen"
              highlightColor={highlightColor}
              onSelectHighlightColor={onSelectHighlightColor}
              penColor={penColor}
              onSelectPenColor={onSelectPenColor}
              penWidth={penWidth}
              onSelectPenWidth={onSelectPenWidth}
              onClose={() => setIsOptionsOpen(false)}
            />
          )}
        </div>

        {/* Highlighter Tool with Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => handleToolClick('highlight')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
              activeTool === 'highlight'
                ? 'bg-rose-50/90 text-rose-700 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-stone-100'
            }`}
            title="Highlight Text (H) — Click to toggle options"
          >
            <Highlighter className="w-4 h-4" />
            <span
              className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full border border-white"
              style={{ backgroundColor: highlightColor }}
            />
          </button>

          {activeTool === 'highlight' && (
            <PdfToolOptionsPopover
              isOpen={isOptionsOpen}
              tool="highlight"
              highlightColor={highlightColor}
              onSelectHighlightColor={onSelectHighlightColor}
              penColor={penColor}
              onSelectPenColor={onSelectPenColor}
              penWidth={penWidth}
              onSelectPenWidth={onSelectPenWidth}
              onClose={() => setIsOptionsOpen(false)}
            />
          )}
        </div>

        {/* Undo & Redo */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Section Divider */}
        <div className="h-4 w-px bg-stone-200 mx-1" />

        {/* Viewport Zoom Tools */}
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(0.4, scale - 0.15))}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono font-semibold text-slate-700 px-1 text-center min-w-[36px]">
          {zoomPercent}%
        </span>

        <button
          type="button"
          onClick={() => onZoomChange(Math.min(3.0, scale + 0.15))}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {onFitWidth && (
          <button
            type="button"
            onClick={onFitWidth}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Fit to Width"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Search */}
        {onToggleSearch && (
          <button
            type="button"
            onClick={onToggleSearch}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isSearchOpen ? 'bg-rose-50/90 text-rose-700' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
            }`}
            title="Find in Document (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Rotate */}
        <button
          type="button"
          onClick={onRotate}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors cursor-pointer"
          title="Rotate 90° Clockwise"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
