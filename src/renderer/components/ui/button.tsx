import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50 disabled:pointer-events-none rounded-md';

    const variants = {
      primary: 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700/90 border border-blue-200/80 active:scale-[0.98]',
      secondary: 'bg-surface-container/60 hover:bg-surface-container text-on-surface border border-outline-variant/30',
      outline: 'border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface',
      ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40',
      danger: 'bg-rose-50/80 text-rose-700/90 hover:bg-rose-100/80 border border-rose-200/70',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-10 px-5 text-base gap-2.5',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
