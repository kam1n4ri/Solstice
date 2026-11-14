import React, { useState, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PdfHomeSidebar, PdfHomeTab } from './PdfHomeSidebar';
import { PdfHomeHeader } from './PdfHomeHeader';
import { PdfDropHero } from './PdfDropHero';
import { PdfToolsStrip } from './PdfToolsStrip';
import { PdfRecentList } from './PdfRecentList';
import { PdfAllToolsView } from './PdfAllToolsView';
import { PdfDeleteConfirmModal } from './PdfDeleteConfirmModal';
import {
  RecentPdfItem,
  fetchMergedRecentPdfs,
  toggleStarredPdf,
  removeRecentPdfAsync,
  saveRecentPdf,
} from './PdfRecentStorage';

interface PdfHomeViewProps {
  onDocumentSelected: (filePath: string | null, data: Uint8Array, fileName: string) => void;
  onOpenTool: (toolId: string) => void;
}

export const PdfHomeView: React.FC<PdfHomeViewProps> = ({
  onDocumentSelected,
  onOpenTool,
}) => {
  const [activeTab, setActiveTab] = useState<PdfHomeTab>('home');
  const [recentItems, setRecentItems] = useState<RecentPdfItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<RecentPdfItem | null>(null);

  const loadRecents = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await fetchMergedRecentPdfs();
      setRecentItems(items);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecents();
    window.addEventListener('focus', loadRecents);
    return () => window.removeEventListener('focus', loadRecents);
  }, [loadRecents]);

  const handleOpenFile = async () => {
    if (isOpening) return;
    setIsOpening(true);
    try {
      if (!window.solsticeAPI?.pdfOpenFile) return;
      const result = await window.solsticeAPI.pdfOpenFile();
      if (!result.success || result.canceled || !result.filePath || !result.data) {
        return;
      }

      const bytes = new Uint8Array(result.data);
      const fileName = result.fileName || 'Untitled.pdf';

      saveRecentPdf({
        id: result.filePath,
        title: fileName.replace(/\.pdf$/i, ''),
        filePath: result.filePath,
        lastModified: Date.now(),
        fileSize: bytes.byteLength,
      });

      onDocumentSelected(result.filePath, bytes, fileName);
    } catch (err) {
      console.error('Failed to open PDF file via OS dialog:', err);
    } finally {
      setIsOpening(false);
    }
  };

  const handleCreateBlank = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595.28, 841.89]); // A4
      const pdfBytes = await pdfDoc.save();

      onDocumentSelected(null, pdfBytes, 'Untitled.pdf');
    } catch (err) {
      console.error('Failed to create new blank PDF:', err);
    }
  };

  const handleDropFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    try {
      const nativePath = (file as unknown as { path?: string }).path || null;

      if (nativePath && window.solsticeAPI?.pdfOpenFile) {
        const result = await window.solsticeAPI.pdfOpenFile(nativePath);
        if (result.success && result.filePath && result.data) {
          const bytes = new Uint8Array(result.data);
          const fileName = result.fileName || file.name;
          saveRecentPdf({
            id: result.filePath,
            title: fileName.replace(/\.pdf$/i, ''),
            filePath: result.filePath,
            lastModified: Date.now(),
            fileSize: bytes.byteLength,
          });
          onDocumentSelected(result.filePath, bytes, fileName);
          return;
        }
      }

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const fileName = file.name.endsWith('.pdf') ? file.name : `${file.name}.pdf`;

      if (window.solsticeAPI?.pdfSaveFile) {
        const saveRes = await window.solsticeAPI.pdfSaveFile({
          fileName,
          title: fileName.replace(/\.pdf$/i, ''),
          data: bytes,
        });
        if (saveRes.success && saveRes.filePath) {
          const resName = saveRes.fileName || fileName;
          saveRecentPdf({
            id: saveRes.filePath,
            title: resName.replace(/\.pdf$/i, ''),
            filePath: saveRes.filePath,
            lastModified: Date.now(),
            fileSize: bytes.byteLength,
          });
          onDocumentSelected(saveRes.filePath, bytes, resName);
          return;
        }
      }

      onDocumentSelected(nativePath, bytes, fileName);
    } catch (err) {
      console.error('Failed to parse dropped PDF document:', err);
    }
  };

  const handleOpenItem = async (item: RecentPdfItem) => {
    try {
      let bytes: Uint8Array | null = null;
      let targetPath = item.filePath;
      let fileNameOnDisk = item.filePath.split(/[/\\]/).pop() || `${item.title}.pdf`;

      if (item.filePath && window.solsticeAPI?.pdfOpenFile) {
        const result = await window.solsticeAPI.pdfOpenFile(item.filePath);
        if (result.success && result.data) {
          bytes = new Uint8Array(result.data);
          if (result.filePath) targetPath = result.filePath;
          if (result.fileName) fileNameOnDisk = result.fileName;
        }
      }

      if (!bytes) {
        console.warn('Document could not be located on disk, creating session copy:', item.filePath);
        const blank = await PDFDocument.create();
        blank.addPage([595.28, 841.89]);
        bytes = await blank.save();
      }

      saveRecentPdf({
        ...item,
        id: targetPath,
        filePath: targetPath,
        lastModified: Date.now(),
        fileSize: bytes.byteLength,
      });

      onDocumentSelected(targetPath, bytes, fileNameOnDisk);
    } catch (err) {
      console.error('Failed to open recent PDF:', err);
    }
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStarredPdf(id);
    loadRecents();
  };

  const handleRevealFolder = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.solsticeAPI?.revealInFolder?.(filePath);
  };

  const handleDeleteItem = (item: RecentPdfItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteItem(item);
  };

  const handleRemoveFromRecents = async (item: RecentPdfItem) => {
    await removeRecentPdfAsync(item.id, item.filePath, false);
    setPendingDeleteItem(null);
    await loadRecents();
  };

  const handleDeleteFromDisk = async (item: RecentPdfItem) => {
    await removeRecentPdfAsync(item.id, item.filePath, true);
    setPendingDeleteItem(null);
    await loadRecents();
  };

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-800 select-none overflow-hidden font-sans animate-in fade-in duration-150 selection:bg-rose-100 selection:text-rose-900">
      <PdfHomeSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar bg-white">
        <main className="flex-1 max-w-5xl w-full mx-auto px-8 pb-16 flex flex-col">
          <PdfHomeHeader
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {activeTab === 'home' ? (
            <>
              <PdfDropHero
                onOpenFile={handleOpenFile}
                onCreateBlank={handleCreateBlank}
                onDropFiles={handleDropFiles}
                isOpening={isOpening}
              />

              <PdfToolsStrip
                onOpenTool={onOpenTool}
                onOpenAllTools={() => setActiveTab('tools')}
              />

              {isLoading ? (
                <div className="flex items-center justify-center p-16 text-xs text-slate-400 font-medium">
                  Loading recent documents...
                </div>
              ) : (
                <PdfRecentList
                  items={recentItems}
                  searchQuery={searchQuery}
                  onOpenItem={handleOpenItem}
                  onToggleStar={handleToggleStar}
                  onRevealFolder={handleRevealFolder}
                  onDeleteItem={handleDeleteItem}
                />
              )}
            </>
          ) : (
            <PdfAllToolsView
              searchQuery={searchQuery}
              onOpenTool={onOpenTool}
            />
          )}
        </main>
      </div>

      <PdfDeleteConfirmModal
        isOpen={Boolean(pendingDeleteItem)}
        item={pendingDeleteItem}
        onClose={() => setPendingDeleteItem(null)}
        onRemoveFromRecents={handleRemoveFromRecents}
        onDeleteFromDisk={handleDeleteFromDisk}
      />
    </div>
  );
};
