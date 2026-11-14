import React, { useState } from 'react';
import {
  FileText,
  Table,
  Presentation,
  PenTool,
  Video,
  BarChart2,
  Image as ImageIcon,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { ToolDefinition } from '@shared/types';
import { cn } from '@/lib/utils';

interface AppCardProps {
  tool: ToolDefinition;
  isOpen: boolean;
  onLaunch: (toolId: ToolDefinition['id']) => Promise<void>;
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

export const AppCard: React.FC<AppCardProps> = ({ tool, isOpen, onLaunch }) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const IconComponent = ICON_MAP[tool.iconName] || FileText;

  const handleLaunch = async () => {
    try {
      setIsLaunching(true);
      await onLaunch(tool.id);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <article className="group relative flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 hover:border-outline-variant/60 transition-all duration-300">
      <div className="flex flex-col">
        {/* Top Header Row with Icon and (if running) Running Badge */}
        <div className="flex items-start justify-between mb-space-md">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105',
              tool.iconBgClass,
              tool.iconColorClass
            )}
          >
            <IconComponent className="h-6 w-6" />
          </div>

          {isOpen && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Running
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h2 className="text-base font-medium text-on-surface tracking-tight group-hover:text-primary transition-colors">
          {tool.name}
        </h2>
        <p className="text-xs text-on-surface-variant mt-space-xs line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Bottom Action Row (no isolated process text) */}
      <div className="pt-space-lg mt-space-md flex items-center justify-start border-t border-surface-container/50">
        <button
          onClick={handleLaunch}
          disabled={isLaunching}
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 px-space-md h-8 rounded-lg text-xs font-medium transition-all duration-200',
            isOpen
              ? 'bg-secondary-container text-on-secondary-fixed-variant hover:bg-secondary-container/80 shadow-sm'
              : 'bg-surface-container text-on-surface hover:bg-secondary-container hover:text-on-secondary-fixed-variant'
          )}
        >
          {isLaunching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isOpen ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Focus</span>
            </>
          ) : (
            <>
              <span>Launch</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </article>
  );
};
