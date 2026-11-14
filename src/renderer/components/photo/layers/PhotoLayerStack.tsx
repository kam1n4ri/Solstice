import React from 'react';
import { Layers, Eye, Lock, Image as ImageIcon } from 'lucide-react';

interface PhotoLayerStackProps {
  imageSrc: string;
  fileName: string;
  dimensions: { width: number; height: number };
}

export const PhotoLayerStack: React.FC<PhotoLayerStackProps> = ({
  imageSrc,
  fileName,
  dimensions,
}) => {
  return (
    <div className="h-52 flex flex-col bg-white shrink-0">
      <div className="px-4 py-2 border-b border-stone-200/60 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-stone-500" />
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Layers
          </h3>
        </div>
        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-stone-200/60 text-slate-600">
          1
        </span>
      </div>

      {/* Layer List */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="p-2 rounded-xl bg-stone-100/70 border border-stone-200/80 flex items-center gap-2.5 transition-colors">
          {/* Layer Thumbnail */}
          <div className="w-10 h-10 rounded-lg bg-stone-200 overflow-hidden border border-stone-300/60 shrink-0 flex items-center justify-center">
            {imageSrc ? (
              <img src={imageSrc} alt="Layer" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-4 w-4 text-stone-400" />
            )}
          </div>

          {/* Layer Info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-800 truncate">
              {fileName || 'Background'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {dimensions.width > 0 ? `${dimensions.width}×${dimensions.height}` : 'Base Layer'}
            </div>
          </div>

          {/* Layer Actions */}
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <button
              type="button"
              className="p-1 rounded hover:bg-stone-200/70 text-slate-500 cursor-pointer"
              title="Toggle visibility"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <div className="p-1 text-slate-400" title="Locked base layer">
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Opacity Footer */}
      <div className="px-3 py-1.5 border-t border-stone-100 flex items-center justify-between text-xs text-slate-500 bg-stone-50/40">
        <span className="text-[11px]">Opacity</span>
        <span className="font-mono text-[11px] font-medium text-slate-700">100%</span>
      </div>
    </div>
  );
};
