import React from 'react';
import { Editor } from '@tiptap/react';
import { Search, ChevronDown, ChevronUp, X, Replace } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDocsFindReplace } from './useDocsFindReplace';

interface DocsFindReplaceProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  focusTrigger?: number;
}

export const DocsFindReplace: React.FC<DocsFindReplaceProps> = ({
  editor,
  isOpen,
  onClose,
  focusTrigger,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    replaceTerm,
    setReplaceTerm,
    matches,
    currentIndex,
    caseSensitive,
    setCaseSensitive,
    searchInputRef,
    handleClose,
    handleNext,
    handlePrev,
    handleReplaceCurrent,
    handleReplaceAll,
  } = useDocsFindReplace({ editor, isOpen, onClose, focusTrigger });

  if (!isOpen) return null;

  return (
    <div className="absolute top-3 right-6 z-40 w-80 rounded-xl border border-slate-200/90 bg-white p-3 shadow-xl text-xs text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 print:hidden">
      {/* Top Header & Search Input */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) handlePrev();
                else handleNext();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }
            }}
            placeholder="Find in document..."
            className="w-full pl-8 pr-16 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <span className="absolute right-2 text-[10px] font-mono text-slate-500">
              {matches.length > 0 ? `${currentIndex + 1} / ${matches.length}` : '0 / 0'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={matches.length === 0}
            title="Previous match (Shift+Enter)"
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={matches.length === 0}
            title="Next match (Enter)"
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCaseSensitive((prev) => !prev)}
            title="Match case"
            className={cn(
              'px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors font-semibold border',
              caseSensitive
                ? 'bg-blue-100/80 text-blue-800 border-blue-200/80'
                : 'text-slate-500 hover:bg-slate-100 border-transparent'
            )}
          >
            Aa
          </button>
          <button
            type="button"
            onClick={handleClose}
            title="Close (Esc)"
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 ml-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Replace Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Replace className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleReplaceCurrent();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }
            }}
            placeholder="Replace with..."
            className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:bg-white transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={handleReplaceCurrent}
          disabled={matches.length === 0}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-none"
        >
          Replace
        </button>

        <button
          type="button"
          onClick={handleReplaceAll}
          disabled={matches.length === 0}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50/80 hover:bg-blue-100/80 text-blue-700/90 border border-blue-200/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-none"
        >
          All
        </button>
      </div>
    </div>
  );
};
