import { useState, useEffect, useRef, useCallback } from 'react';
import { pdfjsLib, PDFDocumentProxy, PDFPageProxy } from './pdfjsSetup';

export interface PageDimensions {
  width: number;
  height: number;
}

export interface PdfDocumentState {
  doc: PDFDocumentProxy | null;
  numPages: number;
  outline: any[] | null;
  defaultPageDimensions: PageDimensions;
  isLoading: boolean;
  error: string | null;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

export function usePdfDocument(data: Uint8Array | null): PdfDocumentState {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [outline, setOutline] = useState<any[] | null>(null);
  const [defaultDims, setDefaultDims] = useState<PageDimensions>({ width: 595.28, height: 841.89 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const pageCacheRef = useRef<Map<number, PDFPageProxy>>(new Map());
  const activeTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!data || data.byteLength === 0) {
      setDoc(null);
      setNumPages(0);
      setOutline(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    pageCacheRef.current.clear();

    const loadDoc = async () => {
      try {
        // Clone byte array to ensure an independent ArrayBuffer
        const bytes = data.slice();
        const loadingTask = pdfjsLib.getDocument({
          data: bytes,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });
        activeTaskRef.current = loadingTask;

        const loadedDoc = await loadingTask.promise;
        if (isCancelled) {
          loadedDoc.destroy();
          return;
        }

        // Fetch outline (TOC / bookmarks)
        let docOutline: any[] | null = null;
        try {
          docOutline = await loadedDoc.getOutline();
        } catch {
          docOutline = null;
        }

        // Cache Page 1 dimensions as standard viewport baseline
        let dims: PageDimensions = { width: 595.28, height: 841.89 };
        if (loadedDoc.numPages > 0) {
          try {
            const page1 = await loadedDoc.getPage(1);
            const vp = page1.getViewport({ scale: 1 });
            dims = { width: vp.width, height: vp.height };
            pageCacheRef.current.set(1, page1);
          } catch (e) {
            console.warn('Failed to load Page 1 dimensions:', e);
          }
        }

        if (!isCancelled) {
          setDoc(loadedDoc);
          setNumPages(loadedDoc.numPages);
          setOutline(docOutline);
          setDefaultDims(dims);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('[PDF-ENGINE] Failed to parse document:', err);
          setError(err instanceof Error ? err.message : 'Failed to render PDF document');
          setIsLoading(false);
        }
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
      if (activeTaskRef.current?.destroy) {
        activeTaskRef.current.destroy().catch(() => {});
      }
      pageCacheRef.current.clear();
    };
  }, [data]);

  const getPage = useCallback(
    async (pageNumber: number): Promise<PDFPageProxy> => {
      if (!doc) {
        throw new Error('PDF document not loaded');
      }
      if (pageCacheRef.current.has(pageNumber)) {
        return pageCacheRef.current.get(pageNumber)!;
      }
      const page = await doc.getPage(pageNumber);
      pageCacheRef.current.set(pageNumber, page);
      return page;
    },
    [doc]
  );

  return {
    doc,
    numPages,
    outline,
    defaultPageDimensions: defaultDims,
    isLoading,
    error,
    getPage,
  };
}
