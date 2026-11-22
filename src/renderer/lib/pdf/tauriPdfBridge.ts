import { invoke } from '@tauri-apps/api/core';
import { SolsticeAPI } from '@shared/types/api';
import { toByteArray } from '../byteUtils';
import { executePdfMerge } from './pdfMergeService';
import { executePdfSplit } from './pdfSplitService';
import { executePdfOrganize } from './pdfOrganizeService';
import { executePdfProtect, executePdfUnlock } from './pdfSecurityService';
import { executePdfWatermark, executePdfPageNumbers } from './pdfStampService';
import { executePdfConvertImages, executePdfExportImages } from './pdfConvertService';

export const tauriPdfBridge: Partial<SolsticeAPI> = {
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
      return await tauriPdfBridge.pdfOpenFile!(payload.sourcePath);
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
        return await tauriPdfBridge.pdfOpenFile!(saveRes.filePath);
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

  // Offline PDF Tool Processors
  pdfMerge: executePdfMerge,
  pdfSplit: executePdfSplit,
  pdfOrganize: executePdfOrganize,
  pdfWatermark: executePdfWatermark,
  pdfPageNumbers: executePdfPageNumbers,
  pdfProtect: executePdfProtect,
  pdfUnlock: executePdfUnlock,
  pdfConvertImages: executePdfConvertImages,
  pdfExportImages: executePdfExportImages,
};
