import { invoke } from '@tauri-apps/api/core';
import { SolsticeAPI } from '@shared/types/api';

export const tauriHubBridge: Partial<SolsticeAPI> = {
  getStorageInfo: async () => {
    try {
      return await invoke<{ rootPath: string; totalBytes: number; fileCount: number }>(
        'get_solstice_storage_info'
      );
    } catch {
      return { rootPath: '', totalBytes: 0, fileCount: 0 };
    }
  },

  openSolsticeFolder: async (): Promise<boolean> => {
    try {
      await invoke('open_solstice_folder');
      return true;
    } catch {
      return false;
    }
  },
};
