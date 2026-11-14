import React from 'react';
import { Scissors, X } from 'lucide-react';
import { SplitPartition, PartitionPalette } from './PdfSplitTypes';

interface PdfSplitCutLineProps {
  pageNumber: number;
  isCutBoundary: boolean;
  nextPartition?: SplitPartition;
  palette?: PartitionPalette;
  onSplitHere: (pageNumber: number) => void;
  onMergeSplit: (partitionId: string) => void;
}

export const PdfSplitCutLine: React.FC<PdfSplitCutLineProps> = ({
  pageNumber,
  isCutBoundary,
  nextPartition,
  palette,
  onSplitHere,
  onMergeSplit,
}) => {
  if (isCutBoundary && nextPartition) {
    return (
      <div className="flex flex-col items-center justify-center self-stretch px-1 select-none z-10 group">
        <div
          className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border ${
            palette ? `${palette.cardBorder} ${palette.cardBg}` : 'border-rose-200 bg-rose-50/40'
          } shadow-xs transition-all`}
          title={`Split boundary between Page ${pageNumber} and Page ${pageNumber + 1}`}
        >
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 border border-stone-200/60 shadow-2xs">
            <Scissors className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="text-[10px] font-bold text-stone-700 font-mono">
              {nextPartition.name}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMergeSplit(nextPartition.id);
            }}
            className="p-1 rounded-full bg-white/80 hover:bg-rose-100/80 text-stone-400 hover:text-rose-600 border border-stone-200/50 shadow-2xs transition-colors cursor-pointer"
            title={`Remove split (Merge ${nextPartition.name} with previous)`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSplitHere(pageNumber)}
      className="group relative flex flex-col items-center justify-center self-stretch w-5 hover:w-10 px-0.5 transition-all duration-150 cursor-pointer select-none"
      title={`Click to split document after Page ${pageNumber}`}
    >
      {/* Invisible default / Visible on hover vertical dashed guide */}
      <div className="w-px h-44 border-r border-dashed border-stone-200 group-hover:border-rose-400/80 transition-colors" />

      {/* Floating scissor button on hover */}
      <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:scale-105 flex items-center justify-center">
        <div className="px-2 py-1 rounded-xl bg-white/95 border border-rose-200/80 shadow-md flex items-center gap-1 text-[10px] font-semibold text-rose-700 whitespace-nowrap">
          <Scissors className="w-3 h-3 text-rose-500" />
          <span>Split</span>
        </div>
      </div>
    </div>
  );
};
