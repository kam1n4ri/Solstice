import React, { useState } from 'react';
import { X, UploadCloud, Image as ImageIcon, Trash2, FolderOpen } from 'lucide-react';
import { RecentFileRecord } from '@shared/types';
import { ActivePhotoDocument } from '../PhotoContainer';

export interface PhotoOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (doc: ActivePhotoDocument) => void;
  recentFiles: RecentFileRecord[];
  onRemoveRecent: (filePath: string, e: React.MouseEvent) => void;
  onOpenNativeDialog: () => void;
}

export const PhotoOpenModal: React.FC<PhotoOpenModalProps> = ({
  isOpen,
  onClose,
  onPhotoSelected,
  recentFiles,
  onRemoveRecent,
  onOpenNativeDialog,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleOpenRecent = async (file: RecentFileRecord) => {
    if (!window.solsticeAPI?.photoOpenFile) return;
    try {
      const res = await window.solsticeAPI.photoOpenFile(file.filePath);
      if (res.success && res.dataUrl && res.filePath) {
        onPhotoSelected({
          filePath: res.filePath,
          fileName: res.fileName || file.fileName,
          dataUrl: res.dataUrl,
        });
        onClose();
      }
    } catch (err) {
      console.error('Failed to open recent photo:', err);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const nativePath = (file as unknown as { path?: string }).path;
    if (nativePath && window.solsticeAPI?.photoOpenFile) {
      const res = await window.solsticeAPI.photoOpenFile(nativePath);
      if (res.success && res.dataUrl && res.filePath) {
        onPhotoSelected({
          filePath: res.filePath,
          fileName: res.fileName || file.name,
          dataUrl: res.dataUrl,
        });
        onClose();
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onPhotoSelected({
          filePath: null,
          fileName: file.name,
          dataUrl: reader.result,
        });
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-2xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl shadow-xl border border-stone-200/80 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/60 flex items-center justify-between bg-stone-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50/80 text-amber-700 border border-amber-200/80">
              <FolderOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Open Image</h3>
              <p className="text-[11px] text-slate-400">Import from disk or resume recent work</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar text-xs">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={() => { onOpenNativeDialog(); onClose(); }}
            className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-400 bg-blue-50/40 scale-[1.01]'
                : 'border-stone-300/80 bg-stone-50/40 hover:border-stone-400 hover:bg-stone-50/80'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 mb-2.5 border border-stone-200/70">
              <UploadCloud className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-800 mb-0.5">
              Drop image here, or <span className="text-blue-700 underline underline-offset-2">browse computer</span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Supports PNG, JPG, WebP, SVG, BMP, and GIF
            </p>
          </div>

          {/* Recent Photos */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Recent Photos ({recentFiles.length})
              </span>
            </div>

            {recentFiles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {recentFiles.map((file) => (
                  <div
                    key={file.filePath}
                    onClick={() => handleOpenRecent(file)}
                    className="group relative bg-stone-50/60 border border-stone-200/70 rounded-xl p-2 hover:bg-white hover:shadow-2xs hover:border-stone-300 transition-all cursor-pointer flex flex-col"
                  >
                    <div className="w-full h-20 rounded-lg bg-stone-100/80 flex items-center justify-center overflow-hidden mb-1.5 border border-stone-200/50">
                      <ImageIcon className="h-6 w-6 text-stone-300 group-hover:scale-105 transition-transform" />
                    </div>

                    <div className="flex items-center justify-between min-w-0">
                      <div className="min-w-0 flex-1 pr-1">
                        <span className="text-[11px] font-medium text-slate-800 truncate block" title={file.fileName}>
                          {file.fileName}
                        </span>
                        {file.fileSize && (
                          <span className="text-[9px] font-mono text-slate-400">
                            {Math.round(file.fileSize / 1024)} KB
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => onRemoveRecent(file.filePath, e)}
                        title="Remove from recents"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                <p className="text-[11px]">No recent photos found</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl text-xs font-medium bg-stone-100/80 hover:bg-stone-200/80 text-slate-600 border border-stone-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
