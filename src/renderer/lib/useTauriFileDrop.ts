import { useEffect, useRef } from 'react';

interface UseTauriFileDropOptions {
  enabled?: boolean;
  onDropPaths: (paths: string[]) => void;
  onDragChange?: (isDragging: boolean) => void;
}

/**
 * Listens for native Tauri v2 OS file drag-and-drop events on the current webview.
 * Safely no-ops when running in a standard browser outside Tauri.
 */
export function useTauriFileDrop({
  enabled = true,
  onDropPaths,
  onDragChange,
}: UseTauriFileDropOptions): void {
  const onDropRef = useRef(onDropPaths);
  onDropRef.current = onDropPaths;
  const onDragRef = useRef(onDragChange);
  onDragRef.current = onDragChange;

  useEffect(() => {
    if (!enabled) {
      onDragRef.current?.(false);
      return;
    }

    let unlisten: (() => void) | null = null;
    let isCancelled = false;

    import('@tauri-apps/api/webview')
      .then(({ getCurrentWebview }) =>
        getCurrentWebview().onDragDropEvent((event) => {
          if (isCancelled) return;
          const payload = event.payload;
          if (payload.type === 'enter') {
            onDragRef.current?.(true);
          } else if (payload.type === 'leave') {
            onDragRef.current?.(false);
          } else if (payload.type === 'drop') {
            onDragRef.current?.(false);
            if (payload.paths && payload.paths.length > 0) {
              onDropRef.current(payload.paths);
            }
          }
        })
      )
      .then((fn) => {
        if (isCancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {
        // Standalone browser preview without Tauri runtime
      });

    return () => {
      isCancelled = true;
      unlisten?.();
    };
  }, [enabled]);
}
