import React, { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { ActivePdfDocument } from '../../PdfContainer';
import { pdfjsLib } from '../../pdfjsSetup';
import { RenderedPageImage } from './PdfConvertTypes';
import { PdfToImagesResultView } from './PdfToImagesResultView';
import { PdfToImagesConfigCard } from './PdfToImagesConfigCard';

interface PdfToImagesViewProps {
  currentDocument?: ActivePdfDocument | null;
  onClose: () => void;
}

export const PdfToImagesView: React.FC<PdfToImagesViewProps> = ({
  currentDocument,
  onClose,
}) => {
  const [, setFilePath] = useState<string | null>(currentDocument?.filePath || null);
  const [fileData, setFileData] = useState<Uint8Array | null>(currentDocument?.data || null);
  const [fileName, setFileName] = useState<string>(currentDocument?.fileName || 'Document.pdf');
  const [totalPages, setTotalPages] = useState<number>(0);

  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scaleFactor, setScaleFactor] = useState<number>(2.0); // 2x = 300 DPI crisp
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [renderedImages, setRenderedImages] = useState<RenderedPageImage[] | null>(null);
  const [savedFolder, setSavedFolder] = useState<string | null>(null);

  useEffect(() => {
    if (!fileData) {
      setTotalPages(0);
      return;
    }
    let isCancelled = false;
    pdfjsLib.getDocument({ data: fileData.slice() }).promise.then((pdf) => {
      if (!isCancelled) setTotalPages(pdf.numPages);
    }).catch(() => {
      if (!isCancelled) setTotalPages(0);
    });
    return () => {
      isCancelled = true;
    };
  }, [fileData]);

  const handleSelectPdf = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectFiles || !window.solsticeAPI?.pdfReadFile) return;
      const res = await window.solsticeAPI.pdfSelectFiles({ multiple: false, title: 'Select PDF to Convert to Images' });
      if (!res.canceled && res.files.length > 0) {
        const file = res.files[0];
        const readRes = await window.solsticeAPI.pdfReadFile(file.filePath);
        if (readRes.success && readRes.data) {
          setFilePath(file.filePath);
          setFileName(file.fileName);
          setFileData(new Uint8Array(readRes.data));
          setRenderedImages(null);
          setSavedFolder(null);
          setError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select PDF file');
    }
  };

  const handleConvert = async () => {
    if (!fileData || totalPages === 0) {
      setError('Please select a valid PDF document.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setProgressMsg('Loading PDF pages...');

    try {
      const pdf = await pdfjsLib.getDocument({ data: fileData.slice() }).promise;
      const total = pdf.numPages;
      const results: RenderedPageImage[] = [];
      const baseName = fileName.replace(/\.pdf$/i, '');

      for (let i = 1; i <= total; i++) {
        setProgressMsg(`Rendering page ${i} of ${total} (${Math.round((i / total) * 100)}%)...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scaleFactor });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
          const ext = format === 'jpeg' ? 'jpg' : 'png';
          const dataUrl = canvas.toDataURL(mimeType, 0.95);
          results.push({
            pageNumber: i,
            dataUrl,
            fileName: `${baseName}_page_${i}.${ext}`,
          });
        }
      }

      setRenderedImages(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert PDF pages to images.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleSaveAllToFolder = async () => {
    if (!renderedImages || !window.solsticeAPI?.pdfExportImages) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await window.solsticeAPI.pdfExportImages({
        images: renderedImages.map((img) => ({ pageNumber: img.pageNumber, dataUrl: img.dataUrl })),
        baseName: fileName.replace(/\.pdf$/i, ''),
      });
      if (res.success && res.outputDir) {
        setSavedFolder(res.outputDir);
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save images to folder.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (img: RenderedPageImage) => {
    const link = document.createElement('a');
    link.href = img.dataUrl;
    link.download = img.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (renderedImages) {
    return (
      <PdfToImagesResultView
        images={renderedImages}
        isProcessing={isProcessing}
        savedFolder={savedFolder}
        onSaveAll={handleSaveAllToFolder}
        onDownloadSingle={handleDownloadSingle}
        onReset={() => {
          setRenderedImages(null);
          setSavedFolder(null);
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {!fileData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div
            onClick={handleSelectPdf}
            className="w-full max-w-2xl border-2 border-dashed border-stone-300/80 bg-white/70 hover:border-rose-300 hover:bg-rose-50/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
          >
            <div className="w-16 h-16 rounded-3xl bg-rose-50/80 border border-rose-100 text-rose-500 flex items-center justify-center mb-4 shadow-2xs">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-800">Select PDF to Convert to Images</h3>
            <p className="text-xs text-stone-500 mt-1.5 max-w-md">
              Extract every document page into crisp, high-DPI PNG or JPG graphics.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPdf();
              }}
              className="mt-6 px-6 py-2.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-rose-600" />
              <span>Select PDF File</span>
            </button>
          </div>
        </div>
      ) : (
        <PdfToImagesConfigCard
          fileName={fileName}
          totalPages={totalPages}
          format={format}
          setFormat={setFormat}
          scaleFactor={scaleFactor}
          setScaleFactor={setScaleFactor}
          isProcessing={isProcessing}
          progressMsg={progressMsg}
          error={error}
          onSelectPdf={handleSelectPdf}
          onConvert={handleConvert}
        />
      )}
    </div>
  );
};
