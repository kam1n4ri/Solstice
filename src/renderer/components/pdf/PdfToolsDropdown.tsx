import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  ChevronDown,
  Layers,
  Scissors,
  Grid,
  Stamp,
  Hash,
  Image as ImageIcon,
  Shield,
} from 'lucide-react';

interface PdfToolsDropdownProps {
  onOpenTool?: (toolId: string) => void;
  onOpenOrganize?: () => void;
}

export const PdfToolsDropdown: React.FC<PdfToolsDropdownProps> = ({
  onOpenTool,
  onOpenOrganize,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

  const toolItems = [
    {
      id: 'organize',
      name: 'Organize Pages',
      icon: Grid,
      action: () => {
        setIsOpen(false);
        onOpenOrganize?.();
      },
    },
    {
      id: 'merge',
      name: 'Merge PDF',
      icon: Layers,
      action: () => {
        setIsOpen(false);
        onOpenTool?.('merge');
      },
    },
    {
      id: 'split',
      name: 'Split PDF',
      icon: Scissors,
      action: () => {
        setIsOpen(false);
        onOpenTool?.('split');
      },
    },
    {
      id: 'watermark',
      name: 'Watermark PDF',
      icon: Stamp,
      action: () => {
        setIsOpen(false);
        onOpenTool?.('watermark');
      },
    },
    {
      id: 'page-numbers',
      name: 'Page Numbers',
      icon: Hash,
      action: () => {
        setIsOpen(false);
        onOpenTool?.('page-numbers');
      },
    },
    {
      id: 'security',
      name: 'Protect & Security',
      icon: Shield,
      action: () => {
        setIsOpen(false);
        onOpenTool?.('security');
      },
    },
    {
      id: 'convert',
      name: 'Images ⇄ PDF',
      icon: ImageIcon,
      action: () => {
        setIsOpen(false);
        onOpenTool?.('convert');
      },
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200/80 text-xs font-medium transition-colors cursor-pointer ${
          isOpen
            ? 'bg-stone-100 text-slate-900 shadow-2xs'
            : 'bg-white/90 hover:bg-stone-100 text-slate-600 hover:text-slate-900 shadow-2xs'
        }`}
        title="PDF Tools & Operations"
      >
        <Wrench className="w-3.5 h-3.5 text-slate-500" />
        <span className="hidden sm:inline">Tools</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-stone-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            PDF Operations
          </div>
          {toolItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:text-slate-900 hover:bg-stone-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
