import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { RecentFileRecord } from '@shared/types';
import { ActivePhotoDocument } from './PhotoContainer';
import { PhotoHomeSidebar } from './home/PhotoHomeSidebar';
import { PhotoRecentGrid } from './home/PhotoRecentGrid';
import { PhotoNewCanvasModal } from './home/PhotoNewCanvasModal';

interface PhotoHomeViewProps {
  onPhotoSelected: (doc: ActivePhotoDocument) => void;
}

export const PhotoHomeView: React.FC<PhotoHomeViewProps> = ({ onPhotoSelected }) => {
  const [recentFiles, setRecentFiles] = useState<RecentFileRecord[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const loadRecents = useCallback(async () => {
    try {
      if (window.solsticeAPI?.getRecentFiles) {
        const files = await window.solsticeAPI.getRecentFiles();
        setRecentFiles(files.filter((f) => f.tool === 'photo'));
      }
    } catch (err) {
      console.error('Failed to load recent photos:', err);
    }
  }, []);

  useEffect(() => {
    loadRecents();
    window.addEventListener('focus', loadRecents);
    return () => window.removeEventListener('focus', loadRecents);
  }, [loadRecents]);

  const handleOpenNativeDialog = async () => {
    if (!window.solsticeAPI?.photoOpenFile) return;
    try {
      const res = await window.solsticeAPI.photoOpenFile();
      if (res.success && res.dataUrl && res.filePath) {
        onPhotoSelected({
          filePath: res.filePath,
          fileName: res.fileName || 'Untitled.png',
          dataUrl: res.dataUrl,
        });
      }
    } catch (err) {
      console.error('Failed to open photo via dialog:', err);
    }
  };

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
      }
    } catch (err) {
      console.error('Failed to open recent photo:', err);
    }
  };

  const handleRemoveRecent = async (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.solsticeAPI?.photoDeleteWorkingCopy) {
      await window.solsticeAPI.photoDeleteWorkingCopy(filePath);
    } else if (window.solsticeAPI?.deleteFile) {
      await window.solsticeAPI.deleteFile(filePath);
    } else if (window.solsticeAPI?.removeRecentFile) {
      await window.solsticeAPI.removeRecentFile(filePath, true);
    }
    loadRecents();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 w-full h-screen bg-[#fafbfc] text-slate-800 select-none overflow-hidden font-sans flex relative"
    >
      {/* 1. Left Sidebar Navigation */}
      <PhotoHomeSidebar
        onCreateNew={() => setIsNewModalOpen(true)}
        onOpenFile={handleOpenNativeDialog}
      />

      {/* 2. Main Content View */}
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 sm:p-10 flex flex-col">
        <PhotoRecentGrid
          recentFiles={recentFiles}
          onOpenRecent={handleOpenRecent}
          onRemoveRecent={handleRemoveRecent}
          onCreateNew={() => setIsNewModalOpen(true)}
          onOpenFile={handleOpenNativeDialog}
        />
      </main>

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-2xs border-2 border-dashed border-stone-400 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 px-8 py-6 rounded-2xl shadow-xl flex items-center gap-3 text-stone-800 animate-in zoom-in-95">
            <UploadCloud className="h-7 w-7 text-stone-600 animate-bounce" />
            <div>
              <p className="text-sm font-semibold">Drop image to open</p>
              <p className="text-xs text-slate-500">Working copy will be preserved</p>
            </div>
          </div>
        </div>
      )}

      {/* New Canvas Configuration Modal */}
      <PhotoNewCanvasModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreateCanvas={onPhotoSelected}
      />
    </div>
  );
};
