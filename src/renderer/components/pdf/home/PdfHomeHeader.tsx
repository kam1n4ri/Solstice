import React from 'react';
import { Search, X } from 'lucide-react';
import { PdfHomeTab } from './PdfHomeSidebar';

interface PdfHomeHeaderProps {
  activeTab: PdfHomeTab;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const PdfHomeHeader: React.FC<PdfHomeHeaderProps> = ({
  activeTab,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="w-full pt-8 pb-6 flex items-center justify-between select-none font-sans shrink-0">
      {/* Left: Section Title */}
      <h1 className="text-base font-bold text-slate-800 tracking-tight">
        {activeTab === 'home' ? 'Home' : 'Offline Tools'}
      </h1>

      {/* Right: Search Input (aligned with content right margin) */}
      <div className="relative w-64 sm:w-72">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={activeTab === 'tools' ? 'Filter tools...' : 'Search documents or tools...'}
          className="w-full pl-3.5 pr-8 py-1.5 text-xs rounded-xl bg-white border border-stone-200/80 focus:border-stone-300 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-200/60 shadow-2xs transition-all"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
      </div>
    </div>
  );
};
