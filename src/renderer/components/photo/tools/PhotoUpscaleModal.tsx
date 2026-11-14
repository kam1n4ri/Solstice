import React, { useState } from 'react';
import { Maximize2, X, Image as ImageIcon, Wand2 } from 'lucide-react';
import { UpscaleOptions, upscaleImage } from './photoUpscaleHelper';

interface PhotoUpscaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageSrc: string;
  dimensions: { width: number; height: number };
  onApplyUpscale: (newDataUrl: string) => void;
}

export const PhotoUpscaleModal: React.FC<PhotoUpscaleModalProps> = ({
  isOpen,
  onClose,
  currentImageSrc,
  dimensions,
  onApplyUpscale,
}) => {
  const [scale, setScale] = useState<2 | 4>(2);
  const [profile, setProfile] = useState<'anime' | 'photo'>('anime');
  const [denoise, setDenoise] = useState<'none' | 'low' | 'high'>('low');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const targetW = dimensions.width * scale;
  const targetH = dimensions.height * scale;

  const handleStartUpscale = async () => {
    if (!currentImageSrc) return;
    setIsProcessing(true);
    setProgress(10);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = async () => {
      try {
        const options: UpscaleOptions = { scale, profile, denoise };
        const resultUrl = await upscaleImage(img, options, (p) => setProgress(p));
        onApplyUpscale(resultUrl);
        setIsProcessing(false);
        onClose();
      } catch (err) {
        console.error('Upscale failed:', err);
        setIsProcessing(false);
      }
    };
    img.onerror = () => setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/60 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
              <Maximize2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Super Resolution</h3>
              <p className="text-[11px] text-slate-400">Offline photo & illustration upscaling</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Dimension Comparison Badge */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Current</span>
              <span className="text-xs text-slate-700 font-semibold">{dimensions.width} × {dimensions.height}</span>
            </div>
            <div className="text-stone-300 font-sans text-xs">→</div>
            <div className="text-right">
              <span className="text-[10px] text-blue-600 block font-sans">Target ({scale}x)</span>
              <span className="text-xs text-blue-700 font-bold">{targetW} × {targetH}</span>
            </div>
          </div>

          {/* Scale Factor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600">Upscale Factor</label>
            <div className="grid grid-cols-2 gap-2">
              {[2, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setScale(s as 2 | 4)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    scale === s
                      ? 'bg-blue-50/80 text-blue-800 border-blue-300 font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {s}x Resolution {s === 2 ? '(Ultra HD)' : '(4K Ultra)'}
                </button>
              ))}
            </div>
          </div>

          {/* Model Profile (Anime vs Photo) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600">Enhance Profile</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setProfile('anime')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  profile === 'anime'
                    ? 'bg-blue-50/80 text-blue-900 border-blue-300 shadow-2xs'
                    : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <Wand2 className="h-3 w-3 text-blue-600" />
                  <span>Anime / Art</span>
                </div>
                <p className="text-[10px] text-slate-500">Waifu2x line clarity & flat de-ringing</p>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setProfile('photo')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  profile === 'photo'
                    ? 'bg-blue-50/80 text-blue-900 border-blue-300 shadow-2xs'
                    : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <ImageIcon className="h-3 w-3 text-stone-600" />
                  <span>Photo / Real</span>
                </div>
                <p className="text-[10px] text-slate-500">Micro-contrast & fine texture detail</p>
              </button>
            </div>
          </div>

          {/* Denoise Level */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-600">Artifact Suppression</span>
              <span className="capitalize text-slate-400 font-mono">{denoise}</span>
            </div>
            <div className="flex bg-stone-100/80 p-0.5 rounded-lg border border-stone-200/60">
              {(['none', 'low', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setDenoise(lvl)}
                  className={`flex-1 py-1 rounded text-[11px] font-medium capitalize transition-all cursor-pointer ${
                    denoise === lvl
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Progress bar when processing */}
          {isProcessing && (
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Enhancing pixels...</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200/80 bg-stone-50/50 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-white hover:bg-stone-50 text-slate-700 border border-stone-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartUpscale}
            disabled={isProcessing}
            className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-stone-900 hover:bg-black text-white border border-stone-900 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span>{isProcessing ? 'Upscaling...' : 'Enhance & Upscale'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
