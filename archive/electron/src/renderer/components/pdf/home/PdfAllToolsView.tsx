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

interface PdfAllToolsViewProps {
  searchQuery: string;
  onOpenTool: (toolId: string) => void;
}

export const PdfAllToolsView: React.FC<PdfAllToolsViewProps> = ({
  searchQuery,
  onOpenTool,
}) => {
  const tools = [
    {
      id: 'merge',
      name: 'Merge PDF',
      description: 'Combine multiple PDF documents into a single unified file in custom order',
      icon: Layers,
    },
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Extract specific page ranges or burst all pages into individual files',
      icon: Scissors,
    },
    {
      id: 'organize',
      name: 'Organize Pages',
      description: 'Reorder pages visually, rotate individual pages 90°, or remove pages',
      icon: Grid,
    },
    {
      id: 'convert',
      name: 'Images ⇄ PDF',
      description: 'Convert JPG/PNG photo collections to PDF, or export PDF pages to PNGs',
      icon: ImageIcon,
    },
    {
      id: 'watermark',
      name: 'Watermark PDF',
      description: 'Stamp custom diagonal or horizontal text watermarks with opacity controls',
      icon: Stamp,
    },
    {
      id: 'page-numbers',
      name: 'Page Numbers',
      description: 'Stamp standardized page numbers across headers or footers',
      icon: Hash,
    },
    {
      id: 'security',
      name: 'Protect & Unlock',
      description: 'Encrypt documents with AES-256 passwords, or remove password protection',
      icon: Shield,
    },
  ];

  const query = searchQuery.trim().toLowerCase();
  const filteredTools = query
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      )
    : tools;

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-200">
      {/* Header section with title and count */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              All Tools
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200/60">
              {filteredTools.length} utilities
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Direct on-device tools to manipulate, convert, and secure your PDF documents
          </p>
        </div>
      </div>

      {/* Grid of Tools */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          No tools found matching &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onOpenTool(tool.id)}
                className="group relative p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between text-left cursor-pointer active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100/90 border border-slate-200/80 text-slate-900 flex items-center justify-center transition-transform group-hover:scale-105 group-hover:bg-slate-200/60">
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors mb-1">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
