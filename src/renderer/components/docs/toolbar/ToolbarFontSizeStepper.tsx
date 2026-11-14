import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface ToolbarFontSizeStepperProps {
  currentSize: number;
  inputVal: string;
  setInputVal: (val: string) => void;
  setIsFocused: (focused: boolean) => void;
  handleStepSize: (delta: number) => void;
  commitFontSize: (rawVal: string) => void;
}

export const ToolbarFontSizeStepper: React.FC<ToolbarFontSizeStepperProps> = ({
  currentSize,
  inputVal,
  setInputVal,
  setIsFocused,
  handleStepSize,
  commitFontSize,
}) => {
  return (
    <div className="flex items-center gap-0.5 px-0.5">
      <button
        type="button"
        onClick={() => handleStepSize(-1)}
        title="Decrease font size"
        className="p-1 rounded-full text-slate-700 hover:bg-slate-200/60 transition-colors"
      >
        <Minus className="h-3 w-3" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputVal}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.select();
        }}
        onBlur={(e) => {
          setIsFocused(false);
          commitFontSize(e.target.value);
        }}
        onChange={(e) => {
          const filtered = e.target.value.replace(/[^0-9]/g, '');
          setInputVal(filtered);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitFontSize(inputVal);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setInputVal(String(currentSize));
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleStepSize(1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleStepSize(-1);
          }
        }}
        className="w-8 text-center text-xs font-medium text-slate-700 bg-transparent hover:bg-slate-200/50 focus:bg-white rounded py-0.5 focus:outline-none border border-transparent hover:border-slate-300/50 focus:border-blue-300 transition-colors"
        title="Font size (type number & press Enter)"
      />

      <button
        type="button"
        onClick={() => handleStepSize(1)}
        title="Increase font size"
        className="p-1 rounded-full text-slate-700 hover:bg-slate-200/60 transition-colors"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
};
