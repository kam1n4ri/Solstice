import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { WhiteboardHomeView } from './home/WhiteboardHomeView';
import { WhiteboardInitialData, DEFAULT_WHITEBOARD_TITLE } from './WhiteboardConstants';

// Lazy-load the heavy Tldraw editor chunk to keep initial bundle size lean
const WhiteboardViewLazy = lazy(() =>
  import('./WhiteboardView').then((m) => ({ default: m.WhiteboardView }))
);

export const WhiteboardContainer: React.FC = () => {
  const [activeBoard, setActiveBoard] = useState<WhiteboardInitialData | null>(null);
  const initialFilePath = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('filePath') || params.get('file') || params.get('path');
  }, []);
  const [isColdLoading, setIsColdLoading] = useState<boolean>(Boolean(initialFilePath));
  const [coldLoadError, setColdLoadError] = useState<string | null>(null);

  // Check initial filePath from URL query params on mount
  useEffect(() => {
    if (initialFilePath && window.solsticeAPI?.whiteboardOpenFile) {
      window.solsticeAPI
        .whiteboardOpenFile(initialFilePath)
        .then((res) => {
          if (res.success && res.content !== undefined) {
            setActiveBoard({
              title: res.title || DEFAULT_WHITEBOARD_TITLE,
              content: res.content,
              filePath: res.filePath,
              boardId: res.filePath || `board_${Date.now()}`,
            });
          } else {
            setColdLoadError(res.error || `Could not open whiteboard: ${initialFilePath}`);
          }
        })
        .catch((err) => {
          setColdLoadError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => {
          setIsColdLoading(false);
        });
    } else {
      setIsColdLoading(false);
    }
  }, [initialFilePath]);

  // Listen for file open requests if window is already active
  useEffect(() => {
    if (window.solsticeAPI?.onOpenFileRequested) {
      const unsub = window.solsticeAPI.onOpenFileRequested(async (filePath) => {
        if (filePath && window.solsticeAPI?.whiteboardOpenFile) {
          const res = await window.solsticeAPI.whiteboardOpenFile(filePath);
          if (res.success && res.content !== undefined) {
            setActiveBoard({
              title: res.title || DEFAULT_WHITEBOARD_TITLE,
              content: res.content,
              filePath: res.filePath,
              boardId: res.filePath || `board_${Date.now()}`,
            });
          }
        }
      });
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!activeBoard) {
      window.solsticeAPI?.whiteboardSetDirty?.(false);
      if (window.solsticeAPI?.onSaveAndCloseRequested) {
        const unsubscribe = window.solsticeAPI.onSaveAndCloseRequested(() => {
          window.solsticeAPI?.closeWindow?.(true);
        });
        return unsubscribe;
      }
    }
  }, [activeBoard]);

  if (isColdLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#faf8f5] bg-[radial-gradient(#dcd7cc_1.2px,transparent_1.2px)] [background-size:26px_26px] text-slate-800 select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-baseline">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              Solstice
            </span>
            <span className="font-caveat text-3xl font-bold text-amber-600/90 ml-2 lowercase tracking-wide">
              whiteboard
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600/90" />
            <span>Opening whiteboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <WhiteboardHomeView
        initialErrorMessage={coldLoadError}
        onOpenBoard={(payload) => setActiveBoard(payload)}
      />
    );
  }

  const boardKey =
    activeBoard.boardId || activeBoard.filePath || activeBoard.title || 'whiteboard-default';

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#faf8f5] bg-[radial-gradient(#dcd7cc_1.2px,transparent_1.2px)] [background-size:26px_26px] text-slate-800 select-none">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600/90" />
            <span>Loading canvas...</span>
          </div>
        </div>
      }
    >
      <WhiteboardViewLazy
        key={boardKey}
        initialBoard={activeBoard}
        onBackToHome={() => setActiveBoard(null)}
      />
    </Suspense>
  );
};
