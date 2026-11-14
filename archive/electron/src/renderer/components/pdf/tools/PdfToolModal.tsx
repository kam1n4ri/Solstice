import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PdfToolModalProps {
  title: string;
  description: string;
  badge?: string;
  icon?: React.ElementType;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const PdfToolModal: React.FC<PdfToolModalProps> = ({
  title,
  description,
  badge,
  icon: Icon,
  onClose,
  children,
  maxWidthClass = 'max-w-2xl',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/40 animate-in fade-in duration-150 font-sans">
      <div
        className={`w-full ${maxWidthClass} max-h-[90vh] bg-[#fafbfc] rounded-2xl border border-stone-200/90 shadow-[0_20px_60px_-15px_rgba(44,38,30,0.18)] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 bg-white/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-slate-100/90 border border-slate-200/80 text-slate-900 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                {badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200/70 text-slate-500">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-stone-200/70 bg-white/90 hover:bg-stone-100 text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
