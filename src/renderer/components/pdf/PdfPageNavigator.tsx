import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PdfPageNavigatorProps {
  currentPage: number;
  numPages: number;
  onPageChange: (pageNumber: number) => void;
}

export const PdfPageNavigator: React.FC<PdfPageNavigatorProps> = ({
  currentPage,
  numPages,
  onPageChange,
}) => {
  const [localInput, setLocalInput] = useState<string>(String(currentPage));

  useEffect(() => {
    setLocalInput(String(currentPage));
  }, [currentPage]);

  const commitPage = () => {
    const parsed = parseInt(localInput.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      if (parsed !== currentPage) {
        onPageChange(parsed);
      }
    } else {
      setLocalInput(String(currentPage));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitPage();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setLocalInput(String(currentPage));
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentPage < numPages) onPageChange(currentPage + 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentPage > 1) onPageChange(currentPage - 1);
    }
  };

  return (
    <div className="flex items-center gap-1 text-slate-600 select-none">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        title="Previous Page (PageUp / Left Arrow)"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
        <input
          type="text"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          onBlur={commitPage}
          onKeyDown={handleKeyDown}
          className="w-8 h-6 text-center text-xs font-semibold text-slate-800 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200/80 focus:border-rose-300 rounded focus:outline-none focus:ring-1 focus:ring-rose-200 transition-colors"
          title="Jump to Page (Type and press Enter)"
        />
        <span className="text-slate-400 font-sans">/</span>
        <span className="text-slate-600 font-semibold">{numPages}</span>
      </div>

      <button
        type="button"
        disabled={currentPage >= numPages}
        onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
        className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        title="Next Page (PageDown / Right Arrow)"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
