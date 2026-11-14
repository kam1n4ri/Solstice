import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-blue-50/70 text-blue-700/90 border-blue-200/60',
    success: 'bg-emerald-50/70 text-emerald-700/90 border-emerald-200/60',
    warning: 'bg-amber-50/70 text-amber-700/90 border-amber-200/60',
    info: 'bg-sky-50/70 text-sky-700/90 border-sky-200/60',
    outline: 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
