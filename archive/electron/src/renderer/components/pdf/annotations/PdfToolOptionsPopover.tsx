import React, { useEffect, useRef, useState } from 'react';
import { PenTool, Highlighter, X } from 'lucide-react';
import { PdfPenOptionsPanel } from './PdfPenOptionsPanel';
import { PdfHighlighterOptionsPanel } from './PdfHighlighterOptionsPanel';

interface PdfToolOptionsPopoverProps {
  isOpen: boolean;
  tool: 'pen' | 'highlight';
  highlightColor: string;
  onSelectHighlightColor: (color: string) => void;
  penColor: string;
  onSelectPenColor: (color: string) => void;
  penWidth: number;
  onSelectPenWidth: (width: number) => void;
  onClose: () => void;
}

export const PdfToolOptionsPopover: React.FC<PdfToolOptionsPopoverProps> = ({
  isOpen,
  tool,
  highlightColor,
  onSelectHighlightColor,
  penColor,
  onSelectPenColor,
  penWidth,
  onSelectPenWidth,
  onClose,
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Manage smooth enter & exit animation transitions
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsExiting(false);
    } else if (isRendered) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsExiting(false);
      }, 140);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-popover="pdf-tool-options"]')) {
        return;
      }
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 20);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  return (
    <div
      ref={popoverRef}
      data-popover="pdf-tool-options"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`pointer-events-auto absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-[0_12px_36px_rgba(44,38,30,0.14)] p-3 text-xs select-none z-50 font-sans ${
        isExiting
          ? 'opacity-0 scale-95 -translate-y-1.5 transition-all duration-140 ease-in pointer-events-none'
          : 'animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150'
      }`}
    >
      {/* Upward Hugging Caret */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-stone-200/90 rotate-45 rounded-tl-[2px]" />

      {/* Popover Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px]">
          {tool === 'pen' ? (
            <>
              <PenTool className="w-3.5 h-3.5 text-rose-600" />
              <span>Pen Settings</span>
            </>
          ) : (
            <>
              <Highlighter className="w-3.5 h-3.5 text-amber-600" />
              <span>Highlighter Settings</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {tool === 'pen' ? (
        <PdfPenOptionsPanel
          penColor={penColor}
          onSelectPenColor={onSelectPenColor}
          penWidth={penWidth}
          onSelectPenWidth={onSelectPenWidth}
        />
      ) : (
        <PdfHighlighterOptionsPanel
          highlightColor={highlightColor}
          onSelectHighlightColor={onSelectHighlightColor}
        />
      )}
    </div>
  );
};
