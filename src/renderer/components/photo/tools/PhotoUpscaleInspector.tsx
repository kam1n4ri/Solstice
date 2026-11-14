import React, { useState } from 'react';
import { Maximize2, Wand2, Image as ImageIcon } from 'lucide-react';
import { UpscaleOptions } from './photoUpscaleHelper';
import { PhotoInspectorActions } from './PhotoInspectorActions';

export interface PhotoUpscaleInspectorProps {
  dimensions: { width: number; height: number };
  onApplyUpscale: (options: UpscaleOptions) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  progress?: number;
}

export const PhotoUpscaleInspector: React.FC<PhotoUpscaleInspectorProps> = ({
  dimensions,
  onApplyUpscale,
  onCancel,
  isProcessing = false,
  progress = 0,
}) => {
  const [scale, setScale] = useState<2 | 4>(2);
  const [profile, setProfile] = useState<'anime' | 'photo'>('photo');
  const [denoise, setDenoise] = useState<'none' | 'low' | 'high'>('low');

  const targetW = dimensions.width * scale;
  const targetH = dimensions.height * scale;

  const handleSubmit = () => {
    onApplyUpscale({ scale, profile, denoise });
  };

  return (
    <div className="p-4 flex flex-col gap-4 text-xs select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Super Resolution
        </span>
        <div className="flex items-center gap-1 text-[11px] text-stone-600 font-medium">
          <Maximize2 className="h-3 w-3" />
          <span>Local Engine</span>
        </div>
      </div>

      {/* Dimension Comparison Card */}
      <div className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/70 flex items-center justify-between font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">Current</span>
          <span className="text-xs text-slate-700 font-semibold">
            {dimensions.width} × {dimensions.height}
          </span>
        </div>
        <div className="text-stone-300 font-sans text-xs">→</div>
        <div className="text-right">
          <span className="text-[10px] text-stone-500 block font-sans">Target ({scale}x)</span>
          <span className="text-xs text-stone-800 font-bold">
            {targetW} × {targetH}
          </span>
        </div>
      </div>

      {/* Scale Factor Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-slate-600">Upscale Factor</label>
        <div className="grid grid-cols-2 gap-2">
          {[2, 4].map((s) => (
            <button
              key={s}
              type="button"
              disabled={isProcessing}
              onClick={() => setScale(s as 2 | 4)}
              className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                scale === s
                  ? 'bg-stone-200/90 text-stone-900 border-stone-400/80 font-semibold shadow-2xs'
                  : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
              }`}
            >
              {s}x {s === 2 ? '(Ultra HD)' : '(4K Print)'}
            </button>
          ))}
        </div>
      </div>

      {/* Enhancement Model Profile */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-slate-600">Enhance Profile</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setProfile('photo')}
            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
              profile === 'photo'
                ? 'bg-stone-200/90 text-stone-900 border-stone-400/80 shadow-2xs'
                : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[11px] mb-0.5">
              <ImageIcon className="h-3 w-3 text-stone-600" />
              <span>Photo / Real</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">Micro-contrast & fine detail</p>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setProfile('anime')}
            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
              profile === 'anime'
                ? 'bg-blue-50/80 text-blue-700 border-blue-200/90 shadow-2xs'
                : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[11px] mb-0.5">
              <Wand2 className="h-3 w-3 text-blue-600" />
              <span>Anime / Art</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">Waifu2x line art clarity</p>
          </button>
        </div>
      </div>

      {/* Artifact Suppression / Denoise */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[11px]">
          <span className="font-semibold text-slate-600">Artifact Denoise</span>
          <span className="capitalize text-slate-400 font-mono">{denoise}</span>
        </div>
        <div className="flex bg-stone-100/70 p-0.5 rounded-lg border border-stone-200/60">
          {(['none', 'low', 'high'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              disabled={isProcessing}
              onClick={() => setDenoise(lvl)}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer ${
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

      {/* Progress Bar */}
      {isProcessing && (
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Enhancing details...</span>
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

      {/* Action Buttons */}
      <PhotoInspectorActions
        onCancel={onCancel}
        onApply={handleSubmit}
        applyLabel={`Upscale ${scale}x`}
        isProcessing={isProcessing}
      />
    </div>
  );
};
