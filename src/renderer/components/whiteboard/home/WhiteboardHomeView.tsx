import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { WhiteboardHomeHeader } from './WhiteboardHomeHeader';
import { WhiteboardDeskHero } from './WhiteboardDeskHero';
import { WhiteboardDeskGrid } from './WhiteboardDeskGrid';
import { DeskSheetItem } from './WhiteboardDeskCard';
import { buildDeskSheets } from './WhiteboardDeskData';
import { WhiteboardDeleteConfirmModal } from './WhiteboardDeleteConfirmModal';
import {
  RecentWhiteboardItem,
  fetchMergedRecentWhiteboards,
  removeRecentWhiteboardAsync,
} from './WhiteboardRecentStorage';
import { WhiteboardInitialData, DEFAULT_WHITEBOARD_TITLE } from '../WhiteboardConstants';
import { useTauriFileDrop } from '@/lib/useTauriFileDrop';

interface WhiteboardHomeViewProps {
  onOpenBoard: (board: WhiteboardInitialData) => void;
  initialErrorMessage?: string | null;
}

export const WhiteboardHomeView: React.FC<WhiteboardHomeViewProps> = ({
  onOpenBoard,
  initialErrorMessage,
}) => {
  const [recentFiles, setRecentFiles] = useState<RecentWhiteboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage || null);
  const [pendingDeleteSheet, setPendingDeleteSheet] = useState<DeskSheetItem | null>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadRecentFiles = useCallback(async () => {
    const items = await fetchMergedRecentWhiteboards();
    setRecentFiles(items);
  }, []);

  useEffect(() => {
    loadRecentFiles();
    window.addEventListener('focus', loadRecentFiles);
    return () => window.removeEventListener('focus', loadRecentFiles);
  }, [loadRecentFiles]);

  const deskSheets: DeskSheetItem[] = useMemo(() => buildDeskSheets(recentFiles), [recentFiles]);

  const filteredSheets = useMemo(() => {
    if (!searchQuery.trim()) return deskSheets;
    const q = searchQuery.toLowerCase().trim();
    return deskSheets.filter((s) => s.title.toLowerCase().includes(q));
  }, [deskSheets, searchQuery]);

  const handleNewBlank = useCallback(() => {
    if (isPreparing) return;
    setIsPreparing(true);
    setPreparingId('blank');
    setTimeout(() => {
      onOpenBoard({ title: DEFAULT_WHITEBOARD_TITLE, boardId: `board_${Date.now()}` });
      setIsPreparing(false);
      setPreparingId(null);
    }, 250);
  }, [isPreparing, onOpenBoard]);

  const handleOpenSheet = useCallback(
    async (sheet: DeskSheetItem) => {
      if (isPreparing) return;
      setIsPreparing(true);
      setPreparingId(sheet.id);

      try {
        if (sheet.filePath && window.solsticeAPI?.whiteboardOpenFile) {
          const res = await window.solsticeAPI.whiteboardOpenFile(sheet.filePath);
          if (res.success && res.content !== undefined) {
            onOpenBoard({
              title: res.title || sheet.title,
              content: res.content,
              filePath: res.filePath,
              boardId: res.filePath || sheet.id,
            });
            return;
          }
          const reason = res.error || 'The file may have been moved or deleted.';
          setErrorMessage(`Unable to open "${sheet.title}": ${reason}`);
          await removeRecentWhiteboardAsync(sheet.id, sheet.filePath, false);
          await loadRecentFiles();
          return;
        }

        onOpenBoard({ title: sheet.title, boardId: `board_${Date.now()}`, templateId: sheet.templateId });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Could not open board');
      } finally {
        setIsPreparing(false);
        setPreparingId(null);
      }
    },
    [isPreparing, onOpenBoard, loadRecentFiles]
  );

  const handleOpenFilePicker = useCallback(async () => {
    if (!window.solsticeAPI?.whiteboardOpenFile) return;
    try {
      const res = await window.solsticeAPI.whiteboardOpenFile();
      if (res.success && res.content !== undefined) {
        onOpenBoard({
          title: res.title || DEFAULT_WHITEBOARD_TITLE,
          content: res.content,
          filePath: res.filePath,
          boardId: res.filePath || `board_${Date.now()}`,
        });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to open file');
    }
  }, [onOpenBoard]);

  const handleDropFiles = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;

      const validExts = ['.excalidraw', '.json', '.solstice', '.tldr'];
      if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) {
        setErrorMessage(`"${file.name}" is not a supported whiteboard file (.excalidraw, .solstice, .tldr, or .json).`);
        return;
      }

      const nativePath = (file as unknown as { path?: string }).path;
      if (nativePath && window.solsticeAPI?.whiteboardOpenFile) {
        const res = await window.solsticeAPI.whiteboardOpenFile(nativePath);
        if (res.success && res.content !== undefined) {
          onOpenBoard({
            title: res.title || file.name.replace(/\.[^/.]+$/, ''),
            content: res.content,
            filePath: res.filePath,
            boardId: res.filePath || `board_${Date.now()}`,
          });
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content);
          onOpenBoard({
            title: file.name.replace(/\.[^/.]+$/, ''),
            content,
            filePath: null,
            boardId: `board_${Date.now()}`,
          });
        } catch {
          setErrorMessage('The dropped file does not contain valid whiteboard data.');
        }
      };
      reader.readAsText(file);
    },
    [onOpenBoard]
  );

  useTauriFileDrop({
    enabled: !isPreparing,
    onDropPaths: async (paths) => {
      const validExts = ['.excalidraw', '.json', '.solstice', '.tldr'];
      const target = paths.find((p) => validExts.some((ext) => p.toLowerCase().endsWith(ext)));
      if (!target) {
        setErrorMessage('Dropped file is not a supported whiteboard file (.excalidraw, .solstice, .tldr, or .json).');
        return;
      }
      if (window.solsticeAPI?.whiteboardOpenFile) {
        const res = await window.solsticeAPI.whiteboardOpenFile(target);
        if (res.success && res.content !== undefined) {
          onOpenBoard({
            title: res.title || target.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || DEFAULT_WHITEBOARD_TITLE,
            content: res.content,
            filePath: res.filePath,
            boardId: res.filePath || `board_${Date.now()}`,
          });
        } else if (res.error) {
          setErrorMessage(res.error);
        }
      }
    },
  });

  const handleRemoveSheet = useCallback(
    (id: string, filePath?: string | null, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const target = deskSheets.find((s) => s.id === id) || {
        id,
        title: filePath?.split(/[/\\]/).pop() || 'Untitled whiteboard',
        relativeTime: '',
        statLabel: '',
        tapeColor: 'yellow' as const,
        tiltClass: '',
        illustrationType: 'freeform' as const,
        filePath,
      };
      setPendingDeleteSheet(target);
    },
    [deskSheets]
  );

  const handleConfirmRemoveFromRecents = useCallback(
    async (sheet: DeskSheetItem) => {
      setPendingDeleteSheet(null);
      await removeRecentWhiteboardAsync(sheet.id, sheet.filePath, false);
      await loadRecentFiles();
    },
    [loadRecentFiles]
  );

  const handleConfirmDeleteFromDisk = useCallback(
    async (sheet: DeskSheetItem) => {
      setPendingDeleteSheet(null);
      await removeRecentWhiteboardAsync(sheet.id, sheet.filePath, true);
      await loadRecentFiles();
    },
    [loadRecentFiles]
  );

  return (
    <div className="flex flex-col min-h-screen w-screen bg-[#faf8f5] bg-[radial-gradient(#dcd7cc_1.2px,transparent_1.2px)] [background-size:26px_26px] text-slate-800 select-none animate-in fade-in duration-150 overflow-x-hidden">
      <WhiteboardHomeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} showSearch={recentFiles.length > 4} />

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 sm:px-12 pb-14">
        {errorMessage && (
          <div className="mb-4 bg-rose-50/95 border border-rose-200/80 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-rose-700 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="p-1 rounded text-rose-500 hover:text-rose-800 cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <WhiteboardDeskHero
          onNewBlank={handleNewBlank}
          onOpenFilePicker={handleOpenFilePicker}
          onDropFiles={handleDropFiles}
          isPreparing={isPreparing}
          preparingId={preparingId}
        />

        <div className="flex items-baseline justify-between mt-12 mb-6 px-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">On your desk</h2>
            <span className="font-caveat text-xl font-bold text-amber-600/90 lowercase tracking-wide">recently touched</span>
          </div>
          <span className="text-xs font-medium text-slate-400 font-sans tracking-wide">
            {filteredSheets.length} sketch sheet{filteredSheets.length === 1 ? '' : 's'}
          </span>
        </div>

        <WhiteboardDeskGrid
          filteredSheets={filteredSheets}
          searchQuery={searchQuery}
          onOpenSheet={handleOpenSheet}
          onRemoveSheet={handleRemoveSheet}
          isPreparing={isPreparing}
          preparingId={preparingId}
        />
      </main>

      <WhiteboardDeleteConfirmModal
        isOpen={Boolean(pendingDeleteSheet)}
        sheet={pendingDeleteSheet}
        onClose={() => setPendingDeleteSheet(null)}
        onRemoveFromRecents={handleConfirmRemoveFromRecents}
        onDeleteFromDisk={handleConfirmDeleteFromDisk}
      />
    </div>
  );
};
