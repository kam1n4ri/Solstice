import React, { useState, useEffect, memo } from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { RecentFileRecord } from '@shared/types';

interface PhotoRecentCardProps {
  file: RecentFileRecord;
  onOpen: (file: RecentFileRecord) => void;
  onRemove: (filePath: string, e: React.MouseEvent) => void;
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'RECENTLY';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'JUST NOW';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'MINUTE' : 'MINUTES'} AGO`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ${diffHr === 1 ? 'HOUR' : 'HOURS'} AGO`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'YESTERDAY';
  if (diffDay < 30) return `${diffDay} DAYS AGO`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PhotoRecentCard: React.FC<PhotoRecentCardProps> = memo(({
  file,
  onOpen,
  onRemove,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;
    if (window.solsticeAPI?.photoGetThumbnail) {
      window.solsticeAPI.photoGetThumbnail(file.filePath).then((dataUrl) => {
        if (active && dataUrl) {
          setThumbnail(dataUrl);
        }
      }).catch(() => {
        if (active) setIsError(true);
      });
    }
    return () => {
      active = false;
    };
  }, [file.filePath]);

  return (
    <div
      onClick={() => onOpen(file)}
      className="group relative bg-white border border-stone-200/80 rounded-xl p-2.5 hover:border-stone-400 hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between"
    >
      {/* Thumbnail Preview Area */}
      <div className="w-full aspect-[4/3] rounded-lg bg-stone-100 border border-stone-200/60 overflow-hidden mb-2 relative flex items-center justify-center">
        {thumbnail && !isError ? (
          <img
            src={thumbnail}
            alt={file.fileName}
            onError={() => setIsError(true)}
            className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-stone-300 group-hover:text-stone-500 transition-colors">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}

        {/* Hover Delete Action */}
        <button
          type="button"
          onClick={(e) => onRemove(file.filePath, e)}
          title="Remove from recents"
          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-stone-200 shadow-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Title & Metadata */}
      <div className="flex flex-col px-0.5">
        <span
          className="text-xs font-medium text-slate-800 truncate group-hover:text-stone-900 transition-colors"
          title={file.fileName}
        >
          {file.fileName}
        </span>
        <div className="flex items-center justify-between mt-0.5 text-[10px] text-slate-400 font-medium">
          <span className="tracking-wide uppercase font-mono">
            {formatRelativeTime(file.lastModified)}
          </span>
          {file.fileSize ? (
            <span className="font-mono text-slate-400/80">
              {formatFileSize(file.fileSize)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
});
