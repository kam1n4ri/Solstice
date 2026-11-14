import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FontCategoryItem {
  id: string;
  label: string;
}

interface HubFontFiltersProps {
  activeTab: 'catalog' | 'installed';
  onTabChange: (tab: 'catalog' | 'installed') => void;
  totalSuiteAvailable: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: FontCategoryItem[];
}

export const HubFontFilters: React.FC<HubFontFiltersProps> = ({
  activeTab,
  onTabChange,
  totalSuiteAvailable,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}) => {
  return (
    <>
      {/* Navigation Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-surface-container">
        {/* Tabs: Catalog vs Installed */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 border border-outline-variant/20 self-start">
          <button
            type="button"
            onClick={() => onTabChange('catalog')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'catalog'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs font-medium'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            Discover Fonts
          </button>
          <button
            type="button"
            onClick={() => onTabChange('installed')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'installed'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs font-medium'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <span>Installed</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant">
              {totalSuiteAvailable}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search fonts by name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-outline focus:ring-1 focus:ring-outline/20 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategoryChange(c.id)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
              selectedCategory === c.id
                ? 'bg-secondary-container text-on-secondary-fixed-variant font-medium shadow-xs'
                : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant/20'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </>
  );
};
