import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { SolsticeAPI } from '@shared/types/api';
import { ToolId, WindowOpenResult, WindowStateInfo } from '@shared/types';
import { toByteArray } from './byteUtils';
import { tauriPdfBridge } from './pdf/tauriPdfBridge';
import { tauriWhiteboardBridge } from './whiteboard/tauriWhiteboardBridge';
import { tauriFontBridge } from './hub/tauriFontBridge';

/**
 * Native Tauri v2 bridge for Solstice.
 * Replaces Electron contextBridge IPC with direct native Rust commands via `invoke`.
 */
export function initTauriBridge(): void {
  // If window.solsticeAPI is already provided (e.g. Electron mock or existing), keep it
  if (window.solsticeAPI) return;

  const activeTools: ToolId[] = [];

  const api: SolsticeAPI = {
    openToolWindow: async (toolId: ToolId, initialPath?: string): Promise<WindowOpenResult> => {
      try {
        const res = await invoke<WindowOpenResult>('open_tool_window', {
          toolId,
          initialPath,
        });
        if (res.success && !activeTools.includes(toolId)) {
          activeTools.push(toolId);
        }
        return res;
      } catch (err) {
        // Fallback for single-window / web routing
        const enc = initialPath ? encodeURIComponent(initialPath) : '';
        const targetUrl = `/?tool=${encodeURIComponent(toolId)}${initialPath ? `&filePath=${enc}&file=${enc}` : ''}`;
        window.location.href = targetUrl;
        return { success: true, toolId };
      }
    },

    getActiveTools: async (): Promise<ToolId[]> => {
      try {
        const tools = await invoke<ToolId[]>('get_active_tools');
        activeTools.length = 0;
        activeTools.push(...tools);
        return tools;
      } catch {
        return [...activeTools];
      }
    },

    onToolWindowStateChanged: (callback: (state: WindowStateInfo) => void) => {
      let isUnsubscribed = false;
      let unlistenFn: (() => void) | null = null;

      listen<WindowStateInfo>('tool-window-state-changed', (event) => {
        if (!isUnsubscribed) {
          const payload = event.payload;
          if (payload.isOpen) {
            if (!activeTools.includes(payload.toolId)) {
              activeTools.push(payload.toolId);
            }
          } else {
            const idx = activeTools.indexOf(payload.toolId);
            if (idx !== -1) {
              activeTools.splice(idx, 1);
            }
          }
          callback(payload);
        }
      }).then((unlisten) => {
        if (isUnsubscribed) {
          unlisten();
        } else {
          unlistenFn = unlisten;
        }
      }).catch((err) => {
        console.warn('Failed to listen to tool-window-state-changed:', err);
      });

      return () => {
        isUnsubscribed = true;
        if (unlistenFn) {
          unlistenFn();
          unlistenFn = null;
        }
      };
    },

    getAppVersion: async (): Promise<string> => {
      try {
        return await invoke<string>('get_app_version');
      } catch {
        return '0.1.0-native';
      }
    },

    minimizeWindow: () => {
      invoke('minimize_window').catch(() => {});
    },

    maximizeWindow: () => {
      invoke('maximize_window').catch(() => {});
    },

    closeWindow: (_force?: boolean) => {
      invoke('close_window').catch(() => {
        window.close();
      });
    },

    // Native Docs File IPC
    docsOpenFile: async (filePath?: string) => {
      const res = await invoke<any>('docs_open_file', { filePath });
      if (!res || !res.success) return res;

      if (res.format === 'docx' && res.data) {
        try {
          const mammoth = await import('mammoth');
          const arrayBuffer = new Uint8Array(res.data).buffer;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          res.content = result.value?.trim() || '<p></p>';
        } catch (err: any) {
          res.content = `<p>Error reading docx: ${err?.message || 'unknown'}</p>`;
        }
      } else if (res.format === 'md' && res.content) {
        const { markdownToHtml } = await import('../../shared/formatConverter');
        res.content = markdownToHtml(res.content);
      } else if (res.format === 'txt' && res.content) {
        const { plainTextToHtml } = await import('../../shared/formatConverter');
        res.content = plainTextToHtml(res.content);
      }
      return res;
    },

    docsSaveFile: async (payload) => {
      const data = payload.data ? toByteArray(payload.data) : undefined;
      return await invoke('docs_save_file', {
        payload: {
          ...payload,
          data,
        },
      });
    },

    docsAutoSave: async (payload) => {
      return await invoke('docs_auto_save', { payload });
    },

    docsExportFile: async (payload) => {
      if (payload.format === 'pdf') {
        window.print();
        return { success: true };
      }
      const data = payload.data ? toByteArray(payload.data) : undefined;
      return await invoke('docs_export_file', {
        payload: {
          ...payload,
          data,
        },
      });
    },

    docsSetDirty: (_isDirty: boolean) => {
      // In Tauri mode, dirty status tracking
    },

    docsConfirmUnsaved: async () => {
      return 'dont-save';
    },

    // Hub Recent Files IPC
    getRecentFiles: async () => {
      try {
        return await invoke('get_recent_files');
      } catch {
        return [];
      }
    },

    // Suite Fonts IPC
    ...tauriFontBridge,

    // Native PDF File & Offline Tools IPC (Spread modular bridge)
    ...tauriPdfBridge,

    // Native Whiteboard File & Engine IPC
    ...tauriWhiteboardBridge,

    revealInFolder: async (filePath: string) => {
      try {
        await invoke('reveal_in_folder', { filePath });
        return true;
      } catch {
        return false;
      }
    },

    deleteFile: async (filePath: string) => {
      try {
        await invoke('delete_file', { filePath });
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },

    removeRecentFile: async (filePath: string, deleteFromDisk?: boolean) => {
      if (deleteFromDisk) {
        await invoke('delete_file', { filePath }).catch(() => {});
      }
      return true;
    },

    onOpenFileRequested: (callback: (filePath: string) => void) => {
      let isUnsubscribed = false;
      let unlistenFn: (() => void) | null = null;

      listen<string>('open-file-requested', (event) => {
        if (!isUnsubscribed && event.payload) {
          callback(event.payload);
        }
      })
        .then((unlisten) => {
          if (isUnsubscribed) unlisten();
          else unlistenFn = unlisten;
        })
        .catch((err) => {
          console.warn('Failed to listen to open-file-requested:', err);
        });

      return () => {
        isUnsubscribed = true;
        unlistenFn?.();
      };
    },

    onSaveAndCloseRequested: (callback: () => void) => {
      let isUnsubscribed = false;
      let unlistenFn: (() => void) | null = null;

      listen('save-and-close-requested', () => {
        if (!isUnsubscribed) callback();
      })
        .then((unlisten) => {
          if (isUnsubscribed) unlisten();
          else unlistenFn = unlisten;
        })
        .catch((err) => {
          console.warn('Failed to listen to save-and-close-requested:', err);
        });

      const handleBeforeUnload = () => {
        if (!isUnsubscribed) callback();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        isUnsubscribed = true;
        unlistenFn?.();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    },

    openExternalUrl: async (url: string): Promise<boolean> => {
      try {
        const { open } = await import('@tauri-apps/plugin-shell');
        await open(url);
        return true;
      } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
        return true;
      }
    },
  };

  window.solsticeAPI = api;
}
