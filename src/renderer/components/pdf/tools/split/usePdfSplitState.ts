import { useState, useEffect, useMemo, useCallback } from 'react';
import { ActivePdfDocument } from '../../PdfContainer';
import { pdfjsLib, PDFDocumentProxy } from '../../pdfjsSetup';
import { SplitPartition, SplitResultFile } from './PdfSplitTypes';
import {
  reindexPartitions,
  syncTypedRanges,
  parseTypedRanges,
  splitAtPage,
  mergePartitionWithPrevious,
  createHalfSplit,
  createSinglePartition,
  createIntervalPartitions,
  executeSplitApi,
} from './pdfSplitRangeUtils';

interface UsePdfSplitStateProps {
  currentDocument?: ActivePdfDocument | null;
}

export function usePdfSplitState({ currentDocument }: UsePdfSplitStateProps) {
  const [filePath, setFilePath] = useState<string | null>(currentDocument?.filePath || null);
  const [fileData, setFileData] = useState<Uint8Array | null>(currentDocument?.data || null);
  const [fileName, setFileName] = useState<string>(currentDocument?.fileName || 'Document.pdf');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [docProxy, setDocProxy] = useState<PDFDocumentProxy | null>(null);

  const [mode, setMode] = useState<'ranges' | 'extract-all'>('ranges');
  const [partitions, setPartitions] = useState<SplitPartition[]>([]);
  const [activePartitionId, setActivePartitionId] = useState<string | null>(null);
  const [typedRanges, setTypedRanges] = useState<string>('1');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [splitResults, setSplitResults] = useState<SplitResultFile[] | null>(null);

  useEffect(() => {
    if (!fileData) {
      setDocProxy(null);
      setTotalPages(0);
      setPartitions([]);
      return;
    }
    let isCancelled = false;
    pdfjsLib
      .getDocument({ data: fileData.slice() })
      .promise.then((proxy) => {
        if (isCancelled) return;
        setDocProxy(proxy);
        const count = proxy.numPages;
        setTotalPages(count);

        const initial = count > 1 ? createHalfSplit(count) : createSinglePartition(1);
        setPartitions(initial);
        setActivePartitionId(initial[0].id);
        setTypedRanges(syncTypedRanges(initial));
      })
      .catch((err) => {
        console.error('[Split] Error loading PDF proxy:', err);
        setError('Failed to parse PDF document.');
      });

    return () => {
      isCancelled = true;
    };
  }, [fileData]);

  const handleTypedRangesChange = (raw: string) => {
    setTypedRanges(raw);
    const parsed = parseTypedRanges(raw, totalPages);
    if (parsed.length > 0) {
      setPartitions(parsed);
      if (!parsed.some((p) => p.id === activePartitionId)) {
        setActivePartitionId(parsed[0].id);
      }
    }
  };

  const handleAddPartition = () => {
    const lastPart = partitions[partitions.length - 1];
    let nextFrom = 1;
    let nextTo = totalPages;

    if (lastPart) {
      nextFrom = lastPart.toPage < totalPages ? lastPart.toPage + 1 : totalPages;
      nextTo = Math.min(totalPages, nextFrom + 1);
    }

    const newPart: SplitPartition = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Partition ${partitions.length + 1}`,
      fromPage: nextFrom,
      toPage: Math.max(nextFrom, nextTo),
      colorIndex: partitions.length,
    };
    const updated = reindexPartitions([...partitions, newPart]);
    setPartitions(updated);
    setActivePartitionId(newPart.id);
    setTypedRanges(syncTypedRanges(updated));
  };

  const handleRemovePartition = (id: string) => {
    const deletedIndex = partitions.findIndex((p) => p.id === id);
    const updated = reindexPartitions(partitions.filter((p) => p.id !== id));
    setPartitions(updated);
    if (activePartitionId === id && updated.length > 0) {
      const nextIndex = Math.min(Math.max(0, deletedIndex), updated.length - 1);
      setActivePartitionId(updated[nextIndex].id);
    }
    setTypedRanges(syncTypedRanges(updated));
  };

  const handleUpdatePartition = (id: string, fromPage: number, toPage: number) => {
    const updated = partitions.map((p) => (p.id === id ? { ...p, fromPage, toPage } : p));
    setPartitions(updated);
    setTypedRanges(syncTypedRanges(updated));
  };

  const handleSplitAtPage = useCallback((pageNumber: number) => {
    const updated = splitAtPage(partitions, pageNumber, totalPages);
    setPartitions(updated);
    setTypedRanges(syncTypedRanges(updated));
    const nextPart = updated.find((p) => p.fromPage === pageNumber + 1);
    if (nextPart) setActivePartitionId(nextPart.id);
  }, [partitions, totalPages]);

  const handleMergePartitionWithPrevious = useCallback((partitionId: string) => {
    const updated = mergePartitionWithPrevious(partitions, partitionId);
    setPartitions(updated);
    setTypedRanges(syncTypedRanges(updated));
    if (updated.length > 0) setActivePartitionId(updated[0].id);
  }, [partitions]);

  const handlePresetHalfSplit = useCallback(() => {
    const updated = createHalfSplit(totalPages);
    setPartitions(updated);
    setActivePartitionId(updated[0]?.id || null);
    setTypedRanges(syncTypedRanges(updated));
  }, [totalPages]);

  const handlePresetSinglePartition = useCallback(() => {
    const updated = createSinglePartition(totalPages);
    setPartitions(updated);
    setActivePartitionId(updated[0]?.id || null);
    setTypedRanges(syncTypedRanges(updated));
  }, [totalPages]);

  const handlePresetInterval = useCallback((interval: number) => {
    const updated = createIntervalPartitions(interval, totalPages);
    setPartitions(updated);
    setActivePartitionId(updated[0]?.id || null);
    setTypedRanges(syncTypedRanges(updated));
  }, [totalPages]);

  const pagePartitionMap = useMemo(() => {
    const map = new Map<number, { partition: SplitPartition; paletteIndex: number }>();
    partitions.forEach((part) => {
      for (let p = part.fromPage; p <= part.toPage; p++) {
        map.set(p, { partition: part, paletteIndex: part.colorIndex });
      }
    });
    return map;
  }, [partitions]);

  const splitBoundaries = useMemo(() => {
    const map = new Map<number, SplitPartition>();
    partitions.forEach((part, idx) => {
      if (idx > 0) map.set(part.fromPage - 1, part);
    });
    return map;
  }, [partitions]);

  const handleSelectFile = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectFiles || !window.solsticeAPI.pdfReadFile) return;
      const res = await window.solsticeAPI.pdfSelectFiles({ multiple: false, title: 'Select PDF to Split' });
      if (!res.canceled && res.files.length > 0) {
        const file = res.files[0];
        const readRes = await window.solsticeAPI.pdfReadFile(file.filePath);
        if (readRes.success && readRes.data) {
          setFilePath(file.filePath);
          setFileName(file.fileName);
          setFileData(new Uint8Array(readRes.data));
          setSplitResults(null);
          setError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select PDF file');
    }
  };

  const handleDropFile = async (droppedFile: File) => {
    try {
      const buffer = await droppedFile.arrayBuffer();
      const droppedPath = 'path' in droppedFile && typeof droppedFile.path === 'string'
        ? droppedFile.path
        : droppedFile.name;
      setFilePath(droppedPath);
      setFileName(droppedFile.name);
      setFileData(new Uint8Array(buffer));
      setSplitResults(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dropped file');
    }
  };

  const handleSplit = async () => {
    if (!fileData) {
      setError('Please select a PDF document to split.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const res = await executeSplitApi({ filePath, fileData, mode, typedRanges, fileName });
      if (res.results) {
        setSplitResults(res.results);
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    filePath,
    setFilePath,
    fileData,
    setFileData,
    fileName,
    setFileName,
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
    setError,
    splitResults,
    setSplitResults,
    handleSelectFile,
    handleDropFile,
    handleSplit,
  };
}
