import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageItem, FitMode, Orientation, ConvertResultData } from './PdfConvertTypes';
import { useTauriFileDrop } from '@/lib/useTauriFileDrop';

function revokePreviews(items: ImageItem[]): void {
  items.forEach((img) => {
    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
  });
}

export function usePdfImagesToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [fitMode, setFitMode] = useState<FitMode>('a4-contain');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState<number>(18);
  const [outputName, setOutputName] = useState('Images_Document.pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResultData | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const latestImagesRef = useRef<ImageItem[]>([]);
  latestImagesRef.current = images;

  useEffect(() => {
    return () => revokePreviews(latestImagesRef.current);
  }, []);

  const handleSelectImages = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectImages) return;
      const res = await window.solsticeAPI.pdfSelectImages();
      if (!res.canceled && res.filePaths.length > 0) {
        const existingPaths = new Set(images.map((img) => img.filePath));
        const newItems: ImageItem[] = res.filePaths
          .filter((fp) => !existingPaths.has(fp))
          .map((fp, i) => ({
            id: `${fp}-${Date.now()}-${i}`,
            filePath: fp,
            fileName: fp.split(/[/\\]/).pop() || `Image_${i + 1}`,
            fileSize: 0,
          }));
        setImages((prev) => [...prev, ...newItems]);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select images');
    }
  };

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const existingKeys = new Set(images.map((img) => img.filePath || `${img.fileName}:${img.fileSize}`));
    const newItems: ImageItem[] = [];
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i];
      if (!/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) continue;
      const key = `${file.name}:${file.size}`;
      if (existingKeys.has(key)) continue;
      try {
        const buffer = await file.arrayBuffer();
        newItems.push({
          id: `${key}-${Date.now()}-${i}`,
          filePath: '',
          fileName: file.name,
          fileSize: file.size,
          previewUrl: URL.createObjectURL(file),
          fileData: new Uint8Array(buffer),
        });
        existingKeys.add(key);
      } catch {
        // Ignore unreadable dropped entry
      }
    }
    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
      setError(null);
    }
  };

  const handleDropPaths = useCallback(async (paths: string[]) => {
    const imgPaths = paths.filter((p) => /\.(jpe?g|png|webp|gif|bmp)$/i.test(p));
    if (imgPaths.length === 0) return;

    const newItems: ImageItem[] = [];
    for (let i = 0; i < imgPaths.length; i++) {
      const fp = imgPaths[i];
      if (latestImagesRef.current.some((img) => img.filePath === fp)) continue;
      let fileData: Uint8Array | undefined;
      let previewUrl: string | undefined;
      let fileSize = 0;
      if (window.solsticeAPI?.pdfReadFile) {
        const res = await window.solsticeAPI.pdfReadFile(fp).catch(() => null);
        if (res?.success && res.data) {
          fileData = new Uint8Array(res.data);
          fileSize = res.fileSize ?? fileData.byteLength;
          previewUrl = URL.createObjectURL(new Blob([fileData.buffer as ArrayBuffer]));
        }
      }
      newItems.push({
        id: `${fp}-${Date.now()}-${i}`,
        filePath: fp,
        fileName: fp.split(/[/\\]/).pop() || `Image_${i + 1}`,
        fileSize,
        previewUrl,
        fileData,
      });
    }
    if (newItems.length > 0) {
      setImages((prev) => {
        const existing = new Set(prev.map((img) => img.filePath).filter(Boolean));
        return [...prev, ...newItems.filter((item) => !existing.has(item.filePath))];
      });
      setError(null);
    }
  }, []);

  useTauriFileDrop({
    enabled: !result && !isProcessing,
    onDropPaths: handleDropPaths,
  });

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setImages(copy);
  };

  const handleRemove = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClear = () => {
    setImages((prev) => {
      revokePreviews(prev);
      return [];
    });
  };

  const handleReset = () => {
    setResult(null);
    handleClear();
  };

  const handleDragStart = (_e: React.DragEvent, index: number) => setDraggedIdx(index);

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
        images: images.map((img) => ({
          filePath: img.filePath || undefined,
          fileData: img.fileData ? Array.from(img.fileData) : undefined,
          fileName: img.fileName,
        })),
        imagePaths: images.map((img) => img.filePath).filter(Boolean),
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

  return {
    images, fitMode, setFitMode, orientation, setOrientation, margin, setMargin,
    outputName, setOutputName, isProcessing, error, result, draggedIdx, setDraggedIdx,
    handleSelectImages, handleDropFiles, handleMove, handleRemove, handleClear, handleReset,
    handleDragStart, handleDragOver, handleConvert,
  };
}
