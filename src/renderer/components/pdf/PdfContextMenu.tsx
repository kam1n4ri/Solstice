import React from 'react';
import { Copy } from 'lucide-react';

interface PdfContextMenuProps {
  position: { x: number; y: number; text: string } | null;
  onClose: () => void;
}

export const PdfContextMenu: React.FC<PdfContextMenuProps> = ({ position, onClose }) => {
  if (!position) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(position.text);
    onClose();
  };

  // Keep menu inside screen boundaries
  const menuWidth = 140;
  const menuHeight = 44;
  const left = Math.min(window.innerWidth - menuWidth - 12, Math.max(8, position.x));
  const top = Math.min(window.innerHeight - menuHeight - 12, Math.max(8, position.y));

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-50 min-w-[130px] bg-white/95 backdrop-blur-md rounded-xl border border-stone-200/90 shadow-xl p-1 text-xs font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-stone-100 transition-colors cursor-pointer text-left font-medium"
      >
        <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="flex-1">Copy</span>
        <span className="text-[10px] text-slate-400 font-mono tracking-tight">Ctrl+C</span>
      </button>
    </div>
  );
};
