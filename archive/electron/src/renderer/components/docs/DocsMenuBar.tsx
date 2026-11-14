import React, { useState, useRef, useEffect } from 'react';
import { DocsMenuBarProps } from './DocsMenuTypes';
import { buildMenuDefinitions } from './DocsMenuDefinitions';
import { DocsMenuDropdown } from './DocsMenuDropdown';
import { cn } from '@/lib/utils';

const MENU_KEYS = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools'] as const;

export const DocsMenuBar: React.FC<DocsMenuBarProps> = (props) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuDefinitions = buildMenuDefinitions(props);

  // Close menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenu]);

  return (
    <nav ref={containerRef} className="relative flex items-center gap-0.5 mt-0.5 -ml-1">
      {MENU_KEYS.map((key) => {
        const isOpen = activeMenu === key;
        return (
          <div key={key} className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(isOpen ? null : key)}
              onMouseEnter={() => {
                if (activeMenu !== null) {
                  setActiveMenu(key);
                }
              }}
              className={cn(
                'px-1.5 py-0.5 rounded-sm text-xs transition-colors',
                isOpen
                  ? 'bg-slate-200/80 text-slate-900 font-medium'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
              )}
            >
              {key}
            </button>

            {isOpen && menuDefinitions[key] && (
              <div className="absolute left-0 top-full mt-1 z-50">
                <DocsMenuDropdown
                  items={menuDefinitions[key]}
                  onClose={() => setActiveMenu(null)}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
