import React, { useState } from 'react';
import { X, Check, ArrowLeftRight, Lock, Unlock, Palette } from 'lucide-react';
import { ActivePhotoDocument } from '../PhotoContainer';

export interface PhotoNewCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCanvas: (doc: ActivePhotoDocument) => void;
}

interface AspectPreset {
  id: string;
  name: string;
  ratioText: string;
  width: number;
  height: number;
}

const PRESETS: AspectPreset[] = [
  { id: '16:9', name: 'Landscape', ratioText: '16:9 (1920×1080)', width: 1920, height: 1080 },
  { id: '1:1', name: 'Square', ratioText: '1:1 (1080×1080)', width: 1080, height: 1080 },
  { id: '9:16', name: 'Story / Reel', ratioText: '9:16 (1080×1920)', width: 1080, height: 1920 },
  { id: '4:3', name: 'Standard Photo', ratioText: '4:3 (1600×1200)', width: 1600, height: 1200 },
  { id: '3:2', name: 'Classic Camera', ratioText: '3:2 (1800×1200)', width: 1800, height: 1200 },
  { id: 'custom', name: 'Custom Size', ratioText: 'User defined', width: 1920, height: 1080 },
];

export const PhotoNewCanvasModal: React.FC<PhotoNewCanvasModalProps> = ({
  isOpen,
  onClose,
  onCreateCanvas,
}) => {
  const [title, setTitle] = useState('Untitled Artwork');
  const [selectedPreset, setSelectedPreset] = useState('16:9');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [isLocked, setIsLocked] = useState(false);
  const [bgType, setBgType] = useState<'white' | 'transparent' | 'dark' | 'custom'>('white');
  const [customColor, setCustomColor] = useState('#ffffff');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AspectPreset) => {
    setSelectedPreset(preset.id);
    if (preset.id !== 'custom') {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const handleWidthChange = (val: number) => {
    const nextW = Math.max(10, Math.min(8000, val));
    if (isLocked && width > 0) {
      setHeight(Math.round(nextW * (height / width)));
    }
    setWidth(nextW);
    setSelectedPreset('custom');
  };

  const handleHeightChange = (val: number) => {
    const nextH = Math.max(10, Math.min(8000, val));
    if (isLocked && height > 0) {
      setWidth(Math.round(nextH * (width / height)));
    }
    setHeight(nextH);
    setSelectedPreset('custom');
  };

  const handleSwapOrientation = () => {
    setWidth(height);
    setHeight(width);
    setSelectedPreset('custom');
  };

  const handleCreate = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx && bgType !== 'transparent') {
      const fillColor = bgType === 'dark' ? '#18181b' : bgType === 'custom' ? customColor : '#ffffff';
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, width, height);
    }

    const dataUrl = canvas.toDataURL('image/png');
    onCreateCanvas({
      filePath: null,
      fileName: `${title.trim() || 'Untitled'}.png`,
      dataUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-2xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl shadow-xl border border-stone-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/60 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">New Canvas</h3>
            <p className="text-[11px] text-slate-400">Choose aspect ratio and canvas properties</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600">Canvas Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Canvas title"
              className="px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white transition-all font-mono"
            />
          </div>

          {/* Aspect Ratio Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600">Aspect Ratio Preset</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPreset === p.id
                      ? 'bg-stone-200/90 text-stone-900 border-stone-400/90 font-medium shadow-2xs'
                      : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
                  }`}
                >
                  <span className="font-semibold text-[11px] block text-slate-800">{p.name}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{p.ratioText}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions Controls */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600">Dimensions (Pixels)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1.5">
                <span className="text-[10px] text-slate-400 font-mono mr-2">W</span>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-mono ml-1">px</span>
              </div>

              {/* Ratio Lock */}
              <button
                type="button"
                onClick={() => setIsLocked(!isLocked)}
                title={isLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLocked
                    ? 'bg-stone-200/90 text-stone-900 border-stone-400/80'
                    : 'bg-stone-50 text-slate-400 border-stone-200/80 hover:bg-stone-100'
                }`}
              >
                {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </button>

              <div className="flex-1 flex items-center bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1.5">
                <span className="text-[10px] text-slate-400 font-mono mr-2">H</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-mono ml-1">px</span>
              </div>

              {/* Swap Orientation */}
              <button
                type="button"
                onClick={handleSwapOrientation}
                title="Swap orientation (Landscape / Portrait)"
                className="p-2 rounded-xl border bg-stone-50 text-slate-500 border-stone-200/80 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Background Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600">Background</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBgType('white')}
                className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  bgType === 'white'
                    ? 'bg-stone-200/90 text-stone-900 border-stone-400/90'
                    : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
                }`}
              >
                White
              </button>
              <button
                type="button"
                onClick={() => setBgType('transparent')}
                className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  bgType === 'transparent'
                    ? 'bg-stone-200/90 text-stone-900 border-stone-400/90'
                    : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
                }`}
              >
                Transparent
              </button>
              <button
                type="button"
                onClick={() => setBgType('dark')}
                className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  bgType === 'dark'
                    ? 'bg-stone-200/90 text-stone-900 border-stone-400/90'
                    : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
                }`}
              >
                Dark
              </button>
              <div className="flex items-center gap-1 border border-stone-200/70 rounded-xl px-2 py-1 bg-stone-50/60">
                <Palette className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setBgType('custom');
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/50 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-white hover:bg-stone-50 text-slate-700 border border-stone-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-stone-900 hover:bg-black text-white border border-stone-900 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Create Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
