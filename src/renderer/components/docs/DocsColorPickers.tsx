import React, { useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Palette, Highlighter, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  editor: Editor;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  showHighlightPicker: boolean;
  setShowHighlightPicker: (show: boolean) => void;
}

const TEXT_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Dark Slate', value: '#1e293b' },
  { name: 'Slate Gray', value: '#64748b' },
  { name: 'Crimson', value: '#dc2626' },
  { name: 'Amber Orange', value: '#d97706' },
  { name: 'Emerald', value: '#16a34a' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Ocean Blue', value: '#2563eb' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: '' },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Cyan', value: '#a5f3fc' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Peach', value: '#fed7aa' },
  { name: 'Rose', value: '#fecdd3' },
];

export const DocsColorPickers: React.FC<ColorPickerProps> = ({
  editor,
  showColorPicker,
  setShowColorPicker,
  showHighlightPicker,
  setShowHighlightPicker,
}) => {
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightColorRef = useRef<HTMLDivElement>(null);

  // Active color attributes
  const currentColor = (editor.getAttributes('textStyle').color as string) || '';
  const activeDisplayColor = currentColor || '#0f172a';
  const currentHighlight = (editor.getAttributes('highlight').color as string) || '';

  // Close color popovers on outside click or Escape key
  useEffect(() => {
    if (!showColorPicker && !showHighlightPicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showColorPicker && textColorRef.current && !textColorRef.current.contains(target)) {
        setShowColorPicker(false);
      }
      if (showHighlightPicker && highlightColorRef.current && !highlightColorRef.current.contains(target)) {
        setShowHighlightPicker(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showColorPicker, showHighlightPicker, setShowColorPicker, setShowHighlightPicker]);

  return (
    <>
      {/* Text Color Popover */}
      <div ref={textColorRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
          }}
          title="Text Color"
          className="flex items-center gap-0.5 p-1.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
        >
          <div className="flex flex-col items-center">
            <Palette className="h-3.5 w-3.5" />
            <span
              className="h-[2px] w-3.5 rounded-full mt-0.5 shadow-2xs"
              style={{ backgroundColor: activeDisplayColor }}
            />
          </div>
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>

        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1.5 p-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg z-50 flex items-center gap-1.5 animate-in fade-in duration-100">
            <div className="flex items-center gap-1">
              {TEXT_COLORS.map((c) => {
                const isSelected =
                  c.value === 'inherit'
                    ? !currentColor
                    : currentColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      if (c.value === 'inherit') editor.chain().focus().unsetColor().run();
                      else editor.chain().focus().setColor(c.value).run();
                      setShowColorPicker(false);
                    }}
                    title={c.name}
                    className={cn(
                      'h-5 w-5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center shadow-2xs',
                      isSelected
                        ? 'ring-2 ring-blue-500/80 ring-offset-1 border-transparent'
                        : 'border-slate-300 hover:border-slate-500'
                    )}
                    style={{ backgroundColor: c.value === 'inherit' ? '#0f172a' : c.value }}
                  >
                    {c.value === 'inherit' && (
                      <span className="text-[9px] text-white/90 font-medium">A</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

            {/* Custom Color Input */}
            <label
              title="Custom color"
              className="h-5 w-5 rounded-full border border-dashed border-slate-400 hover:border-blue-500 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs relative shrink-0"
            >
              <Plus className="h-3 w-3 text-slate-600" />
              <input
                type="color"
                value={activeDisplayColor.startsWith('#') ? activeDisplayColor : '#0f172a'}
                onChange={(e) => {
                  editor.chain().focus().setColor(e.target.value).run();
                  setShowColorPicker(false);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
              />
            </label>
          </div>
        )}
      </div>

      {/* Highlight Color Popover */}
      <div ref={highlightColorRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
          }}
          title="Highlight Color"
          className={cn(
            'flex items-center gap-0.5 p-1.5 rounded-full transition-colors',
            editor.isActive('highlight')
              ? 'bg-blue-50/80 text-blue-700/90'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
          )}
        >
          <div className="flex flex-col items-center">
            <Highlighter className="h-3.5 w-3.5" />
            <span
              className={cn(
                'h-[2px] w-3.5 rounded-full mt-0.5 shadow-2xs',
                !currentHighlight && 'opacity-0'
              )}
              style={{ backgroundColor: currentHighlight || 'transparent' }}
            />
          </div>
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>

        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1.5 p-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg z-50 flex items-center gap-1.5 animate-in fade-in duration-100">
            <div className="flex items-center gap-1">
              {HIGHLIGHT_COLORS.map((h) => {
                const isSelected =
                  !h.value
                    ? !currentHighlight
                    : currentHighlight.toLowerCase() === h.value.toLowerCase();
                return (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => {
                      if (!h.value) editor.chain().focus().unsetHighlight().run();
                      else editor.chain().focus().toggleHighlight({ color: h.value }).run();
                      setShowHighlightPicker(false);
                    }}
                    title={h.name}
                    className={cn(
                      'h-5 w-5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center text-[10px] text-slate-500 shadow-2xs',
                      isSelected
                        ? 'ring-2 ring-blue-500/80 ring-offset-1 border-transparent'
                        : 'border-slate-300 hover:border-slate-500'
                    )}
                    style={{ backgroundColor: h.value || '#f1f5f9' }}
                  >
                    {!h.value && '✕'}
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

            {/* Custom Highlight Color Input */}
            <label
              title="Custom highlight color"
              className="h-5 w-5 rounded-full border border-dashed border-slate-400 hover:border-blue-500 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs relative shrink-0"
            >
              <Plus className="h-3 w-3 text-slate-600" />
              <input
                type="color"
                value={currentHighlight.startsWith('#') ? currentHighlight : '#fef08a'}
                onChange={(e) => {
                  editor.chain().focus().toggleHighlight({ color: e.target.value }).run();
                  setShowHighlightPicker(false);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
              />
            </label>
          </div>
        )}
      </div>
    </>
  );
};
