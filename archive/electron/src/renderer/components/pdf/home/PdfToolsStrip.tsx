import React from 'react';
import {
  Layers,
  Scissors,
  Grid,
  Stamp,
  Hash,
  Image as ImageIcon,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface PdfToolsStripProps {
  onOpenTool: (toolId: string) => void;
  onOpenAllTools: () => void;
}

export const PdfToolsStrip: React.FC<PdfToolsStripProps> = ({
  onOpenTool,
  onOpenAllTools,
}) => {
  const tools = [
    {
      id: 'merge',
      name: 'Merge',
      icon: Layers,
    },
    {
      id: 'split',
      name: 'Split',
      icon: Scissors,
    },
    {
      id: 'organize',
      name: 'Organize',
      icon: Grid,
    },
    {
      id: 'convert',
      name: 'Convert',
      icon: ImageIcon,
    },
    {
      id: 'watermark',
      name: 'Watermark',
      icon: Stamp,
    },
    {
      id: 'page-numbers',
      name: 'Numbers',
      icon: Hash,
    },
    {
      id: 'security',
      name: 'Protect',
      icon: Shield,
    },
  ];

  return (
    <section className="mb-8 select-none">
      {/* Header: TOOLS on left, All tools on right */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Tools
        </h2>
        <button
          onClick={onOpenAllTools}
          className="text-xs font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>All tools</span>
          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid of Tool Cards matching reference image */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onOpenTool(tool.id)}
              className="py-4 px-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100/90 border border-slate-200/80 text-slate-900 flex items-center justify-center transition-transform group-hover:scale-105 group-hover:bg-slate-200/60">
                <Icon className="w-4 h-4 stroke-[2]" />
              </div>

              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors text-center">
                {tool.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
