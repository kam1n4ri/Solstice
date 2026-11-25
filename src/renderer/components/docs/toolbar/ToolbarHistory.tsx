import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Search, Undo2, Redo2, Printer, PaintRoller } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolbarDropdown, ToolbarDropdownOption } from '@/components/ui/ToolbarDropdown';
import { normalizeFontFamily } from '../DocsFontDefinitions';

interface ToolbarHistoryProps {
  editor: Editor | null;
  isEditable?: boolean;
  zoomLevel?: number;
  onChangeZoom?: (zoom: number) => void;
  onPrint?: () => void;
  onSearchMenus?: () => void;
}

interface StoredStyles {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  highlight?: string;
  fontFamily?: string;
  fontSize?: string;
}

const ZOOM_OPTIONS: ToolbarDropdownOption<number>[] = [
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 90, label: '90%' },
  { value: 100, label: '100%' },
  { value: 125, label: '125%' },
  { value: 150, label: '150%' },
  { value: 200, label: '200%' },
];

export const ToolbarHistory: React.FC<ToolbarHistoryProps> = ({
  editor,
  isEditable = true,
  zoomLevel = 100,
  onChangeZoom,
  onPrint,
  onSearchMenus,
}) => {
  const [paintStyles, setPaintStyles] = useState<StoredStyles | null>(null);

  // Apply painted format to next text selection
  useEffect(() => {
    if (!editor || !paintStyles) return;

    const handleSelection = () => {
      if (editor.state.selection.empty) return;

      const chain = editor.chain().focus();
      if (paintStyles.bold) chain.setBold();
      if (paintStyles.italic) chain.setItalic();
      if (paintStyles.underline) chain.setUnderline();
      if (paintStyles.strike) chain.setStrike();
      if (paintStyles.color) chain.setColor(paintStyles.color);
      if (paintStyles.highlight) chain.setHighlight({ color: paintStyles.highlight });
      if (paintStyles.fontFamily) chain.setFontFamily(paintStyles.fontFamily);
      if (paintStyles.fontSize) chain.setFontSize(paintStyles.fontSize);
      chain.run();

      setPaintStyles(null);
    };

    editor.on('selectionUpdate', handleSelection);
    return () => {
      editor.off('selectionUpdate', handleSelection);
    };
  }, [editor, paintStyles]);

  const handleTogglePaint = () => {
    if (!editor) return;
    if (paintStyles) {
      setPaintStyles(null);
      return;
    }

    const attrs = editor.getAttributes('textStyle');
    const highlightAttrs = editor.getAttributes('highlight');
    setPaintStyles({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      color: attrs.color || undefined,
      highlight: highlightAttrs.color || undefined,
      fontFamily: attrs.fontFamily ? normalizeFontFamily(attrs.fontFamily) : undefined,
      fontSize: attrs.fontSize || undefined,
    });
  };

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {/* Find in document */}
      <button
        type="button"
        onClick={onSearchMenus}
        title="Find and replace in document (Ctrl+F)"
        className="flex items-center gap-1 px-2 py-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors text-xs cursor-pointer"
      >
        <Search className="h-3.5 w-3.5 text-slate-500" />
        <span className="hidden xl:inline text-slate-600 text-[11px] font-medium">Find</span>
      </button>

      {/* Undo & Redo */}
      <button
        type="button"
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={!isEditable || !editor?.can().undo()}
        title="Undo (Ctrl+Z)"
        className="p-1.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={!isEditable || !editor?.can().redo()}
        title="Redo (Ctrl+Y)"
        className="p-1.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>

      {/* Print */}
      <button
        type="button"
        onClick={onPrint || (() => window.print())}
        title="Print (Ctrl+P)"
        className="p-1.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
      >
        <Printer className="h-3.5 w-3.5" />
      </button>

      {/* Paint Format */}
      <button
        type="button"
        onClick={handleTogglePaint}
        disabled={!isEditable}
        title={paintStyles ? 'Paint format active (select text to apply)' : 'Paint format'}
        className={cn(
          'p-1.5 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none',
          paintStyles
            ? 'bg-blue-50/90 text-blue-700/90 ring-1 ring-blue-200/60'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
        )}
      >
        <PaintRoller className="h-3.5 w-3.5" />
      </button>

      {/* Zoom Dropdown */}
      <ToolbarDropdown
        value={zoomLevel}
        options={ZOOM_OPTIONS}
        triggerLabel={`${zoomLevel}%`}
        onChange={(val) => onChangeZoom?.(val)}
        title="Zoom"
        triggerClass="max-w-[70px]"
        menuClass="w-24"
      />
    </div>
  );
};
