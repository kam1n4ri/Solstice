import React from 'react';
import { ArrowLeft, Scissors, FolderOpen, Loader2 } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { PARTITION_PALETTES } from './split/PdfSplitTypes';
import { usePdfSplitState } from './split/usePdfSplitState';
import { usePdfSplitDrag } from './split/usePdfSplitDrag';
import { PdfSplitEmptyState } from './split/PdfSplitEmptyState';
import { PdfSplitPageCard } from './split/PdfSplitPageCard';
import { PdfSplitCutLine } from './split/PdfSplitCutLine';
import { PdfSplitPartitionsPanel } from './split/PdfSplitPartitionsPanel';
import { PdfSplitResultView } from './split/PdfSplitResultView';

interface PdfSplitToolProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
  currentDocument?: ActivePdfDocument | null;
}

export const PdfSplitTool: React.FC<PdfSplitToolProps> = ({
  onClose,
  onOpenDocument,
  currentDocument,
}) => {
  const {
    fileData,
    setFileData,
    setFilePath,
    fileName,
    totalPages,
    docProxy,
    mode,
    setMode,
    partitions,
    activePartitionId,
    setActivePartitionId,
    typedRanges,
    handleTypedRangesChange,
    handleAddPartition,
    handleRemovePartition,
    handleUpdatePartition,
    handleSplitAtPage,
    handleMergePartitionWithPrevious,
    handlePresetHalfSplit,
    handlePresetSinglePartition,
    handlePresetInterval,
    pagePartitionMap,
    splitBoundaries,
    isProcessing,
    error,
    splitResults,
    setSplitResults,
    handleSelectFile,
    handleDropFile,
    handleSplit,
  } = usePdfSplitState({ currentDocument });

  const { isDragging, dragRange, handlePointerDown, handlePointerEnter } = usePdfSplitDrag({
    activePartitionId,
    partitions,
    onUpdatePartition: handleUpdatePartition,
    onSelectPartition: setActivePartitionId,
    enabled: mode === 'ranges',
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#fafbfc] flex flex-col font-sans select-none animate-in fade-in-50 duration-150">
      {/* Top Header */}
      <header className="h-14 px-6 border-b border-stone-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Back to Tools"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Back</span>
          </button>
          <div className="h-4 w-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-stone-800 tracking-tight">Split PDF</h2>
              <p className="text-[10px] text-stone-400 -mt-0.5">Extract ranges, split at pages, or burst</p>
            </div>
          </div>
        </div>

        {fileData && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-stone-600 bg-stone-100/80 px-2.5 py-1 rounded-lg border border-stone-200/60 max-w-xs truncate">
              {fileName} ({totalPages} pages)
            </span>
            <button
              type="button"
              onClick={handleSelectFile}
              className="px-2.5 py-1 rounded-lg border border-stone-200/80 hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-stone-400" />
              <span>Change PDF</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {splitResults ? (
        <PdfSplitResultView
          files={splitResults}
          onReset={() => {
            setSplitResults(null);
            setFileData(null);
            setFilePath(null);
          }}
          onClose={onClose}
          onOpenDocument={onOpenDocument}
        />
      ) : !fileData ? (
        <PdfSplitEmptyState onSelectFile={handleSelectFile} onDropFile={handleDropFile} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Visual Page Grid */}
            <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-stone-600">
                    Document Pages{' '}
                    <span className="font-normal text-stone-400">
                      {isDragging && dragRange
                        ? `— Dragging selection: Pages ${dragRange.start}–${dragRange.end}`
                        : mode === 'ranges'
                        ? '— Drag across pages to set partition range, or click to focus'
                        : '— Every page will be extracted into its own document'}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const match = pagePartitionMap.get(pageNum);
                    const palette = match
                      ? PARTITION_PALETTES[match.paletteIndex % PARTITION_PALETTES.length]
                      : undefined;
                    const isLastPage = idx === totalPages - 1;
                    const nextPart = splitBoundaries.get(pageNum);
                    const nextPalette = nextPart
                      ? PARTITION_PALETTES[nextPart.colorIndex % PARTITION_PALETTES.length]
                      : undefined;
                    const isDragSelected = Boolean(
                      isDragging &&
                        dragRange &&
                        pageNum >= dragRange.start &&
                        pageNum <= dragRange.end
                    );

                    return (
                      <React.Fragment key={idx}>
                        <PdfSplitPageCard
                          pageIndex={idx}
                          docProxy={docProxy}
                          assignedPartition={match?.partition}
                          palette={palette}
                          isActivePartition={match?.partition.id === activePartitionId}
                          isDragSelected={isDragSelected}
                          onSelectPartition={setActivePartitionId}
                          onSplitAfterPage={handleSplitAtPage}
                          onPointerDown={(e) => handlePointerDown(pageNum, e)}
                          onPointerEnter={() => handlePointerEnter(pageNum)}
                          isModeExtractAll={mode === 'extract-all'}
                          isLastPage={isLastPage}
                        />

                        {!isLastPage && mode === 'ranges' && (
                          <PdfSplitCutLine
                            pageNumber={pageNum}
                            isCutBoundary={Boolean(nextPart)}
                            nextPartition={nextPart}
                            palette={nextPalette}
                            onSplitHere={handleSplitAtPage}
                            onMergeSplit={handleMergePartitionWithPrevious}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </main>

            {/* Right Drawer: Partitions & Range Manager */}
            <PdfSplitPartitionsPanel
              mode={mode}
              onSetMode={setMode}
              partitions={partitions}
              activePartitionId={activePartitionId}
              onSelectActivePartition={setActivePartitionId}
              onAddPartition={handleAddPartition}
              onRemovePartition={handleRemovePartition}
              onUpdatePartition={handleUpdatePartition}
              typedRanges={typedRanges}
              onTypedRangesChange={handleTypedRangesChange}
              totalPages={totalPages}
              onPresetHalfSplit={handlePresetHalfSplit}
              onPresetSinglePartition={handlePresetSinglePartition}
              onPresetInterval={handlePresetInterval}
            />
          </div>

          {/* Sticky Footer */}
          <footer className="h-16 px-8 border-t border-stone-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-stone-500">
              {mode === 'extract-all'
                ? `Bursting all ${totalPages} pages into standalone documents`
                : `${partitions.length} partition${partitions.length > 1 ? 's' : ''} configured (${typedRanges})`}
            </span>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 truncate">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={totalPages === 0 || isProcessing || (mode === 'ranges' && partitions.length === 0)}
              onClick={handleSplit}
              className="px-6 py-2.5 rounded-2xl bg-rose-50/90 hover:bg-rose-100/90 border border-rose-200/80 text-rose-700 font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isProcessing
                  ? 'Splitting PDF...'
                  : mode === 'extract-all'
                  ? `Extract All ${totalPages} Pages`
                  : `Split into ${partitions.length} Partitions`}
              </span>
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};
