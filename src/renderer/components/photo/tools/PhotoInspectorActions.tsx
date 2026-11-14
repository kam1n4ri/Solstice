import React from 'react';

interface PhotoInspectorActionsProps {
  onCancel: () => void;
  onApply: () => void;
  applyLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  disabled?: boolean;
}

export const PhotoInspectorActions: React.FC<PhotoInspectorActionsProps> = ({
  onCancel,
  onApply,
  applyLabel = 'Apply',
  cancelLabel = 'Cancel',
  isProcessing = false,
  disabled = false,
}) => {
  return (
    <div className="pt-3 border-t border-stone-200/80 flex items-center gap-2 mt-auto select-none shrink-0">
      <button
        type="button"
        onClick={onCancel}
        disabled={isProcessing}
        className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 shadow-2xs transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={isProcessing || disabled}
        className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-stone-900 hover:bg-black text-white border border-stone-900 shadow-xs transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : applyLabel}
      </button>
    </div>
  );
};
