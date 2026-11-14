import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, X, CaseSensitive } from 'lucide-react';
import { PDFDocumentProxy } from './pdfjsSetup';

interface SearchMatch {
  pageNumber: number;
}

interface PdfSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  doc: PDFDocumentProxy | null;
  onJumpToPage: (pageNumber: number) => void;
}

export const PdfSearchBar: React.FC<PdfSearchBarProps> = ({
  isOpen,
  onClose,
  doc,
  onJumpToPage,
}) => {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setMatches([]);
      setCurrentIndex(-1);
    }
  }, [isOpen]);

  // Execute full-text search across document pages
  const performSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || !doc) {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }

    setIsSearching(true);
    const results: SearchMatch[] = [];
    const searchTerm = caseSensitive ? trimmed : trimmed.toLowerCase();

    try {
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');

        const target = caseSensitive ? pageText : pageText.toLowerCase();
        let pos = target.indexOf(searchTerm);

        while (pos !== -1) {
          results.push({ pageNumber: p });
          pos = target.indexOf(searchTerm, pos + searchTerm.length);
        }
      }

      setMatches(results);
      if (results.length > 0) {
        setCurrentIndex(0);
        onJumpToPage(results[0].pageNumber);
      } else {
        setCurrentIndex(-1);
      }
    } catch (err) {
      console.warn('PDF search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [query, caseSensitive, doc, onJumpToPage]);

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 250);
    return () => clearTimeout(timer);
  }, [performSearch]);

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    onJumpToPage(matches[nextIdx].pageNumber);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    onJumpToPage(matches[prevIdx].pageNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-6 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-stone-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-xs font-sans animate-in fade-in slide-in-from-top-2 duration-150 select-none">
      <div className="flex items-center gap-1.5 pl-2.5 pr-1.5">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find in document..."
          className="w-40 sm:w-52 py-1 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
        />
      </div>

      {/* Match Count Indicator */}
      <div className="text-[11px] font-mono font-medium text-slate-400 px-1.5 min-w-[50px] text-center">
        {isSearching
          ? '...'
          : query
          ? matches.length > 0
            ? `${currentIndex + 1}/${matches.length}`
            : '0/0'
          : ''}
      </div>

      {/* Case Sensitive Switch */}
      <button
        onClick={() => setCaseSensitive(!caseSensitive)}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          caseSensitive
            ? 'bg-rose-50 text-rose-700 border border-rose-200/80 font-bold'
            : 'text-slate-400 hover:text-slate-700 hover:bg-stone-100'
        }`}
        title="Match Case"
      >
        <CaseSensitive className="w-3.5 h-3.5" />
      </button>

      {/* Previous / Next Match Buttons */}
      <div className="flex items-center gap-0.5 border-l border-stone-200 pl-1">
        <button
          disabled={matches.length === 0}
          onClick={handlePrev}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Previous Match (Shift+Enter)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <button
          disabled={matches.length === 0}
          onClick={handleNext}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Next Match (Enter)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Close Search */}
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-700 transition-colors ml-0.5"
        title="Close (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
