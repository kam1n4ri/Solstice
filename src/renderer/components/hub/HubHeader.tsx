import React from 'react';
import { Search, Settings, X } from 'lucide-react';

interface HubHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCount: number;
  onOpenSettings?: () => void;
}

export const HubHeader: React.FC<HubHeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeCount,
  onOpenSettings,
}) => {
  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container/60 z-40">
      <div className="w-full h-full px-margin-compact flex items-center justify-between gap-space-md">
        {/* Search Input Bar */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-[18px] text-outline pointer-events-none h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search apps & tools..."
              className="w-full h-[34px] pl-9 pr-8 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2 p-0.5 rounded text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {activeCount} active
            </span>
          )}

          {/* Settings icon */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            title="Preferences & Settings"
            className="w-[34px] h-[34px] flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
          >
            <Settings className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>
      </div>
    </header>
  );
};
