import React, { useState, useEffect, useRef } from 'react';

interface PartitionNumberInputProps {
  value: number;
  min?: number;
  max: number;
  onChange: (val: number) => void;
  className?: string;
  ariaLabel?: string;
}

export const PartitionNumberInput: React.FC<PartitionNumberInputProps> = ({
  value,
  min = 1,
  max,
  onChange,
  className = '',
  ariaLabel,
}) => {
  const [text, setText] = useState<string>(String(value));
  const isFocusedRef = useRef<boolean>(false);

  // Sync external value changes into local input text when not actively typing/focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      setText(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty string so user can freely hit Backspace and delete all digits
    if (raw === '') {
      setText('');
      return;
    }

    // Only allow numeric digits
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly === '') {
      setText('');
      return;
    }

    const num = parseInt(digitsOnly, 10);
    if (isNaN(num)) return;

    // If user enters a number greater than max pages, clamp automatically to max
    if (num > max) {
      setText(String(max));
      onChange(max);
      return;
    }

    setText(digitsOnly);
    if (num >= min) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (text === '' || isNaN(parseInt(text, 10))) {
      const fallback = min;
      setText(String(fallback));
      onChange(fallback);
      return;
    }

    const num = parseInt(text, 10);
    const clamped = Math.max(min, Math.min(max, num));
    setText(String(clamped));
    onChange(clamped);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    // Auto-select text on click/focus so typing immediately replaces existing number
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className={`w-14 px-2 py-1 rounded-lg border border-stone-200/90 bg-white text-xs font-mono text-center text-stone-800 transition-colors focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100/60 ${className}`}
    />
  );
};
