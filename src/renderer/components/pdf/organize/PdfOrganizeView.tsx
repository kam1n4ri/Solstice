import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { pdfjsLib, PDFDocumentProxy } from '../pdfjsSetup';
import { OrganizeFile, OrganizePage } from './PdfOrganizeTypes';
import { PdfOrganizeGrid } from './PdfOrganizeGrid';
import { PdfOrganizeSidebar } from './PdfOrganizeSidebar';

interface PdfOrganizeViewProps {
  initialFilePath?: string | null;
  initialFileName?: string;
  initialData?: Uint8Array | null;
  saveAsCopy?: boolean;
  onSuccess: (filePath: string, data: Uint8Array, fileName: string) => void;
  onCancel: () => void;
}

const PREFIXES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const PdfOrganizeView: React.FC<PdfOrganizeViewProps> = ({
  initialFilePath,
  initialFileName = 'Document.pdf',
  initialData,
  saveAsCopy = false,
  onSuccess,
  onCancel,
}) => {
  const [files, setFiles] = useState<OrganizeFile[]>([]);
  const [pages, setPages] = useState<OrganizePage[]>([]);
  const [initialPages, setInitialPages] = useState<OrganizePage[]>([]);
  const [docProxies, setDocProxies] = useState<Map<string, PDFDocumentProxy>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextFileIndexRef = useRef(1);
  const docProxiesRef = useRef<Map<string, PDFDocumentProxy>>(new Map());
  docProxiesRef.current = docProxies;

  useEffect(() => {
    return () => {
      docProxiesRef.current.forEach((proxy) => proxy?.destroy?.().catch(() => {}));
    };
  }, []);

  // Load initial document
  useEffect(() => {
    if (!initialData || initialData.byteLength === 0) return;
    let cancelled = false;
    const fileId = 'file-0';
    const prefix = 'A';
    nextFileIndexRef.current = 1;

    PDFDocument.load(initialData, { ignoreEncryption: true })
      .then(async (pdfDoc) => {
        if (cancelled) return;
        const count = pdfDoc.getPageCount();
        const initialFile: OrganizeFile = {
          id: fileId,
          name: initialFileName,
          filePath: initialFilePath || undefined,
          fileData: initialData,
          pageCount: count,
          prefix,
        };

        const items: OrganizePage[] = Array.from({ length: count }, (_, i) => ({
          id: `${fileId}-p-${i}-${Date.now()}`,
          fileId,
          fileIndex: 0,
          originalPageIndex: i,
          rotation: 0,
          filePrefix: prefix,
        }));

        const proxy = await pdfjsLib.getDocument({ data: initialData.slice() }).promise;
        if (cancelled) {
          proxy?.destroy?.().catch(() => {});
          return;
        }

        docProxiesRef.current.forEach((p) => p?.destroy?.().catch(() => {}));
        setFiles([initialFile]);
        setPages(items);
        setInitialPages(items);
        setDocProxies(new Map([[fileId, proxy]]));
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to inspect document pages');
      });

    return () => {
      cancelled = true;
    };
  }, [initialData, initialFileName, initialFilePath]);

  const handleReorderPages = useCallback(
    (fromIndex: number, toIndex: number, position: 'before' | 'after') => {
      setPages((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(fromIndex, 1);
        let insertIndex = toIndex;
        if (fromIndex < toIndex) {
          insertIndex = position === 'before' ? toIndex - 1 : toIndex;
        } else {
          insertIndex = position === 'after' ? toIndex + 1 : toIndex;
        }
        insertIndex = Math.max(0, Math.min(copy.length, insertIndex));
        copy.splice(insertIndex, 0, moved);
        return copy;
      });
    },
    []
  );

  const handleRotatePage = useCallback((index: number, delta: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p))
    );
  }, []);

  const handleRotateAll = useCallback((delta: number) => {
    setPages((prev) =>
      prev.map((p) => ({ ...p, rotation: (p.rotation + delta + 360) % 360 }))
    );
  }, []);

  const handleDeletePage = useCallback((index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDuplicatePage = useCallback((index: number) => {
    setPages((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const copy = [...prev];
      copy.splice(index + 1, 0, {
        ...target,
        id: `${target.fileId}-dup-${Date.now()}-${Math.random()}`,
      });
      return copy;
    });
  }, []);

  const handleReverseOrder = useCallback(() => {
    setPages((prev) => [...prev].reverse());
  }, []);

  const handleResetOrder = useCallback(() => {
    setPages(initialPages);
  }, [initialPages]);

  const handleAddFiles = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectFiles || !window.solsticeAPI?.pdfReadFile) return;
      const res = await window.solsticeAPI.pdfSelectFiles({ multiple: true, title: 'Add PDF to Organize' });
      if (res.canceled || !res.files.length) return;

      const addedFiles: OrganizeFile[] = [];
      const addedPages: OrganizePage[] = [];
      const addedProxies: Array<[string, PDFDocumentProxy]> = [];

      for (const f of res.files) {
        const readRes = await window.solsticeAPI.pdfReadFile(f.filePath);
        if (readRes.success && readRes.data) {
          const bytes = new Uint8Array(readRes.data);
          const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const count = pdfDoc.getPageCount();
          const fileIndex = nextFileIndexRef.current++;
          const fileId = `file-${fileIndex}-${Date.now()}`;
          const prefix = PREFIXES[fileIndex % PREFIXES.length];

          addedFiles.push({
            id: fileId,
            name: f.fileName,
            filePath: f.filePath,
            fileData: bytes,
            pageCount: count,
            prefix,
          });

          for (let i = 0; i < count; i++) {
            addedPages.push({
              id: `${fileId}-p-${i}-${Date.now()}`,
              fileId,
              fileIndex,
              originalPageIndex: i,
              rotation: 0,
              filePrefix: prefix,
            });
          }

          const proxy = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
          addedProxies.push([fileId, proxy]);
        }
      }

      if (addedFiles.length > 0) {
        setDocProxies((prev) => {
          const next = new Map(prev);
          addedProxies.forEach(([id, proxy]) => next.set(id, proxy));
          return next;
        });
        setFiles((prev) => [...prev, ...addedFiles]);
        setPages((prev) => [...prev, ...addedPages]);
        setInitialPages((prev) => [...prev, ...addedPages]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add additional PDF file.');
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setPages((prev) => prev.filter((p) => p.fileId !== fileId));
    setInitialPages((prev) => prev.filter((p) => p.fileId !== fileId));
    setDocProxies((prev) => {
      const next = new Map(prev);
      const removed = next.get(fileId);
      if (removed) {
        removed.destroy?.().catch(() => {});
        next.delete(fileId);
      }
      return next;
    });
  };

  const handleOrganize = async () => {
    if (pages.length === 0 || !window.solsticeAPI?.pdfOrganize) return;
    setIsProcessing(true);
    setError(null);

    try {
      const defaultName = saveAsCopy && !initialFileName.startsWith('Organized_')
        ? `Organized_${initialFileName}`
        : initialFileName;

      const res = await window.solsticeAPI.pdfOrganize({
        files: files.map((f) => ({ filePath: f.filePath, fileData: Array.from(f.fileData) })),
        filePath: files[0]?.filePath,
        fileData: files[0] ? Array.from(files[0].fileData) : undefined,
        pageActions: pages.map((p) => {
          const fIdx = files.findIndex((f) => f.id === p.fileId);
          return {
            fileIndex: Math.max(0, fIdx),
            originalPageIndex: p.originalPageIndex,
            rotationDelta: p.rotation,
          };
        }),
        saveAsCopy,
        defaultName,
      });

      if (res.success && res.filePath && res.data) {
        onSuccess(res.filePath, new Uint8Array(res.data), res.fileName || defaultName);
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organized PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex overflow-hidden z-20">
      <PdfOrganizeGrid
        pages={pages}
        docProxies={docProxies}
        onReorderPages={handleReorderPages}
        onRotatePage={handleRotatePage}
        onRotateAll={handleRotateAll}
        onDeletePage={handleDeletePage}
        onDuplicatePage={handleDuplicatePage}
        onReverseOrder={handleReverseOrder}
        onResetOrder={handleResetOrder}
        onAddFiles={handleAddFiles}
        fileCount={files.length}
        isMultiFile={files.length > 1}
      />
      <PdfOrganizeSidebar
        files={files}
        pages={pages}
        initialPageCount={initialPages.length}
        onRemoveFile={handleRemoveFile}
        onResetAll={handleResetOrder}
        onOrganize={handleOrganize}
        onCancel={onCancel}
        isProcessing={isProcessing}
        error={error}
      />
    </div>
  );
};
