import { invoke } from '@tauri-apps/api/core';
import { SolsticeAPI } from '@shared/types/api';
import { ToolId, WindowOpenResult } from '@shared/types';

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
        if (!activeTools.includes(toolId)) activeTools.push(toolId);
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
        return await invoke<ToolId[]>('get_active_tools');
      } catch {
        return activeTools;
      }
    },

    onToolWindowStateChanged: (_callback) => {
      // Event listener placeholder; returns unsubscribe function
      return () => {};
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

    // Photo Studio Native IPC
    photoOpenFile: async (requestedPath?: string) => {
      return await invoke('photo_open_file', { requestedPath });
    },

    photoSaveFile: async (payload) => {
      return await invoke('photo_save_file', { payload });
    },

    photoExportFile: async (payload) => {
      return await invoke('photo_export_file', { payload });
    },

    photoApplyTone: async (payload) => {
      return await invoke<string>('photo_apply_tone', {
        dataUrl: payload.dataUrl,
        filePath: payload.filePath,
        params: payload.params,
      });
    },

    photoRefineCutout: async (payload) => {
      return await invoke<string>('photo_refine_cutout', {
        imageDataUrl: payload.imageDataUrl,
        maskDataUrl: payload.maskDataUrl,
        choke: payload.choke,
        feather: payload.feather,
      });
    },

    photoInpaint: async (payload) => {
      return await invoke<string>('photo_inpaint', {
        imageDataUrl: payload.imageDataUrl,
        maskDataUrl: payload.maskDataUrl,
        radius: payload.radius,
      });
    },

    photoGetDirectory: async () => {
      return await invoke('photo_get_directory');
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
