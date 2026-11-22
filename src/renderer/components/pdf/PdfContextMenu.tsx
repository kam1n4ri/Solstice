import React from 'react';
import { Copy, Highlighter, Search, Check } from 'lucide-react';
import { PdfTextSelection } from './PdfViewerTypes';

interface PdfContextMenuProps {
  selection: PdfTextSelection | null;
  position: { x: number; y: number } | null;
  onCopy: (text: string) => void;
  onHighlight: (selection: PdfTextSelection) => void;
  onSearch: (text: string) => void;
  onClose: () => void;
}

export const PdfContextMenu: React.FC<PdfContextMenuProps> = ({
  selection,
  position,
  onCopy,
  onHighlight,
  onSearch,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!selection || !position) return null;

  const handleCopy = () => {
    onCopy(selection.text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  const handleHighlight = () => {
    onHighlight(selection);
    onClose();
  };

  const handleSearch = () => {
    onSearch(selection.text);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${Math.min(window.innerWidth - 220, Math.max(10, position.x))}px`,
        top: `${Math.min(window.innerHeight - 100, Math.max(60, position.y - 48))}px`,
      }}
      className="z-50 bg-white/95 backdrop-blur-md rounded-xl border border-stone-200/90 shadow-xl px-1.5 py-1 flex items-center gap-1 text-xs font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
        title="Copy Selected Text (Ctrl+C)"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copy</span>
          </>
        )}
      </button>

      <div className="h-3 w-px bg-stone-200" />

      <button
        type="button"
        onClick={handleHighlight}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer font-medium"
        title="Highlight Selected Text"
      >
        <Highlighter className="w-3.5 h-3.5 text-rose-500" />
        <span>Highlight</span>
      </button>

      <div className="h-3 w-px bg-stone-200" />

      <button
        type="button"
        onClick={handleSearch}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
        title="Search in Document"
      >
        <Search className="w-3.5 h-3.5 text-slate-500" />
        <span>Find</span>
      </button>
    </div>
  );
};
