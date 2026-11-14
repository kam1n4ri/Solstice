import React from 'react';
import { Home, Plus, FolderOpen, ShieldCheck } from 'lucide-react';

interface PhotoHomeSidebarProps {
  onCreateNew: () => void;
  onOpenFile: () => void;
}

export const PhotoHomeSidebar: React.FC<PhotoHomeSidebarProps> = ({
  onCreateNew,
  onOpenFile,
}) => {
  return (
    <aside className="w-60 h-full bg-[#fbfbfc] border-r border-stone-200/60 flex flex-col shrink-0 select-none font-sans z-30">
      {/* 1. Solstice Photo Brand Wordmark */}
      <div className="pt-6 px-5 pb-5 flex items-center shrink-0">
        <div className="flex items-baseline select-none">
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Solstice
          </span>
          <span className="font-caveat text-2xl font-bold text-stone-600/90 ml-1.5 lowercase tracking-wide">
            photo
          </span>
        </div>
      </div>

      {/* 2. Primary Action Buttons (Desktop Style) */}
      <div className="px-4 pb-5 flex flex-col gap-2 shrink-0">
        <button
          type="button"
          onClick={onCreateNew}
          className="w-full h-8 flex items-center justify-center gap-2 px-3 rounded-lg text-xs font-medium bg-stone-900 text-white hover:bg-black shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New...</span>
        </button>

        <button
          type="button"
          onClick={onOpenFile}
          className="w-full h-8 flex items-center justify-center gap-2 px-3 rounded-lg text-xs font-medium bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 shadow-2xs transition-colors cursor-pointer"
        >
          <FolderOpen className="h-4 w-4 text-stone-500" />
          <span>Open...</span>
        </button>
      </div>

      {/* 3. Navigation Rail */}
      <div className="flex-1 px-3 py-1 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400/80 px-3 py-1">
          Workspace
        </div>

        <button
          type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs bg-stone-200/70 text-stone-900 font-medium shadow-2xs cursor-pointer transition-all"
        >
          <Home className="w-4 h-4 text-stone-700" />
          <span>Home</span>
        </button>
      </div>

      {/* 4. Grounded Local Security Footer */}
      <div className="px-5 pb-5 pt-3 flex items-center gap-2 text-[10px] text-slate-400 border-t border-stone-200/40 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">Local & Offline Studio</span>
      </div>
    </aside>
  );
};
