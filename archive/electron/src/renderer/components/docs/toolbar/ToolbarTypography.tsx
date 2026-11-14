import React, { useState, useEffect, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocsColorPickers } from '../DocsColorPickers';
import { FONT_OPTIONS, normalizeFontFamily } from '../DocsFontDefinitions';
import { useDynamicFonts } from '../useDynamicFonts';
import { ToolbarDropdown, ToolbarDropdownOption } from '@/components/ui/ToolbarDropdown';
import { ToolbarFontSizeStepper } from './ToolbarFontSizeStepper';

interface ToolbarTypographyProps {
  editor: Editor | null;
}

const STYLE_OPTIONS: ToolbarDropdownOption<string>[] = [
  { value: 'Normal', label: 'Normal text', previewClass: 'text-xs text-slate-700' },
  { value: 'H1', label: 'Heading 1', previewClass: 'text-base font-bold text-slate-900' },
  { value: 'H2', label: 'Heading 2', previewClass: 'text-sm font-semibold text-slate-800' },
  { value: 'H3', label: 'Heading 3', previewClass: 'text-xs font-semibold text-slate-800' },
];

const BIUS_CONFIG = [
  { id: 'bold', title: 'Bold (Ctrl+B)', icon: Bold, act: (e: Editor) => e.chain().focus().toggleBold().run() },
  { id: 'italic', title: 'Italic (Ctrl+I)', icon: Italic, act: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { id: 'underline', title: 'Underline (Ctrl+U)', icon: UnderlineIcon, act: (e: Editor) => e.chain().focus().toggleUnderline().run() },
  { id: 'strike', title: 'Strikethrough', icon: Strikethrough, act: (e: Editor) => e.chain().focus().toggleStrike().run() },
];

export const ToolbarTypography: React.FC<ToolbarTypographyProps> = ({ editor }) => {
  const dynamicFonts = useDynamicFonts();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const fontDropdownOptions = useMemo<ToolbarDropdownOption<string>[]>(() => {
    const combined = [...FONT_OPTIONS];
    dynamicFonts.forEach((df) => {
      if (!combined.some((cf) => cf.id.toLowerCase() === df.id.toLowerCase())) {
        combined.push(df);
      }
    });
    return combined.map((f) => ({
      value: f.id,
      label: f.label,
      previewStyle: { fontFamily: f.stack },
      badge: f.badge,
    }));
  }, [dynamicFonts]);

  if (!editor) return null;

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? 'H1' : editor.isActive('heading', { level: 2 })
    ? 'H2' : editor.isActive('heading', { level: 3 })
    ? 'H3' : 'Normal';

  const rawFont = editor.getAttributes('textStyle').fontFamily;
  const currentFont = normalizeFontFamily(rawFont, dynamicFonts);
  const fontSizeAttr = editor.getAttributes('textStyle').fontSize || '11pt';
  const currentSize = parseInt(fontSizeAttr, 10) || 11;
  const [inputVal, setInputVal] = useState<string>(String(currentSize));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setInputVal(String(currentSize));
    }
  }, [currentSize, isFocused]);

  const commitFontSize = (rawVal: string) => {
    const parsed = parseInt(rawVal.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(6, Math.min(96, parsed));
      setInputVal(String(clamped));
      editor.chain().focus().setFontSize(`${clamped}pt`).run();
    } else {
      setInputVal(String(currentSize));
    }
  };

  const handleStepSize = (delta: number) => {
    const nextSize = Math.max(6, Math.min(96, currentSize + delta));
    setInputVal(String(nextSize));
    editor.chain().focus().setFontSize(`${nextSize}pt`).run();
  };

  const handleHeadingChange = (val: string) => {
    if (val === 'Normal') editor.chain().focus().setParagraph().run();
    else if (val === 'H1') editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (val === 'H2') editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (val === 'H3') editor.chain().focus().toggleHeading({ level: 3 }).run();
  };

  const handleFontChange = (fontId: string) => {
    if (!editor) return;
    if (fontId === 'Sans Serif') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(fontId).run();
    }
  };

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {/* Paragraph Style */}
      <ToolbarDropdown
        value={currentHeading}
        options={STYLE_OPTIONS}
        onChange={handleHeadingChange}
        title="Styles"
        triggerClass="max-w-[110px]"
        menuClass="w-48"
      />

      <div className="h-4 w-px bg-slate-300/50 mx-0.5" />

      {/* Font Family */}
      <ToolbarDropdown
        value={currentFont}
        options={fontDropdownOptions}
        onChange={handleFontChange}
        title="Font"
        triggerClass="max-w-[125px]"
        menuClass="w-56"
        maxMenuHeight="max-h-[300px]"
      />

      <div className="h-4 w-px bg-slate-300/50 mx-0.5" />

      {/* Font Size Stepper */}
      <ToolbarFontSizeStepper
        currentSize={currentSize}
        inputVal={inputVal}
        setInputVal={setInputVal}
        setIsFocused={setIsFocused}
        handleStepSize={handleStepSize}
        commitFontSize={commitFontSize}
      />

      <div className="h-4 w-px bg-slate-300/50 mx-0.5" />

      {/* Bold, Italic, Underline, Strikethrough */}
      {BIUS_CONFIG.map(({ id, title, icon: Icon, act }) => (
        <button
          key={id}
          type="button"
          onClick={() => act(editor)}
          title={title}
          className={cn(
            'p-1.5 rounded-full transition-colors',
            id === 'strike' && 'hidden sm:inline-flex',
            editor.isActive(id)
              ? 'bg-blue-50/90 text-blue-700/90 font-semibold'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}

      <div className="h-4 w-px bg-slate-300/50 mx-0.5" />

      {/* Colors */}
      <DocsColorPickers
        editor={editor}
        showColorPicker={showColorPicker}
        setShowColorPicker={setShowColorPicker}
        showHighlightPicker={showHighlightPicker}
        setShowHighlightPicker={setShowHighlightPicker}
      />
    </div>
  );
};
