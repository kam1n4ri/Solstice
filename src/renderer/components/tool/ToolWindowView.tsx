import React from 'react';
import {
  FileText,
  Table,
  Presentation,
  PenTool,
  Video,
  BarChart2,
  Image as ImageIcon,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { ToolId, ToolDefinition } from '@shared/types';
import { TOOLS_CATALOG } from '@/data/tools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ToolWindowViewProps {
  toolId: ToolId;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Table,
  Presentation,
  PenTool,
  Video,
  BarChart2,
  Image: ImageIcon,
  BookOpen,
};

export const ToolWindowView: React.FC<ToolWindowViewProps> = ({ toolId }) => {
  const tool: ToolDefinition = TOOLS_CATALOG.find((t) => t.id === toolId) || {
    id: toolId,
    name: `Solstice ${toolId.charAt(0).toUpperCase() + toolId.slice(1)}`,
    tagline: 'Creative & Productivity Studio',
    description: 'Independent desktop application for creative and productivity workflows.',
    category: 'productivity',
    categoryLabel: 'Productivity & Office',
    version: '1',
    iconName: 'FileText',
    iconBgClass: 'bg-secondary-container/40',
    iconColorClass: 'text-primary',
    accentColor: '#5b7fa4',
  };

  const IconComponent = ICON_MAP[tool.iconName] || FileText;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface text-on-surface select-none">
      {/* Top Application Window Bar */}
      <header className="h-12 border-b border-surface-container/60 bg-surface-container-lowest/90 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center ${tool.iconBgClass} ${tool.iconColorClass}`}
          >
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-on-surface">
              {tool.name}
            </span>
            <Badge variant="outline" className="text-[10px] font-medium bg-surface-container/40 text-on-surface-variant border-outline-variant/30">
              {tool.categoryLabel}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 bg-blue-50/70 border-blue-200/60 text-blue-700/90 font-medium">
            <Sparkles className="h-3 w-3 text-blue-600/80" />
            In Active Development
          </Badge>
        </div>
      </header>

      {/* Main Tool Canvas / Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-container-low/40">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 text-center space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] animate-in zoom-in-95 duration-150">
          <div
            className={`h-14 w-14 rounded-2xl mx-auto flex items-center justify-center ${tool.iconBgClass} ${tool.iconColorClass} border border-outline-variant/20 shadow-xs`}
          >
            <IconComponent className="h-7 w-7" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-on-surface tracking-tight">{tool.name}</h2>
            <p className="text-xs text-on-surface-variant mt-1">{tool.tagline}</p>
          </div>

          <p className="text-xs text-on-surface-variant/80 leading-relaxed px-2">
            {tool.description}
          </p>

          <div className="p-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant/70">
            This module is scheduled in the Solstice roadmap. Dedicated tools like Docs, Whiteboard, and PDF Studio are fully operational.
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs font-medium cursor-pointer"
            onClick={() => {
              if (window.solsticeAPI?.closeWindow) {
                window.solsticeAPI.closeWindow();
              } else {
                window.close();
              }
            }}
          >
            Close Window
          </Button>
        </div>
      </main>
    </div>
  );
};
