import React from 'react';
import { GripVertical, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { MergeFileItem } from './PdfMergeTypes';

interface PdfMergeCardProps {
  file: MergeFileItem;
  index: number;
  totalCount: number;
  onMove: (index: number, direction: 'left' | 'right') => void;
  onRemove: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging?: boolean;
}

export const PdfMergeCard: React.FC<PdfMergeCardProps> = ({
  file,
  index,
  totalCount,
  onMove,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
}) => {
  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`group relative flex flex-col justify-between w-56 h-64 p-3.5 bg-white rounded-2xl border transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 border-rose-300 scale-95 shadow-none'
          : 'border-stone-200/80 hover:border-rose-200 hover:shadow-md'
      }`}
    >
      {/* Top Bar: Order Badge & Drag Handle & Remove */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-semibold flex items-center justify-center border border-stone-200/60">
            {index + 1}
          </span>
          <span className="text-stone-300 group-hover:text-stone-400 transition-colors">
            <GripVertical className="w-4 h-4" />
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          title="Remove from merge list"
          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle Preview Box */}
      <div className="flex-1 my-2 flex flex-col items-center justify-center bg-stone-50/60 rounded-xl border border-stone-100/80 p-3 group-hover:bg-rose-50/20 transition-colors">
        <div className="w-12 h-14 rounded-lg bg-rose-50/90 border border-rose-100/90 text-rose-500 flex items-center justify-center shadow-2xs mb-2">
          <FileText className="w-6 h-6 text-rose-500" />
        </div>
        <p
          className="w-full text-center text-xs font-medium text-stone-700 truncate px-1"
          title={file.fileName}
        >
          {file.fileName}
        </p>
        <span className="text-[10px] text-stone-400 mt-0.5 font-mono">
          {formatSize(file.fileSize)}
        </span>
      </div>

      {/* Bottom Footer: Left/Right Ordering Controls */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
        <button
          disabled={index === 0}
          onClick={(e) => {
            e.stopPropagation();
            onMove(index, 'left');
          }}
          title="Move earlier"
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] text-stone-400">Position {index + 1}</span>
        <button
          disabled={index === totalCount - 1}
          onClick={(e) => {
            e.stopPropagation();
            onMove(index, 'right');
          }}
          title="Move later"
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
