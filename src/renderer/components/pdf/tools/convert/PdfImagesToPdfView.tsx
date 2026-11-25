import React from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { PdfImageCard } from './PdfImageCard';
import { PdfConvertResultView } from './PdfConvertResultView';
import { PdfImagesEmptyState } from './PdfImagesEmptyState';
import { PdfImagesToPdfFooter } from './PdfImagesToPdfFooter';
import { usePdfImagesToPdf } from './usePdfImagesToPdf';

interface PdfImagesToPdfViewProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
}

export const PdfImagesToPdfView: React.FC<PdfImagesToPdfViewProps> = ({
  onClose,
  onOpenDocument,
}) => {
  const {
    images, fitMode, setFitMode, orientation, setOrientation, margin, setMargin,
    outputName, setOutputName, isProcessing, error, result, draggedIdx, setDraggedIdx,
    handleSelectImages, handleDropFiles, handleMove, handleRemove, handleClear, handleReset,
    handleDragStart, handleDragOver, handleConvert,
  } = usePdfImagesToPdf();

  if (result) {
    return (
      <PdfConvertResultView
        result={result}
        onReset={handleReset}
        onClose={onClose}
        onOpenDocument={onOpenDocument}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" onDragOver={(e) => e.preventDefault()} onDrop={handleDropFiles}>
      {images.length === 0 ? (
        <PdfImagesEmptyState onSelectImages={handleSelectImages} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-stone-600">
                  Image Sequence <span className="font-normal text-stone-400">({images.length} images • Drag cards to rearrange)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="px-2.5 py-1 rounded-lg border border-stone-200/80 hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-stone-400" />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={handleSelectImages}
                    className="px-3 py-1 rounded-lg bg-rose-50/80 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-600" />
                    <span>Add Images</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-start pb-8">
                {images.map((item, idx) => (
                  <PdfImageCard
                    key={item.id}
                    item={item}
                    index={idx}
                    totalCount={images.length}
                    onMove={handleMove}
                    onRemove={handleRemove}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={() => setDraggedIdx(null)}
                    isDragging={draggedIdx === idx}
                  />
                ))}

                <button
                  type="button"
                  onClick={handleSelectImages}
                  className="w-52 h-64 rounded-2xl border-2 border-dashed border-stone-200 hover:border-rose-300 hover:bg-rose-50/20 bg-white/40 flex flex-col items-center justify-center text-stone-400 hover:text-rose-600 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-rose-100/80 text-stone-400 group-hover:text-rose-600 flex items-center justify-center mb-2 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">Add more images</span>
                </button>
              </div>
            </div>
          </div>

          <PdfImagesToPdfFooter
            fitMode={fitMode}
            setFitMode={setFitMode}
            orientation={orientation}
            setOrientation={setOrientation}
            margin={margin}
            setMargin={setMargin}
            outputName={outputName}
            setOutputName={setOutputName}
            error={error}
            imageCount={images.length}
            isProcessing={isProcessing}
            onConvert={handleConvert}
          />
        </div>
      )}
    </div>
  );
};
