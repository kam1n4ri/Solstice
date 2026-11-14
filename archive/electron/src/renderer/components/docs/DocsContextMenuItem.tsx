import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocsContextMenuItemProps {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  isDestructive?: boolean;
  onClick: () => void;
}

export const DocsContextMenuItem: React.FC<DocsContextMenuItemProps> = ({
  label,
  icon,
  shortcut,
  checked,
  disabled,
  isDestructive,
  onClick,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onClick();
        }
      }}
      className={cn(
        'w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors rounded-lg cursor-pointer group',
        disabled
          ? 'opacity-35 cursor-not-allowed text-slate-400 select-none'
          : isDestructive
          ? 'text-rose-600/90 hover:bg-rose-50/80 hover:text-rose-700'
          : 'text-slate-700 hover:bg-blue-50/70 hover:text-blue-700/90'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={cn(
            'w-4 h-4 flex items-center justify-center shrink-0 transition-colors',
            checked ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
          )}
        >
          {checked ? <Check className="h-3.5 w-3.5 text-blue-600 stroke-[2.5]" /> : icon}
        </span>
        <span className="truncate">{label}</span>
      </div>

      {shortcut && (
        <span className="text-[10px] text-slate-400 font-mono tracking-tight shrink-0 pl-3">
          {shortcut}
        </span>
      )}
    </button>
  );
};

export const DocsContextMenuDivider: React.FC = () => (
  <div className="my-1 border-t border-slate-100" />
);

export const DocsContextMenuSection: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-3 pt-1.5 pb-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
    {title}
  </div>
);
