import { Editor } from '@tiptap/react';
import { htmlToMarkdown, htmlToPlainText } from '@shared/formatConverter';

export { htmlToMarkdown, htmlToPlainText };

export function sanitizeFilename(title: string, defaultName = 'Untitled document'): string {
  const sanitized = title
    .replace(/\.(html|docx|md|txt|pdf)$/i, '')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .trim()
    .replace(/^\.+|\.+$/g, '');
  return sanitized || defaultName;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportDocument(
  editor: Editor | null,
  title: string,
  format: 'docx' | 'pdf' | 'md' | 'html' | 'txt'
): Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }> {
  if (!editor) return { success: false, error: 'No editor instance' };
  const safeTitle = sanitizeFilename(title);
  const html = editor.getHTML();
  const text = editor.getText();
  const md = htmlToMarkdown(html);

  // Use native Electron IPC if available
  if (window.solsticeAPI?.docsExportFile) {
    const content = format === 'md' ? md : format === 'txt' ? text : html;
    return await window.solsticeAPI.docsExportFile({
      format,
      title: safeTitle,
      content,
      htmlContent: html,
    });
  }

  // Fallback for browser preview environment
  switch (format) {
    case 'html': {
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>${html}</body></html>`;
      downloadFile(fullHtml, `${safeTitle}.html`, 'text/html;charset=utf-8');
      break;
    }
    case 'txt': {
      downloadFile(text, `${safeTitle}.txt`, 'text/plain;charset=utf-8');
      break;
    }
    case 'md': {
      downloadFile(md, `${safeTitle}.md`, 'text/markdown;charset=utf-8');
      break;
    }
    case 'pdf': {
      window.print();
      break;
    }
    case 'docx': {
      const docxHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${safeTitle}</title></head><body>${html}</body></html>`;
      downloadFile(docxHtml, `${safeTitle}.doc`, 'application/msword;charset=utf-8');
      break;
    }
  }

  return { success: true };
}
