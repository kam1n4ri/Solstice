import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Link2, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  MoveVertical, List, ListOrdered, ListTodo, Indent as IndentIcon,
  Outdent as OutdentIcon, RemoveFormatting, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarLayoutProps {
  editor: Editor | null;
  onOpenLinkModal?: () => void;
  onOpenImageModal?: () => void;
}

const ALIGNS = [
  { id: 'left', title: 'Left align', icon: AlignLeft },
  { id: 'center', title: 'Center align', icon: AlignCenter },
  { id: 'right', title: 'Right align', icon: AlignRight },
  { id: 'justify', title: 'Justify', icon: AlignJustify },
] as const;

const LISTS = [
  { id: 'bulletList', title: 'Bulleted list', icon: List, act: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { id: 'orderedList', title: 'Numbered list', icon: ListOrdered, act: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { id: 'taskList', title: 'Checklist', icon: ListTodo, act: (e: Editor) => e.chain().focus().toggleTaskList().run() },
];

export const ToolbarLayout: React.FC<ToolbarLayoutProps> = ({ editor, onOpenLinkModal, onOpenImageModal }) => {
  const [showAlign, setShowAlign] = useState(false);
  const [showSpacing, setShowSpacing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowAlign(false);
        setShowSpacing(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAlign(false);
        setShowSpacing(false);
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

  const currentAlign = ALIGNS.find((a) => editor.isActive({ textAlign: a.id })) || ALIGNS[0];
  const AlignIcon = currentAlign.icon;

  return (
    <div ref={ref} className="flex items-center gap-0.5 shrink-0">
      {/* Link & Image */}
      <button
        type="button"
        onClick={onOpenLinkModal}
        title="Insert link (Ctrl+K)"
        className={cn('p-1.5 rounded-full transition-colors', editor.isActive('link') ? 'bg-blue-50/80 text-blue-700/90' : 'text-slate-700 hover:bg-slate-200/60')}
      ><Link2 className="h-3.5 w-3.5" /></button>
      <button
        type="button"
        onClick={onOpenImageModal}
        title="Insert image"
        className="p-1.5 rounded-full text-slate-700 hover:bg-slate-200/60 transition-colors"
      ><ImageIcon className="h-3.5 w-3.5" /></button>

      <div className="h-4 w-px bg-slate-300/50 mx-0.5" />

      {/* Alignment Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowAlign(!showAlign); setShowSpacing(false); }}
          title="Alignment"
          className={cn(
            'flex items-center gap-0.5 p-1.5 rounded-full transition-colors',
            showAlign ? 'bg-slate-200/80 text-slate-900' : 'text-slate-700 hover:bg-slate-200/60'
          )}
        >
          <AlignIcon className="h-3.5 w-3.5" /><ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>
        {showAlign && (
          <div className="absolute top-full left-0 mt-1.5 p-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg z-50 flex gap-0.5 animate-in fade-in duration-100">
            {ALIGNS.map(({ id, title, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { editor.chain().focus().setTextAlign(id).run(); setShowAlign(false); }}
                title={title}
                className={cn('p-1.5 rounded-md transition-colors', editor.isActive({ textAlign: id }) ? 'bg-blue-50/80 text-blue-700/90' : 'text-slate-700 hover:bg-slate-100/80')}
              ><Icon className="h-3.5 w-3.5" /></button>
            ))}
          </div>
        )}
      </div>

      {/* Line Spacing */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowSpacing(!showSpacing); setShowAlign(false); }}
          title="Line & paragraph spacing"
          className={cn(
            'flex items-center gap-0.5 p-1.5 rounded-full transition-colors',
            showSpacing ? 'bg-slate-200/80 text-slate-900' : 'text-slate-700 hover:bg-slate-200/60'
          )}
        >
          <MoveVertical className="h-3.5 w-3.5" /><ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>
        {showSpacing && (
          <div className="absolute top-full left-0 mt-1.5 p-1 w-32 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg z-50 text-xs flex flex-col gap-0.5 animate-in fade-in duration-100">
            {['1.0', '1.15', '1.5', '2.0'].map((lh) => (
              <button
                key={lh}
                type="button"
                onClick={() => { editor.chain().focus().setLineHeight(lh).run(); setShowSpacing(false); }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100/80 transition-colors font-medium"
              >{lh === '1.0' ? 'Single' : lh === '2.0' ? 'Double' : lh}</button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-300/50 mx-0.5" />

      {/* Lists */}
      {LISTS.map(({ id, title, icon: Icon, act }) => (
        <button
          key={id}
          type="button"
          onClick={() => act(editor)}
          title={title}
          className={cn('p-1.5 rounded-full transition-colors', editor.isActive(id) ? 'bg-blue-50/80 text-blue-700/90' : 'text-slate-700 hover:bg-slate-200/60')}
        ><Icon className="h-3.5 w-3.5" /></button>
      ))}

      <div className="h-4 w-px bg-slate-300/50 mx-0.5 hidden md:block" />

      {/* Indent / Outdent */}
      <button type="button" onClick={() => editor.chain().focus().outdent().run()} title="Decrease indent" className="p-1.5 rounded-full text-slate-700 hover:bg-slate-200/60 transition-colors hidden md:inline-flex"><OutdentIcon className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={() => editor.chain().focus().indent().run()} title="Increase indent" className="p-1.5 rounded-full text-slate-700 hover:bg-slate-200/60 transition-colors hidden md:inline-flex"><IndentIcon className="h-3.5 w-3.5" /></button>

      <div className="h-4 w-px bg-slate-300/50 mx-0.5 hidden lg:block" />

      {/* Clear Formatting */}
      <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting (Ctrl+\)" className="p-1.5 rounded-full text-slate-700 hover:bg-slate-200/60 transition-colors hidden lg:inline-flex"><RemoveFormatting className="h-3.5 w-3.5" /></button>
    </div>
  );
};
