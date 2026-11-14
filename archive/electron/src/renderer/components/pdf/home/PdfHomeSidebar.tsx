import React from 'react';
import { Home, Layers, ShieldCheck } from 'lucide-react';

export type PdfHomeTab = 'home' | 'tools';

interface PdfHomeSidebarProps {
  activeTab: PdfHomeTab;
  onTabChange: (tab: PdfHomeTab) => void;
}

export const PdfHomeSidebar: React.FC<PdfHomeSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <aside className="w-56 h-full bg-[#fbfbfc] border-r border-stone-200/50 flex flex-col shrink-0 select-none font-sans z-30">
      {/* 1. Brand Wordmark (no harsh border underneath) */}
      <div className="pt-6 px-5 pb-4 flex items-center shrink-0">
        <div className="flex items-baseline select-none">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Solstice
          </span>
          <span className="font-caveat text-xl font-bold text-rose-500/90 ml-1.5 lowercase tracking-wide">
            pdf
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Items */}
      <div className="flex-1 px-3 py-1 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400/80 px-3 py-1.5">
          Workspace
        </div>

        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-rose-50/90 text-rose-950 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/70 font-medium'
          }`}
        >
          <Home
            className={`w-4 h-4 transition-colors ${
              activeTab === 'home' ? 'text-rose-600' : 'text-slate-400'
            }`}
          />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('tools')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-rose-50/90 text-rose-950 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/70 font-medium'
          }`}
        >
          <Layers
            className={`w-4 h-4 transition-colors ${
              activeTab === 'tools' ? 'text-rose-600' : 'text-slate-400'
            }`}
          />
          <span>Tools</span>
        </button>
      </div>

      {/* 3. Grounded Footer (clean spacing, no harsh border) */}
      <div className="px-5 pb-5 pt-2 flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">Local & Offline Studio</span>
      </div>
    </aside>
  );
};
