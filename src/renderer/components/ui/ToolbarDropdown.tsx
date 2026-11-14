import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolbarDropdownOption<T extends string | number = string> {
  value: T;
  label: string;
  previewClass?: string;
  previewStyle?: React.CSSProperties;
  badge?: string;
}

export interface ToolbarDropdownProps<T extends string | number = string> {
  value: T;
  options: ToolbarDropdownOption<T>[];
  onChange: (value: T) => void;
  title?: string;
  triggerLabel?: string;
  triggerClass?: string;
  menuClass?: string;
  maxMenuHeight?: string;
}

export function ToolbarDropdown<T extends string | number = string>({
  value,
  options,
  onChange,
  title,
  triggerLabel,
  triggerClass,
  menuClass,
  maxMenuHeight = 'max-h-[320px]',
}: ToolbarDropdownProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeOption = options.find((opt) => opt.value === value);
  const displayLabel = triggerLabel || activeOption?.label || String(value);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer select-none',
          isOpen ? 'bg-slate-200/80 text-slate-900' : 'hover:bg-slate-200/60',
          triggerClass
        )}
      >
        <span style={activeOption?.previewStyle} className="truncate">
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            'h-2.5 w-2.5 opacity-60 shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1.5 p-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg z-50 text-xs flex flex-col gap-0.5 animate-in fade-in duration-100 overflow-y-auto',
            maxMenuHeight,
            menuClass || 'min-w-[140px]'
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-blue-50/80 text-blue-700/90 font-medium'
                    : 'text-slate-700 hover:bg-slate-100/80'
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    style={opt.previewStyle}
                    className={cn('truncate', opt.previewClass)}
                  >
                    {opt.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-normal">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected ? (
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
