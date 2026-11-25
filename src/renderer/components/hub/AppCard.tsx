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
    if (!tool.isAvailable || isLaunching) return;
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
        'group relative flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-outline-variant/30 transition-all duration-300',
        tool.isAvailable
          ? cn('hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)]', tool.cardHoverBorder || 'hover:border-outline-variant/60')
          : 'opacity-85'
      )}
    >
      <div className="flex flex-col">
        {/* Top Header Row with Logo as in App, Running Badge, or Coming Soon Pill */}
        <div className="flex items-center justify-between mb-space-sm min-h-[32px]">
          <div className="flex items-baseline select-none">
            <span className="text-lg font-extrabold tracking-tight text-on-surface transition-colors">
              Solstice
            </span>
            <span
              className={cn(
                'font-caveat text-2xl font-bold ml-1.5 lowercase tracking-wide transition-transform duration-200 group-hover:scale-105 origin-left',
                tool.brandColorClass || 'text-on-surface-variant'
              )}
            >
              {tool.brandSuffix || tool.id}
            </span>
          </div>

          {isOpen ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 px-2 py-0.5 rounded-full shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Running
            </span>
          ) : !tool.isAvailable ? (
            <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container/60 border border-outline-variant/25 px-2 py-0.5 rounded-full shrink-0">
              Coming Soon
            </span>
          ) : null}
        </div>

        {/* Short Description */}
        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mt-space-xs">
          {tool.description}
        </p>
      </div>

      {/* Bottom Action Row: Greyed out and unclickable for unmade apps */}
      <div className="pt-space-md mt-space-lg flex items-center justify-start border-t border-surface-container/50">
        <button
          onClick={handleLaunch}
          disabled={!tool.isAvailable || isLaunching}
          type="button"
          title={!tool.isAvailable ? 'This application is currently in development' : undefined}
          className={cn(
            'inline-flex items-center gap-1.5 px-space-md h-8 rounded-lg text-xs font-medium transition-all duration-200 select-none',
            !tool.isAvailable
              ? 'bg-surface-container/30 text-on-surface-variant/40 border border-outline-variant/20 cursor-not-allowed opacity-60'
              : isOpen
                ? 'bg-secondary-container text-on-secondary-fixed-variant hover:bg-secondary-container/80 shadow-sm cursor-pointer'
                : 'bg-surface-container text-on-surface hover:bg-secondary-container hover:text-on-secondary-fixed-variant cursor-pointer'
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
              <ArrowRight
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  tool.isAvailable ? 'group-hover:translate-x-0.5' : 'opacity-30'
                )}
              />
            </>
          )}
        </button>
      </div>
    </article>
  );
};
