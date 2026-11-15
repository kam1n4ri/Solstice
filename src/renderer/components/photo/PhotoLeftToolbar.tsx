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

interface ToolGroupItem {
  id: PhotoToolType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOL_GROUPS: ToolGroupItem[][] = [
  // Group 1: Navigation & Transformation
  [
    { id: 'crop', label: 'Crop & Rotate', icon: Crop },
    { id: 'fit', label: 'Canvas Fit', icon: Maximize2 },
  ],
  // Group 2: Color, Tone & Aesthetics
  [
    { id: 'adjust', label: 'Tone Adjust', icon: SlidersHorizontal },
    { id: 'filters', label: 'Filters', icon: Palette },
  ],
  // Group 3: AI Matting & Healing
  [
    { id: 'cutout', label: 'AI Cutout', icon: Scissors },
    { id: 'erase', label: 'Object Healing', icon: Eraser },
    { id: 'upscale', label: 'AI Upscale', icon: Wand2 },
  ],
  // Group 4: Annotations & Content
  [
    { id: 'draw', label: 'Brush & Pen', icon: Paintbrush },
    { id: 'text', label: 'Text Layer', icon: Type },
  ],
];

export const PhotoLeftToolbar: React.FC<PhotoLeftToolbarProps> = memo(({
  activeTool,
  onSelectTool,
}) => {
  return (
    <aside className="w-14 border-r border-stone-200/70 bg-[#fafbfc]/90 backdrop-blur-xs flex flex-col items-center py-3 gap-2 shrink-0 select-none z-10 shadow-[1px_0_4px_rgba(0,0,0,0.01)]">
      {TOOL_GROUPS.map((group, groupIdx) => (
        <React.Fragment key={groupIdx}>
          {groupIdx > 0 && <div className="w-6 h-[1px] bg-stone-200/60 my-0.5" />}
          {group.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(isActive ? null : tool.id)}
                title={tool.label}
                aria-label={tool.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/80 text-blue-600/90 border border-blue-200/70 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/70 border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </aside>
  );
});
