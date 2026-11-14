import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface WhiteboardHomeHeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showSearch?: boolean;
}

export const WhiteboardHomeHeader: React.FC<WhiteboardHomeHeaderProps> = ({
  searchQuery = '',
  onSearchChange,
  showSearch = false,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="w-full pt-7 pb-4 px-8 sm:px-12 flex items-center justify-between select-none">
      {/* Top Left: Exact Typography from Mockup */}
      <div className="flex items-baseline">
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Solstice
        </span>
        <span className="font-caveat text-2xl font-bold text-amber-600/90 ml-1.5 lowercase tracking-wide">
          whiteboard
        </span>
      </div>

      {/* Top Right: Unobtrusive Search for power users */}
      {showSearch && onSearchChange && (
        <div className="flex items-center gap-2">
          {isSearchOpen || searchQuery ? (
            <div className="relative flex items-center animate-in fade-in duration-150">
              <Search className="absolute left-2.5 text-slate-400 pointer-events-none h-3.5 w-3.5" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search desk..."
                className="w-48 sm:w-56 h-7 pl-8 pr-7 rounded-full bg-white/90 text-slate-800 placeholder:text-slate-400 text-xs border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-amber-300 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchOpen(false);
                }}
                title="Close search"
                className="absolute right-2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              title="Search boards"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
