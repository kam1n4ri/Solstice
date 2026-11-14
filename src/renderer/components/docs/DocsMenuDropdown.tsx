import React, { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { MenuItem } from './DocsMenuTypes';
import { cn } from '@/lib/utils';

interface DocsMenuDropdownProps {
  items: MenuItem[];
  onClose: () => void;
  className?: string;
}

export const DocsMenuDropdown: React.FC<DocsMenuDropdownProps> = ({
  items,
  onClose,
  className,
}) => {
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);

  return (
    <div
      className={cn(
        'min-w-[220px] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl text-xs select-none z-50 text-slate-700 animate-in fade-in duration-100',
        className
      )}
    >
      {items.map((item) => {
        if (item.divider) {
          return <div key={item.id} className="my-1 border-t border-slate-100" />;
        }

        const hasSubmenu = item.submenu && item.submenu.length > 0;
        const isSubmenuOpen = activeSubmenuId === item.id;

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => setActiveSubmenuId(hasSubmenu ? item.id : null)}
          >
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (hasSubmenu) return;
                if (item.onClick) {
                  item.onClick();
                  onClose();
                }
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors',
                item.disabled
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : 'hover:bg-blue-50 hover:text-blue-700 text-slate-700'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 flex items-center justify-center shrink-0">
                  {item.checked ? (
                    <Check className="h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    item.icon
                  )}
                </span>
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-2 pl-4">
                {item.shortcut && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.shortcut}
                  </span>
                )}
                {hasSubmenu && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
              </div>
            </button>

            {hasSubmenu && isSubmenuOpen && (
              <div className="absolute left-full top-0 ml-1 z-50">
                <DocsMenuDropdown
                  items={item.submenu!}
                  onClose={onClose}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
