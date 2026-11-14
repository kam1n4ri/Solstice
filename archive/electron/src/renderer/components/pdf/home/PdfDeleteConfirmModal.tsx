import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { RecentPdfItem } from './PdfRecentStorage';

interface PdfDeleteConfirmModalProps {
  isOpen: boolean;
  item: RecentPdfItem | null;
  onClose: () => void;
  onRemoveFromRecents: (item: RecentPdfItem) => void;
  onDeleteFromDisk: (item: RecentPdfItem) => void;
}

export const PdfDeleteConfirmModal: React.FC<PdfDeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onRemoveFromRecents,
  onDeleteFromDisk,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const hasFilePath = Boolean(item.filePath);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-delete-dialog-title"
      className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150 select-none font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200/80 shadow-xl max-w-sm w-full p-5 space-y-4 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-6">
          <h3 id="pdf-delete-dialog-title" className="text-sm font-semibold text-slate-900">
            Remove “{item.title}.pdf”
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Deleting this removes the Solstice copy you have been editing. The original file you opened and any exported copies will not be affected.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onRemoveFromRecents(item)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            Remove from Recents
          </button>

          {hasFilePath && (
            <button
              type="button"
              onClick={() => onDeleteFromDisk(item)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Delete from Disk
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
