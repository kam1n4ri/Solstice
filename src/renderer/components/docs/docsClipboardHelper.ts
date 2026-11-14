import { Editor } from '@tiptap/react';
import { DOMSerializer } from 'prosemirror-model';

/**
 * Copies the current editor selection to the system clipboard,
 * preserving full rich HTML markup (headings, bold, colors, tables, etc.)
 * alongside fallback plain text.
 */
export async function copySelection(editor: Editor | null): Promise<boolean> {
  if (!editor) return false;
  const { empty, from, to } = editor.state.selection;
  if (empty) return false;

  try {
    const slice = editor.state.selection.content();
    const serializer = DOMSerializer.fromSchema(editor.schema);
    const dom = serializer.serializeFragment(slice.content);
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(dom);
    const html = tempDiv.innerHTML;
    const plainText = editor.state.doc.textBetween(from, to, '\n');

    if (navigator.clipboard?.write && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      return true;
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(plainText);
      return true;
    }
  } catch {
    try {
      editor.view.focus();
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Cuts the current editor selection to the system clipboard with rich HTML,
 * then safely deletes the selection from the document.
 */
export async function cutSelection(editor: Editor | null): Promise<boolean> {
  if (!editor) return false;
  const success = await copySelection(editor);
  if (success) {
    editor.chain().focus().deleteSelection().run();
    return true;
  }
  return false;
}

/**
 * Pastes clipboard content into the editor.
 * If plainTextOnly is false, attempts to read and insert rich HTML markup.
 * If plainTextOnly is true, strips all markup and inserts pure text.
 */
export async function pasteClipboard(
  editor: Editor | null,
  plainTextOnly: boolean = false
): Promise<boolean> {
  if (!editor) return false;

  if (plainTextOnly) {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        editor.chain().focus().insertContent(text).run();
        return true;
      }
    } catch {
      editor.view.focus();
      return document.execCommand('paste');
    }
    return false;
  }

  // Attempt rich HTML paste
  try {
    if (navigator.clipboard?.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          const html = await blob.text();
          if (html) {
            editor.chain().focus().insertContent(html).run();
            return true;
          }
        }
      }
    }
  } catch {
    // If read() fails (e.g. format restriction), fall through to plain text
  }

  // Plain text fallback
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      editor.chain().focus().insertContent(text).run();
      return true;
    }
  } catch {
    editor.view.focus();
    return document.execCommand('paste');
  }

  return false;
}
