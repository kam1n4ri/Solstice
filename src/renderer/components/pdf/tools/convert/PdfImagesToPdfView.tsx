import React, { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { ImageItem, FitMode, Orientation, ConvertResultData } from './PdfConvertTypes';
import { PdfImageCard } from './PdfImageCard';
import { PdfConvertResultView } from './PdfConvertResultView';
import { PdfImagesEmptyState } from './PdfImagesEmptyState';
import { PdfImagesToPdfFooter } from './PdfImagesToPdfFooter';

interface PdfImagesToPdfViewProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
}

export const PdfImagesToPdfView: React.FC<PdfImagesToPdfViewProps> = ({
  onClose,
  onOpenDocument,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [fitMode, setFitMode] = useState<FitMode>('a4-contain');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState<number>(18);
  const [outputName, setOutputName] = useState('Images_Document.pdf');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResultData | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleSelectImages = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectImages) return;
      const res = await window.solsticeAPI.pdfSelectImages();
      if (!res.canceled && res.filePaths.length > 0) {
        const existingPaths = new Set(images.map((img) => img.filePath));
        const newItems: ImageItem[] = res.filePaths
          .filter((fp) => !existingPaths.has(fp))
          .map((fp, i) => {
            const fileName = fp.split(/[/\\]/).pop() || `Image_${i + 1}`;
            return {
              id: `${fp}-${Date.now()}-${i}`,
              filePath: fp,
              fileName,
              fileSize: 0,
            };
          });

        setImages((prev) => [...prev, ...newItems]);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select images');
    }
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const existingPaths = new Set(images.map((img) => img.filePath));
      const newItems: ImageItem[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const fp = (file as unknown as { path?: string }).path || file.name;
        if (!existingPaths.has(fp) && /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) {
          newItems.push({
            id: `${fp}-${Date.now()}-${i}`,
            filePath: fp,
            fileName: file.name,
            fileSize: file.size,
            previewUrl: URL.createObjectURL(file),
          });
        }
      }
      if (newItems.length > 0) {
        setImages((prev) => [...prev, ...newItems]);
        setError(null);
      }
    }
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setImages(copy);
  };

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const copy = [...images];
    const [moved] = copy.splice(draggedIdx, 1);
    copy.splice(index, 0, moved);
    setDraggedIdx(index);
    setImages(copy);
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please add at least 1 image to convert.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      if (!window.solsticeAPI?.pdfConvertImages) return;
      const cleanName = outputName.trim().endsWith('.pdf')
        ? outputName.trim()
        : `${outputName.trim() || 'Images_Document'}.pdf`;

      const res = await window.solsticeAPI.pdfConvertImages({
        imagePaths: images.map((img) => img.filePath),
        fitToPage: fitMode,
        orientation,
        margin,
        defaultName: cleanName,
      });

      if (res.success && res.filePath && res.data) {
        setResult({
          filePath: res.filePath,
          fileName: res.fileName || cleanName,
          pageCount: res.pageCount || images.length,
          fileSize: res.data.length,
          data: new Uint8Array(res.data),
        });
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image to PDF conversion failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) {
    return (
      <PdfConvertResultView
        result={result}
        onReset={() => {
          setResult(null);
          setImages([]);
        }}
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
                    onClick={() => setImages([])}
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
