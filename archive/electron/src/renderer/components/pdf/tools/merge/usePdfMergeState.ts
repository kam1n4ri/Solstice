import { useState } from 'react';
import { ActivePdfDocument } from '../../PdfContainer';
import { MergeFileItem, MergeResultData } from './PdfMergeTypes';

export function usePdfMergeState(currentDocument?: ActivePdfDocument | null) {
  const [files, setFiles] = useState<MergeFileItem[]>(() => {
    if (currentDocument?.filePath) {
      return [
        {
          id: `${currentDocument.filePath}-0`,
          filePath: currentDocument.filePath,
          fileName: currentDocument.fileName,
          fileSize: currentDocument.data.length,
        },
      ];
    }
    return [];
  });

  const [outputName, setOutputName] = useState('Merged_Document.pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MergeResultData | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleAddFiles = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectFiles) return;
      const res = await window.solsticeAPI.pdfSelectFiles({
        multiple: true,
        title: 'Select PDF Files to Merge',
      });
      if (!res.canceled && res.files && res.files.length > 0) {
        setFiles((prev) => {
          const existingPaths = new Set(prev.map((f) => f.filePath));
          const newItems: MergeFileItem[] = res.files
            .filter((f) => !existingPaths.has(f.filePath))
            .map((f, i) => ({
              id: `${f.filePath}-${Date.now()}-${i}`,
              filePath: f.filePath,
              fileName: f.fileName,
              fileSize: f.fileSize,
            }));
          return [...prev, ...newItems];
        });
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select files');
    }
  };

  const handleDropFiles = (droppedFiles: FileList) => {
    const newItems: MergeFileItem[] = [];
    const existingPaths = new Set(files.map((f) => f.filePath));
    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      const filePath = (file as unknown as { path?: string }).path || file.name;
      if (filePath.toLowerCase().endsWith('.pdf') && !existingPaths.has(filePath)) {
        newItems.push({
          id: `${filePath}-${Date.now()}-${i}`,
          filePath,
          fileName: file.name,
          fileSize: file.size,
        });
      }
    }
    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
      setError(null);
    }
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setFiles(updated);
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSortAlphabetical = () => {
    setFiles((prev) => [...prev].sort((a, b) => a.fileName.localeCompare(b.fileName)));
  };

  const handleDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const updated = [...files];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(index, 0, moved);
    setDraggedIdx(index);
    setFiles(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIdx(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF documents to merge.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (!window.solsticeAPI?.pdfMerge) return;
      const cleanName = outputName.trim().endsWith('.pdf')
        ? outputName.trim()
        : `${outputName.trim() || 'Merged_Document'}.pdf`;

      const res = await window.solsticeAPI.pdfMerge({
        filePaths: files.map((f) => f.filePath),
        defaultName: cleanName,
      });

      if (res.success && res.filePath && res.data) {
        const totalSize = files.reduce((acc, f) => acc + f.fileSize, 0);
        setResult({
          filePath: res.filePath,
          fileName: res.fileName || cleanName,
          pageCount: res.pageCount || 0,
          fileSize: totalSize,
          data: new Uint8Array(res.data),
        });
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge documents.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    files,
    setFiles,
    outputName,
    setOutputName,
    isProcessing,
    error,
    result,
    setResult,
    draggedIdx,
    handleAddFiles,
    handleDropFiles,
    handleMove,
    handleRemove,
    handleSortAlphabetical,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleMerge,
  };
}
