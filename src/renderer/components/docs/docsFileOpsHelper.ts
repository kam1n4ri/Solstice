import { Editor } from '@tiptap/react';
import { DocsSavePayload } from '@shared/types';
import {
  htmlToMarkdown,
  htmlToPlainText,
  markdownToHtml,
  plainTextToHtml,
} from '@shared/formatConverter';
import {
  removeRecentDoc,
  recordRecentDocFromEditor,
} from './home/DocsRecentStorage';

export function resolveSaveFormat(activePath: string | null): DocsSavePayload['format'] {
  const ext = activePath ? activePath.split('.').pop()?.toLowerCase() : 'html';
  return ext === 'docx' || ext === 'md' || ext === 'txt' ? ext : 'html';
}

async function serializeForFormat(
  html: string,
  format: DocsSavePayload['format']
): Promise<{ content: string; data?: number[] }> {
  if (format === 'docx') {
    const { createDocxFromHtml } = await import('@shared/docx/docxConverter');
    const bytes = await createDocxFromHtml(html);
    return { content: '', data: Array.from(bytes) };
  }
  if (format === 'md') {
    return { content: htmlToMarkdown(html) };
  }
  if (format === 'txt') {
    return { content: htmlToPlainText(html) };
  }
  return { content: html };
}

export function readFallbackFileInput(
  file: File,
  editor: Editor,
  onLoaded: (payload: { title: string; content: string }) => void
): void {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'docx') {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          const htmlContent = result.value?.trim() || '<p></p>';
          editor.commands.setContent(htmlContent);
          const title = file.name.replace(/\.[^/.]+$/, '');
          onLoaded({ title, content: htmlContent });
        } catch {
          editor.commands.setContent('<p>Error reading Word document</p>');
        }
      }
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const raw = event.target?.result as string;
    if (raw !== undefined) {
      let htmlContent = raw;
      if (ext === 'md') {
        htmlContent = markdownToHtml(raw);
      } else if (ext === 'txt') {
        htmlContent = plainTextToHtml(raw);
      }
      editor.commands.setContent(htmlContent);
      const title = file.name.replace(/\.[^/.]+$/, '');
      onLoaded({ title, content: htmlContent });
    }
  };
  reader.readAsText(file);
}

export async function performAutoSave(params: {
  editor: Editor;
  title: string;
  activePath: string | null;
  draftId: string;
}): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const { editor, title, activePath, draftId } = params;
  if (!window.solsticeAPI?.docsAutoSave) {
    recordRecentDocFromEditor(editor, title, activePath, undefined, draftId);
    return { success: true };
  }

  const targetFormat = resolveSaveFormat(activePath);
  const { content, data } = await serializeForFormat(editor.getHTML(), targetFormat);

  const res = await window.solsticeAPI.docsAutoSave({
    filePath: activePath,
    draftId,
    title,
    content,
    data,
  });

  if (res.success && res.filePath) {
    if (activePath && activePath !== res.filePath) {
      removeRecentDoc(activePath);
    }
    recordRecentDocFromEditor(editor, title, res.filePath);
    return { success: true, filePath: res.filePath };
  }
  return { success: false, error: res.error || 'Save error' };
}

export async function performSaveDocument(params: {
  editor: Editor;
  title: string;
  activePath: string | null;
  isSaveAs: boolean;
}): Promise<{ success: boolean; canceled?: boolean; filePath?: string; title?: string }> {
  const { editor, title, activePath, isSaveAs } = params;
  if (!window.solsticeAPI?.docsSaveFile) {
    return { success: true };
  }

  const cleanFormat = resolveSaveFormat(activePath);
  const html = editor.getHTML();

  let content = html;
  let mdContent: string | undefined;
  let txtContent: string | undefined;
  let data: number[] | undefined;

  if (isSaveAs || !activePath) {
    mdContent = htmlToMarkdown(html);
    txtContent = htmlToPlainText(html);
    try {
      const { createDocxFromHtml } = await import('@shared/docx/docxConverter');
      data = Array.from(await createDocxFromHtml(html));
    } catch (err) {
      console.error('Failed to pre-serialize docx for Save As:', err);
    }
  } else {
    const serialized = await serializeForFormat(html, cleanFormat);
    content = serialized.content;
    data = serialized.data;
  }

  const res = await window.solsticeAPI.docsSaveFile({
    filePath: isSaveAs ? undefined : activePath || undefined,
    title,
    content,
    mdContent,
    txtContent,
    format: cleanFormat,
    isSaveAs,
    data,
  });

  if (res.canceled) return { success: false, canceled: true };
  if (res.success && res.filePath) {
    const savedExt = res.filePath.split('.').pop()?.toLowerCase();
    recordRecentDocFromEditor(editor, res.title || title, res.filePath, savedExt);
    return { success: true, filePath: res.filePath, title: res.title };
  }
  return { success: false };
}