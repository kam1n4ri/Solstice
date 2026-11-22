import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { SolsticeAPI } from '@shared/types/api';
import { ToolId, WindowOpenResult, WindowStateInfo } from '@shared/types';
import { toByteArray } from './byteUtils';

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
      return await invoke('docs_save_file', { payload });
    },

    docsAutoSave: async (payload) => {
      return await invoke('docs_auto_save', { payload });
    },

    docsExportFile: async (payload) => {
      if (payload.format === 'pdf') {
        window.print();
        return { success: true };
      }
      return await invoke('docs_export_file', { payload });
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
    getInstalledFonts: async () => {
      try {
        return await invoke('get_installed_fonts');
      } catch {
        return [];
      }
    },

    // Native PDF File & Offline Tools IPC
    pdfOpenFile: async (filePath?: string) => {
      const res = await invoke<any>('pdf_open_file', { filePath });
      if (res.data && Array.isArray(res.data)) {
        res.data = new Uint8Array(res.data);
      }
      return res;
    },

    pdfSaveFile: async (payload) => {
      const data = toByteArray(payload.data);
      return await invoke('pdf_save_file', {
        payload: {
          filePath: payload.filePath,
          fileName: payload.fileName,
          title: payload.title,
          data,
        },
      });
    },

    pdfReadFile: async (filePath: string) => {
      const res = await invoke<any>('pdf_read_file', { filePath });
      if (res.data && Array.isArray(res.data)) {
        res.data = new Uint8Array(res.data);
      }
      return res;
    },

    pdfCreateWorkingCopy: async (payload) => {
      if (payload.sourcePath) {
        return await api.pdfOpenFile!(payload.sourcePath);
      }
      if (payload.data) {
        const data = toByteArray(payload.data);
        const saveRes = await invoke<any>('pdf_save_file', {
          payload: {
            fileName: payload.fileName || 'Untitled-Note.pdf',
            data,
          },
        });
        if (saveRes.success && saveRes.filePath) {
          return await api.pdfOpenFile!(saveRes.filePath);
        }
      }
      return { success: false, error: 'Failed to create working copy' };
    },

    pdfRenameFile: async (payload) => {
      return await invoke('pdf_rename_file', { payload });
    },

    pdfExportFile: async (payload) => {
      const data = toByteArray(payload.data);
      return await invoke('pdf_export_file', {
        data,
        defaultName: payload.defaultName,
      });
    },

    pdfPrint: async () => {
      window.print();
      return { success: true };
    },

    pdfSelectFiles: async (options) => {
      return await invoke('pdf_select_files', { options });
    },

    pdfSelectImages: async () => {
      const filePaths = await invoke<string[]>('pdf_select_images');
      return { canceled: filePaths.length === 0, filePaths };
    },

    pdfSaveFilesToFolder: async (payload) => {
      const files = payload.files.map((f) => ({
        fileName: f.fileName,
        data: toByteArray(f.data),
      }));
      return await invoke('pdf_save_files_to_folder', { files });
    },

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
  };

  window.solsticeAPI = api;
}
