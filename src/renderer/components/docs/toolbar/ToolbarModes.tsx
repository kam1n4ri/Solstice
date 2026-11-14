import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Pencil, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarModesProps {
  editor: Editor | null;
  isEditable?: boolean;
  onSetEditable?: (editable: boolean) => void;
  isHeaderHidden?: boolean;
  onToggleHeader?: () => void;
}

export const ToolbarModes: React.FC<ToolbarModesProps> = ({
  editor,
  isEditable: isEditableProp,
  onSetEditable,
  isHeaderHidden = false,
  onToggleHeader,
}) => {
  const [showModesMenu, setShowModesMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowModesMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModesMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!editor) return null;

  const isEditable = isEditableProp ?? editor.isEditable;

  return (
    <div ref={containerRef} className="flex items-center gap-1 shrink-0 ml-auto pl-2">
      {/* Editing / Viewing Mode Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowModesMenu((prev) => !prev)}
          title="Document Mode"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
        >
          {isEditable ? (
            <>
              <Pencil className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden md:inline">Editing</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden md:inline">Viewing</span>
            </>
          )}
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>

        {showModesMenu && (
          <div className="absolute right-0 top-full mt-1.5 p-1 w-48 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg z-50 text-xs flex flex-col gap-0.5 animate-in fade-in duration-100">
            <button
              type="button"
              onClick={() => {
                editor.setEditable(true);
                onSetEditable?.(true);
                setShowModesMenu(false);
              }}
              className={cn(
                'w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                isEditable ? 'bg-blue-50/80 text-blue-900 font-medium' : 'text-slate-700 hover:bg-slate-100/80'
              )}
            >
              <Pencil className="h-3.5 w-3.5 mt-0.5 text-blue-600 shrink-0" />
              <div>
                <div className="font-medium">Editing</div>
                <div className="text-[10px] text-slate-500">Edit document directly</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                editor.setEditable(false);
                onSetEditable?.(false);
                setShowModesMenu(false);
              }}
              className={cn(
                'w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                !isEditable ? 'bg-blue-50/80 text-blue-900 font-medium' : 'text-slate-700 hover:bg-slate-100/80'
              )}
            >
              <Eye className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
              <div>
                <div className="font-medium">Viewing</div>
                <div className="text-[10px] text-slate-500">Read or print only</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Collapse / Expand Header Chevron */}
      <button
        type="button"
        onClick={onToggleHeader}
        title={isHeaderHidden ? 'Show menus' : 'Hide menus (full screen)'}
        className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
      >
        {isHeaderHidden ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
};
