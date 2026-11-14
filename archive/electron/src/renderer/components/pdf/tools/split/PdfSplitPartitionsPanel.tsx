import React from 'react';
import { Plus, Trash2, SplitSquareVertical, Layers, RotateCcw } from 'lucide-react';
import { SplitPartition, PARTITION_PALETTES } from './PdfSplitTypes';
import { PartitionNumberInput } from './PartitionNumberInput';

interface PdfSplitPartitionsPanelProps {
  mode: 'ranges' | 'extract-all';
  onSetMode: (mode: 'ranges' | 'extract-all') => void;
  partitions: SplitPartition[];
  activePartitionId: string | null;
  onSelectActivePartition: (id: string) => void;
  onAddPartition: () => void;
  onRemovePartition: (id: string) => void;
  onUpdatePartition: (id: string, fromPage: number, toPage: number) => void;
  typedRanges: string;
  onTypedRangesChange: (val: string) => void;
  totalPages: number;
  onPresetHalfSplit: () => void;
  onPresetSinglePartition: () => void;
  onPresetInterval: (interval: number) => void;
}

export const PdfSplitPartitionsPanel: React.FC<PdfSplitPartitionsPanelProps> = ({
  mode,
  onSetMode,
  partitions,
  activePartitionId,
  onSelectActivePartition,
  onAddPartition,
  onRemovePartition,
  onUpdatePartition,
  typedRanges,
  onTypedRangesChange,
  totalPages,
  onPresetHalfSplit,
  onPresetSinglePartition,
  onPresetInterval,
}) => {
  return (
    <aside className="w-80 border-l border-stone-200/80 bg-white/95 flex flex-col h-full overflow-hidden select-none">
      {/* Mode Switcher */}
      <div className="p-4 border-b border-stone-200/70">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-stone-100/80 border border-stone-200/60">
          <button
            type="button"
            onClick={() => onSetMode('ranges')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'ranges'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-rose-500" />
            <span>Partitions</span>
          </button>
          <button
            type="button"
            onClick={() => onSetMode('extract-all')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'extract-all'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>All Pages</span>
          </button>
        </div>
      </div>

      {mode === 'extract-all' ? (
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/70 text-xs text-stone-600">
            <h4 className="font-bold text-stone-800 mb-1">Burst All Pages</h4>
            <p className="text-stone-500 leading-relaxed">
              Every single page (all <span className="font-bold text-stone-800">{totalPages}</span>{' '}
              pages) will be extracted into its own standalone PDF file.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Presets Bar */}
          <div className="p-3 border-b border-stone-200/60 bg-stone-50/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Quick Presets
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={onPresetHalfSplit}
                className="py-1 px-1.5 rounded-lg border border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700 font-medium text-center truncate transition-colors cursor-pointer"
                title="Split at 50% midpoint"
              >
                In Half
              </button>
              <button
                type="button"
                onClick={() => onPresetInterval(2)}
                className="py-1 px-1.5 rounded-lg border border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700 font-medium text-center truncate transition-colors cursor-pointer"
                title="Split every 2 pages"
              >
                Every 2 Pgs
              </button>
              <button
                type="button"
                onClick={onPresetSinglePartition}
                className="py-1 px-1.5 rounded-lg border border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700 font-medium text-center truncate transition-colors cursor-pointer flex items-center justify-center gap-1"
                title="Reset to 1 partition"
              >
                <RotateCcw className="w-2.5 h-2.5 text-stone-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Typed Ranges Quick Input */}
          <div className="p-3 border-b border-stone-200/60 bg-white">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Ranges String
            </label>
            <input
              type="text"
              value={typedRanges}
              onChange={(e) => onTypedRangesChange(e.target.value)}
              placeholder="e.g. 1-3, 4-6"
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200/90 bg-stone-50/50 text-xs text-stone-800 font-mono focus:outline-none focus:border-rose-300"
            />
          </div>

          {/* Partitions List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 custom-scrollbar">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                Partitions ({partitions.length})
              </span>
              <button
                type="button"
                onClick={onAddPartition}
                className="px-2.5 py-1 rounded-xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3 text-rose-600" />
                <span>Add Partition</span>
              </button>
            </div>

            {partitions.map((part) => {
              const palette = PARTITION_PALETTES[part.colorIndex % PARTITION_PALETTES.length];
              const isActive = activePartitionId === part.id;
              const count = Math.max(0, part.toPage - part.fromPage + 1);

              return (
                <div
                  key={part.id}
                  onClick={() => onSelectActivePartition(part.id)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? `${palette.cardBorder} ${palette.cardBg} shadow-xs`
                      : 'border-stone-200/80 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${palette.dotBg}`} />
                      <span className="text-xs font-bold text-stone-800">{part.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({count} pg)</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isActive && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-100/60 px-1.5 py-0.5 rounded-md border border-rose-200/60">
                          Active
                        </span>
                      )}

                      {partitions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePartition(part.id);
                          }}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete partition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Range inputs: From / To */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-[11px] text-stone-500 font-medium">From</span>
                      <PartitionNumberInput
                        value={part.fromPage}
                        min={1}
                        max={totalPages}
                        onChange={(val) => {
                          onUpdatePartition(part.id, val, Math.max(val, part.toPage));
                        }}
                        ariaLabel={`Partition ${part.name} From Page`}
                      />
                    </div>

                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-[11px] text-stone-500 font-medium">To</span>
                      <PartitionNumberInput
                        value={part.toPage}
                        min={part.fromPage}
                        max={totalPages}
                        onChange={(val) => {
                          onUpdatePartition(part.id, part.fromPage, val);
                        }}
                        ariaLabel={`Partition ${part.name} To Page`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
