import React from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocsImageBubbleMenuProps {
  editor: Editor | null;
}

const SIZE_PRESETS = [
  { label: '25%', value: '25%' },
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '100%', value: '100%' },
];

export const DocsImageBubbleMenu: React.FC<DocsImageBubbleMenuProps> = ({ editor }) => {
  if (!editor) return null;

  const currentAttrs = editor.getAttributes('image');
  const currentWidth = currentAttrs.width || '100%';
  const currentAlign = currentAttrs.alignment || 'center';

  const handleSetWidth = (width: string) => {
    editor.chain().focus().updateAttributes('image', { width }).run();
  };

  const handleSetAlign = (alignment: 'left' | 'center' | 'right') => {
    editor.chain().focus().updateAttributes('image', { alignment }).run();
  };

  const handleDelete = () => {
    editor.chain().focus().deleteSelection().run();
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageBubbleMenu"
      shouldShow={(props) => Boolean(props?.editor?.isActive('image'))}
      options={{
        placement: 'top',
        offset: 8,
      }}
    >
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 shadow-xl text-xs text-slate-700 z-50 animate-in fade-in duration-100 select-none">
        {/* Size Presets */}
        <div className="flex items-center gap-0.5">
          {SIZE_PRESETS.map((preset) => {
            const isActive = currentWidth === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSetWidth(preset.value)}
                title={`Resize to ${preset.label}`}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-blue-50/90 text-blue-700/90 font-semibold ring-1 ring-blue-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="h-3.5 w-px bg-slate-200 mx-1" />

        {/* Alignment */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSetAlign('left')}
            title="Align Left"
            className={cn(
              'p-1 rounded-md transition-colors cursor-pointer',
              currentAlign === 'left'
                ? 'bg-blue-50/90 text-blue-700/90 ring-1 ring-blue-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            )}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSetAlign('center')}
            title="Align Center"
            className={cn(
              'p-1 rounded-md transition-colors cursor-pointer',
              currentAlign === 'center'
                ? 'bg-blue-50/90 text-blue-700/90 ring-1 ring-blue-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            )}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSetAlign('right')}
            title="Align Right"
            className={cn(
              'p-1 rounded-md transition-colors cursor-pointer',
              currentAlign === 'right'
                ? 'bg-blue-50/90 text-blue-700/90 ring-1 ring-blue-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            )}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-3.5 w-px bg-slate-200 mx-1" />

        {/* Delete */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleDelete}
          title="Delete image"
          className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </BubbleMenu>
  );
};
