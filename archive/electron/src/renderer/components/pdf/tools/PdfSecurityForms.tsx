import React from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface PdfProtectFormProps {
  hasFile: boolean;
  isProcessing: boolean;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onProtect: () => void;
}

export const PdfProtectForm: React.FC<PdfProtectFormProps> = ({
  hasFile,
  isProcessing,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  onProtect,
}) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs font-medium text-slate-700 block mb-1">Set Password</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter document password..."
          className="w-full px-3 py-2 pr-9 rounded-xl border border-stone-200/90 bg-white text-xs text-slate-800 focus:outline-none focus:border-rose-300 font-mono"
        />
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>

    <div>
      <label className="text-xs font-medium text-slate-700 block mb-1">Confirm Password</label>
      <input
        type={showPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Repeat password..."
        className="w-full px-3 py-2 rounded-xl border border-stone-200/90 bg-white text-xs text-slate-800 focus:outline-none focus:border-rose-300 font-mono"
      />
    </div>

    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-[11px] text-slate-600">
      Uses standard AES-256 encryption. Anyone opening this document will be prompted for this password.
    </div>

    <div className="pt-2 border-t border-stone-200/70 flex justify-end">
      <button
        disabled={!hasFile || isProcessing}
        onClick={onProtect}
        className="px-5 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs shadow-2xs disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
      >
        {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <span>{isProcessing ? 'Encrypting...' : 'Protect Document'}</span>
      </button>
    </div>
  </div>
);

interface PdfUnlockFormProps {
  hasFile: boolean;
  isProcessing: boolean;
  onUnlock: () => void;
}

export const PdfUnlockForm: React.FC<PdfUnlockFormProps> = ({
  hasFile,
  isProcessing,
  onUnlock,
}) => (
  <div className="space-y-3">
    <div className="p-4 rounded-xl bg-white border border-stone-200/80">
      <p className="text-xs font-semibold text-slate-800">Remove Password Protection</p>
      <p className="text-[11px] text-slate-500 mt-1">
        Permanently strip security restrictions from this document. The saved copy will open without requiring passwords.
      </p>
    </div>

    <div className="pt-2 border-t border-stone-200/70 flex justify-end">
      <button
        disabled={!hasFile || isProcessing}
        onClick={onUnlock}
        className="px-5 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs shadow-2xs disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
      >
        {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <span>{isProcessing ? 'Unlocking...' : 'Unlock & Save Decrypted Copy'}</span>
      </button>
    </div>
  </div>
);
