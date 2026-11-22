import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { ToolDefinition } from '@shared/types';
import { cn } from '@/lib/utils';

interface AppCardProps {
  tool: ToolDefinition;
  isOpen: boolean;
  onLaunch: (toolId: ToolDefinition['id']) => Promise<void>;
}

export const AppCard: React.FC<AppCardProps> = ({ tool, isOpen, onLaunch }) => {
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    try {
      setIsLaunching(true);
      await onLaunch(tool.id);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 transition-all duration-300',
        tool.cardHoverBorder || 'hover:border-outline-variant/60'
      )}
    >
      <div className="flex flex-col">
        {/* Top Header Row with Exact In-App Brand Typography Logo and (if running) Running Badge */}
        <div className="flex items-center justify-between mb-space-sm min-h-[32px]">
          <div className="flex items-baseline select-none">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-slate-950 transition-colors">
              Solstice
            </span>
            <span
              className={cn(
                'font-caveat text-2xl font-bold ml-1.5 lowercase tracking-wide transition-transform duration-200 group-hover:scale-105 origin-left',
                tool.brandColorClass || 'text-slate-600'
              )}
            >
              {tool.brandSuffix || tool.id}
            </span>
          </div>

          {isOpen && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Running
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mt-space-xs">
          {tool.description}
        </p>
      </div>

      {/* Bottom Action Row */}
      <div className="pt-space-md mt-space-lg flex items-center justify-start border-t border-surface-container/50">
        <button
          onClick={handleLaunch}
          disabled={isLaunching}
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 px-space-md h-8 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
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
