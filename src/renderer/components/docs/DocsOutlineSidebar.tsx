import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { ListTree, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocsOutlineSidebarProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  pos: number;
}

export const DocsOutlineSidebar: React.FC<DocsOutlineSidebarProps> = ({
  editor,
  isOpen,
  onClose,
}) => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activePos, setActivePos] = useState<number | null>(null);

  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const text = node.textContent.trim();
          if (text) {
            items.push({
              id: `heading-${pos}`,
              level: node.attrs.level || 1,
              text,
              pos,
            });
          }
        }
      });
      setHeadings(items);
    };

    extractHeadings();
    editor.on('update', extractHeadings);

    return () => {
      editor.off('update', extractHeadings);
    };
  }, [editor]);

  if (!isOpen) return null;

  const handleHeadingClick = (pos: number) => {
    if (!editor) return;
    setActivePos(pos);
    editor.chain().focus().setTextSelection(pos + 1).run();

    try {
      const domNode = editor.view.nodeDOM(pos) as HTMLElement | null;
      if (domNode && typeof domNode.scrollIntoView === 'function') {
        domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Smooth scroll via container coordinates
      const coords = editor.view.coordsAtPos(pos + 1);
      const scrollContainer = document.querySelector('.DocsEditor-scroll');
      if (coords && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetY = scrollContainer.scrollTop + (coords.top - containerRect.top) - (containerRect.height / 3);
        scrollContainer.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    } catch {
      editor.chain().scrollIntoView().run();
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200/70 bg-[#f8fafd] flex flex-col h-full shrink-0 select-none text-slate-700 print:hidden">
      {/* Sidebar Header */}
      <div className="h-10 px-4 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <ListTree className="h-4 w-4 text-blue-500/80" />
          <span>Document Outline</span>
        </div>
        <button
          onClick={onClose}
          title="Close Outline"
          className="p-1 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Heading List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {headings.length === 0 ? (
          <div className="text-xs text-slate-400 italic p-4 text-center leading-relaxed">
            No headings found.
            <br />
            Add H1, H2, or H3 headings to navigate your document outline.
          </div>
        ) : (
          headings.map((h) => (
            <button
              key={h.id}
              onClick={() => handleHeadingClick(h.pos)}
              className={cn(
                'w-full text-left rounded-lg px-2.5 py-1.5 text-xs truncate transition-colors flex items-center gap-2 group',
                activePos === h.pos
                  ? 'bg-blue-50/80 text-blue-800 font-medium'
                  : 'hover:bg-blue-50/50 hover:text-blue-900',
                h.level === 1 && 'font-semibold text-slate-900',
                h.level === 2 && 'pl-5 text-slate-700',
                h.level === 3 && 'pl-8 text-slate-500 text-[11px]'
              )}
            >
              <span className="shrink-0 text-[10px] text-blue-500/80 font-mono">
                H{h.level}
              </span>
              <span className="truncate">{h.text}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};
