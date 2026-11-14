import React, { useEffect } from 'react';
import { Trash2, X, FolderX } from 'lucide-react';
import { RecentDocItem } from './DocsRecentStorage';

interface DocsDeleteConfirmModalProps {
  isOpen: boolean;
  doc: RecentDocItem | null;
  onClose: () => void;
  onRemoveFromRecents: (doc: RecentDocItem) => void;
  onDeleteFromDisk: (doc: RecentDocItem) => void;
}

export const DocsDeleteConfirmModal: React.FC<DocsDeleteConfirmModalProps> = ({
  isOpen,
  doc,
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

  if (!isOpen || !doc) return null;

  const hasFilePath = Boolean(doc.filePath);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200/80 shadow-xl max-w-sm w-full p-5 space-y-4 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50/80 text-blue-600/90 border border-blue-100 flex items-center justify-center shrink-0">
            <Trash2 className="h-4 w-4" />
          </div>
          <div className="flex-1 pr-4">
            <h3 id="delete-dialog-title" className="text-sm font-semibold text-slate-900">
              Remove Document
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Remove <strong className="text-slate-800 font-medium">&ldquo;{doc.title}&rdquo;</strong> from your recents list{hasFilePath ? ', or delete the file from disk?' : '?'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onRemoveFromRecents(doc)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200/70 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <FolderX className="h-3.5 w-3.5 text-slate-500" />
            <span>Remove from Recents</span>
          </button>

          {hasFilePath && (
            <button
              type="button"
              onClick={() => onDeleteFromDisk(doc)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200/60 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete from Disk</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
