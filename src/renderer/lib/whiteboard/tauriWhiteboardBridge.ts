import { invoke } from '@tauri-apps/api/core';
import {
  WhiteboardOpenResult,
  WhiteboardSavePayload,
  WhiteboardSaveResult,
  WhiteboardAutoSavePayload,
  WhiteboardAutoSaveResult,
  WhiteboardExportPayload,
  WhiteboardExportResult,
} from '@shared/types';
import { SolsticeAPI } from '@shared/types/api';

export const tauriWhiteboardBridge: Partial<SolsticeAPI> = {
  whiteboardOpenFile: async (filePath?: string): Promise<WhiteboardOpenResult> => {
    try {
      return await invoke<WhiteboardOpenResult>('whiteboard_open_file', { filePath });
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  },

  whiteboardSaveFile: async (payload: WhiteboardSavePayload): Promise<WhiteboardSaveResult> => {
    try {
      return await invoke<WhiteboardSaveResult>('whiteboard_save_file', { payload });
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  },

  whiteboardAutoSave: async (payload: WhiteboardAutoSavePayload): Promise<WhiteboardAutoSaveResult> => {
    try {
      return await invoke<WhiteboardAutoSaveResult>('whiteboard_auto_save', { payload });
    } catch (err: any) {
      return {
        success: false,
        filePath: payload.filePath || '',
        title: payload.title || 'Untitled',
        lastSaved: Date.now(),
        error: err?.message || String(err),
      };
    }
  },

  whiteboardExportFile: async (payload: WhiteboardExportPayload): Promise<WhiteboardExportResult> => {
    try {
      return await invoke<WhiteboardExportResult>('whiteboard_export_file', { payload });
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  },

  whiteboardSetDirty: (_isDirty: boolean): void => {
    // Window state sync helper if needed
  },
};
