import React from 'react';
import {
  Home,
  FolderOpen,
  RefreshCw,
  FileText,
  Palette,
  Type,
} from 'lucide-react';
import { ToolCategory } from '@shared/types';
import { cn } from '@/lib/utils';

interface HubSidebarProps {
  currentCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  activeCountsByCategory: Record<ToolCategory, number>;
  activeView: 'apps' | 'files' | 'fonts';
  onSelectView: (view: 'apps' | 'files' | 'fonts') => void;
}

export const HubSidebar: React.FC<HubSidebarProps> = ({
  currentCategory,
  onSelectCategory,
  activeCountsByCategory,
  activeView,
  onSelectView,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col">
      {/* Brand Header — Pure typographic wordmark */}
      <div className="h-14 flex items-center px-margin-compact border-b border-surface-container/50">
        <span className="text-lg tracking-tight font-semibold text-on-surface">
          Solstice
        </span>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto px-space-sm py-space-sm space-y-space-md">
        {/* Main Primary Nav */}
        <nav className="space-y-space-xs">
          <button
            onClick={() => {
              onSelectView('apps');
              onSelectCategory('all');
            }}
            className={cn(
              'w-full flex items-center justify-between px-space-sm py-space-xs rounded-xl transition-colors text-xs',
              activeView === 'apps' && currentCategory === 'all'
                ? 'bg-secondary-container text-on-secondary-fixed-variant font-medium shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            )}
          >
            <div className="flex items-center gap-space-sm">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </div>
          </button>

          <button
            onClick={() => onSelectView('files')}
            className={cn(
              'w-full flex items-center justify-between px-space-sm py-space-xs rounded-xl transition-colors text-xs cursor-pointer',
              activeView === 'files'
                ? 'bg-secondary-container text-on-secondary-fixed-variant font-medium shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            )}
          >
            <div className="flex items-center gap-space-sm">
              <FolderOpen className="h-4 w-4" />
              <span>Files and Workspaces</span>
            </div>
          </button>

          <button
            type="button"
            disabled
            className="w-full flex items-center justify-between px-space-sm py-space-xs rounded-xl text-outline-variant/60 cursor-not-allowed text-xs select-none"
          >
            <div className="flex items-center gap-space-sm">
              <RefreshCw className="h-4 w-4 text-outline-variant/60" />
              <span>Updates</span>
            </div>
            <span className="text-[10px] text-outline/60 font-mono">Soon</span>
          </button>
        </nav>

        {/* Categories Nav */}
        <div className="pt-space-xs">
          <div className="px-space-sm pb-space-xs text-[11px] text-outline tracking-wider uppercase font-semibold">
            CATEGORIES
          </div>
          <nav className="space-y-space-xs">
            <button
              onClick={() => {
                onSelectView('apps');
                onSelectCategory('productivity');
              }}
              className={cn(
                'w-full flex items-center justify-between px-space-sm py-space-xs rounded-xl transition-colors text-xs',
                activeView === 'apps' && currentCategory === 'productivity'
                  ? 'bg-secondary-container text-on-secondary-fixed-variant font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              )}
            >
              <div className="flex items-center gap-space-sm">
                <FileText className="h-4 w-4" />
                <span>Productivity &amp; Office</span>
              </div>
              {activeCountsByCategory.productivity > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">
                  {activeCountsByCategory.productivity}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectView('apps');
                onSelectCategory('media');
              }}
              className={cn(
                'w-full flex items-center justify-between px-space-sm py-space-xs rounded-xl transition-colors text-xs',
                activeView === 'apps' && currentCategory === 'media'
                  ? 'bg-secondary-container text-on-secondary-fixed-variant font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              )}
            >
              <div className="flex items-center gap-space-sm">
                <Palette className="h-4 w-4" />
                <span>Media &amp; Creation</span>
              </div>
              {activeCountsByCategory.media > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">
                  {activeCountsByCategory.media}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Assets / Manage Section */}
        <div className="pt-space-xs">
          <div className="px-space-sm pb-space-xs text-[11px] text-outline tracking-wider uppercase font-semibold">
            ASSETS / MANAGE
          </div>
          <nav className="space-y-space-xs">
            <button
              type="button"
              onClick={() => onSelectView('fonts')}
              className={cn(
                'w-full flex items-center justify-between px-space-sm py-space-xs rounded-xl transition-colors text-xs cursor-pointer',
                activeView === 'fonts'
                  ? 'bg-secondary-container text-on-secondary-fixed-variant font-medium shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              )}
            >
              <div className="flex items-center gap-space-sm">
                <Type className="h-4 w-4" />
                <span>Fonts</span>
              </div>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
};
