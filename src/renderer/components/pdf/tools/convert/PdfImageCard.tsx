import React from 'react';
import { GripVertical, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ImageItem } from './PdfConvertTypes';

interface PdfImageCardProps {
  item: ImageItem;
  index: number;
  totalCount: number;
  onMove: (index: number, direction: 'left' | 'right') => void;
  onRemove: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging?: boolean;
}

export const PdfImageCard: React.FC<PdfImageCardProps> = ({
  item,
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

  const imageSrc = item.previewUrl || (item.filePath ? `file://${encodeURI(item.filePath)}` : '');

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`group relative flex flex-col justify-between w-52 h-64 p-3 bg-white rounded-2xl border transition-all duration-150 select-none cursor-grab active:cursor-grabbing shadow-xs ${
        isDragging
          ? 'opacity-30 scale-95 border-rose-300 shadow-none'
          : 'border-stone-200/90 hover:border-rose-200 hover:shadow-md'
      }`}
    >
      {/* Top Header: Order Badge & Drag Handle & Remove */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-bold font-mono flex items-center justify-center border border-stone-200/60">
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
          title="Remove image"
          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle Image Thumbnail */}
      <div className="flex-1 my-2 rounded-xl bg-stone-50/70 border border-stone-100/90 overflow-hidden flex items-center justify-center relative group-hover:bg-rose-50/20 transition-colors">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.fileName}
            className="w-full h-full object-contain p-1 rounded-lg transition-transform duration-150 group-hover:scale-[1.02]"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-stone-300" />
        )}
      </div>

      {/* Image Name & Size */}
      <div className="px-1 text-center">
        <p className="text-xs font-medium text-stone-700 truncate" title={item.fileName}>
          {item.fileName}
        </p>
        <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
          {formatSize(item.fileSize)}
        </span>
      </div>

      {/* Bottom Footer: Left/Right Ordering Controls */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-100 mt-1">
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
