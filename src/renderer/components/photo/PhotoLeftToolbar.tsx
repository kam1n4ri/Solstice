import React, { memo } from 'react';
import {
  SlidersHorizontal,
  Crop,
  Scissors,
  Eraser,
  Maximize2,
  Palette,
  Type,
  Paintbrush,
  Wand2,
} from 'lucide-react';
import { PhotoToolType } from '@shared/types';

interface PhotoLeftToolbarProps {
  activeTool: PhotoToolType | null;
  onSelectTool: (tool: PhotoToolType | null) => void;
}

interface ToolItem {
  id: PhotoToolType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolItem[] = [
  { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
  { id: 'crop', label: 'Crop', icon: Crop },
  { id: 'cutout', label: 'Cutout', icon: Scissors },
  { id: 'erase', label: 'Erase', icon: Eraser },
  { id: 'fit', label: 'Fit', icon: Maximize2 },
  { id: 'filters', label: 'Filters', icon: Palette },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'draw', label: 'Draw', icon: Paintbrush },
  { id: 'upscale', label: 'Upscale', icon: Wand2 },
];

export const PhotoLeftToolbar: React.FC<PhotoLeftToolbarProps> = memo(({
  activeTool,
  onSelectTool,
}) => {
  return (
    <aside className="w-16 border-r border-stone-200/80 bg-[#fafbfc]/90 flex flex-col items-center py-2.5 gap-1 shrink-0 select-none z-10">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelectTool(isActive ? null : tool.id)}
            title={tool.label}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isActive
                ? 'bg-stone-200/75 text-stone-900 shadow-xs border border-stone-300/70'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/80'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-medium leading-none tracking-tight">
              {tool.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
});
