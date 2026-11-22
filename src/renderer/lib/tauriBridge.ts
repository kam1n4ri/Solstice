import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { SolsticeAPI } from '@shared/types/api';
import { ToolId, WindowOpenResult, WindowStateInfo } from '@shared/types';

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
        const targetUrl = `/?tool=${encodeURIComponent(toolId)}${initialPath ? `&file=${encodeURIComponent(initialPath)}` : ''}`;
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
      return await invoke('docs_open_file', { filePath });
    },

    docsSaveFile: async (payload) => {
      return await invoke('docs_save_file', { payload });
    },

    docsExportFile: async (payload) => {
      return await invoke('docs_export_file', { payload });
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
    getInstalledFonts: async () => {
      try {
        return await invoke('get_installed_fonts');
      } catch {
        return [];
      }
    },
  };

  window.solsticeAPI = api;
}
