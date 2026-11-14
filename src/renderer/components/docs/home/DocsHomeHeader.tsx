import React from 'react';
import { Search, X } from 'lucide-react';

interface DocsHomeHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const DocsHomeHeader: React.FC<DocsHomeHeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-surface-container/80 z-40 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between gap-4">
        {/* Left: Solstice Docs Brand Text / Logo */}
        <div className="flex items-baseline select-none shrink-0">
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Solstice
          </span>
          <span className="font-caveat text-2xl font-bold text-blue-600/90 ml-1.5 lowercase tracking-wide">
            docs
          </span>
        </div>

        {/* Middle: Search Bar (Pale light-grey pill on white header) */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-outline pointer-events-none h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search documents..."
              className="w-full h-[36px] pl-9 pr-8 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline text-xs border border-surface-container/60 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-200 focus:border-blue-200 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                title="Clear search"
                className="absolute right-2.5 p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Nothing on the top right */}
        <div className="w-36 shrink-0 hidden sm:block pointer-events-none" />
      </div>
    </header>
  );
};
