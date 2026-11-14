import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Bookmark } from 'lucide-react';
import { PDFDocumentProxy } from '../pdfjsSetup';

export interface OutlineNode {
  title: string;
  dest: string | any[] | null;
  items?: OutlineNode[];
}

interface PdfOutlineItemProps {
  item: OutlineNode;
  doc: PDFDocumentProxy;
  depth?: number;
  onJumpToPage: (pageNumber: number) => void;
}

export const PdfOutlineItem: React.FC<PdfOutlineItemProps> = ({
  item,
  doc,
  depth = 0,
  onJumpToPage,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.items && item.items.length > 0;

  const handleClick = async () => {
    try {
      let destination = item.dest;
      if (typeof destination === 'string') {
        destination = await doc.getDestination(destination);
      }
      if (Array.isArray(destination) && destination[0]) {
        const pageIndex = await doc.getPageIndex(destination[0]);
        onJumpToPage(pageIndex + 1);
      }
    } catch (err) {
      console.warn('Failed to resolve outline bookmark destination:', err);
    }
  };

  return (
    <div className="flex flex-col text-xs select-none">
      <div
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className="flex items-center gap-1.5 py-1.5 pr-2 rounded-lg hover:bg-stone-100/90 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer group"
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-0.5 rounded hover:bg-stone-200/60 text-slate-400 group-hover:text-slate-600 transition-colors"
          >
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <Bookmark className="w-3 h-3 text-slate-400 flex-shrink-0 ml-0.5" />
        )}

        <span className="truncate font-medium text-[11px]" title={item.title}>
          {item.title}
        </span>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col">
          {item.items!.map((child, idx) => (
            <PdfOutlineItem
              key={`${child.title}-${idx}`}
              item={child}
              doc={doc}
              depth={depth + 1}
              onJumpToPage={onJumpToPage}
            />
          ))}
        </div>
      )}
    </div>
  );
};
