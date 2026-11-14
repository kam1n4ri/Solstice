import React from 'react';
import { ArrowUpRight, Trash2, Loader2 } from 'lucide-react';
import {
  ArchitectureIllustration,
  WireframeIllustration,
  RetroIllustration,
  NapkinMathIllustration,
  FreeformIllustration,
} from './WhiteboardDeskIllustrations';

export type WashiTapeColor = 'yellow' | 'mint' | 'pink' | 'peach';

export interface DeskSheetItem {
  id: string;
  title: string;
  relativeTime: string;
  statLabel: string;
  tapeColor: WashiTapeColor;
  tiltClass: string;
  illustrationType: 'architecture' | 'wireframe' | 'retro' | 'math' | 'freeform';
  filePath?: string | null;
  templateId?: string;
}

interface WhiteboardDeskCardProps {
  sheet: DeskSheetItem;
  onOpen: (sheet: DeskSheetItem) => void;
  onRemove?: (id: string, filePath?: string | null, e?: React.MouseEvent) => void;
  isLoading?: boolean;
}

const TAPE_CLASSES: Record<WashiTapeColor, string> = {
  yellow: 'bg-[#fef08a]/90 border-t border-b border-[#fde047]/70 rotate-[-1deg]',
  mint: 'bg-[#a7f3d0]/85 border-t border-b border-[#6ee7b7]/70 rotate-[1.2deg]',
  pink: 'bg-[#fecdd3]/90 border-t border-b border-[#fda4af]/70 rotate-[-0.6deg]',
  peach: 'bg-[#fed7aa]/90 border-t border-b border-[#fdba74]/70 rotate-[0.8deg]',
};

export const WhiteboardDeskCard: React.FC<WhiteboardDeskCardProps> = ({
  sheet,
  onOpen,
  onRemove,
  isLoading = false,
}) => {
  const renderIllustration = () => {
    switch (sheet.illustrationType) {
      case 'architecture':
        return <ArchitectureIllustration />;
      case 'wireframe':
        return <WireframeIllustration />;
      case 'retro':
        return <RetroIllustration />;
      case 'math':
        return <NapkinMathIllustration />;
      default:
        return <FreeformIllustration />;
    }
  };

  return (
    <div
      onClick={() => !isLoading && onOpen(sheet)}
      className={`group relative flex flex-col bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-[0_4px_18px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-200 cursor-pointer select-none ${sheet.tiltClass}`}
    >
      {/* Washi Tape Strip */}
      <div
        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 rounded-[1.5px] backdrop-blur-[0.5px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] pointer-events-none z-10 ${TAPE_CLASSES[sheet.tapeColor]}`}
      />

      {/* Inner Miniature Canvas with Dot Grid */}
      <div className="w-full aspect-[16/10] bg-[#faf8f5] rounded-xl border border-slate-200/60 p-2 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(#e2ddd3_1px,transparent_1px)] [background-size:10px_10px] group-hover:bg-[#fbf9f6] transition-colors">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-amber-600 stroke-[2.2]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center group-hover:scale-[1.03] transition-transform duration-200">
            {renderIllustration()}
          </div>
        )}

        {/* Hover Delete Action (for user-saved boards) */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => onRemove(sheet.id, sheet.filePath, e)}
            title="Delete whiteboard"
            className="absolute top-2 right-2 p-1 rounded-lg bg-white/95 border border-slate-200/70 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-2xs z-20"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Title & External Link */}
      <div className="pt-3 pb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-800 transition-colors">
          {sheet.title}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
      </div>

      {/* Footer Metadata */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
        <span className="font-caveat text-sm text-slate-500 font-bold">
          {sheet.relativeTime}
        </span>
        <span className="text-[9.5px] font-mono tracking-wider font-semibold text-slate-400">
          {sheet.statLabel}
        </span>
      </div>
    </div>
  );
};
