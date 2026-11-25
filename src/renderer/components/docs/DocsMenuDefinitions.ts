import { MenuItem, DocsMenuBarProps } from './DocsMenuTypes';
import { copySelection, cutSelection, pasteClipboard } from './docsClipboardHelper';

export function buildMenuDefinitions(props: DocsMenuBarProps): Record<string, MenuItem[]> {
  const {
    editor,
    onRenameFocus,
    onNewDocument,
    onOpenFile,
    onSaveDocument,
    onExport,
    isPrintLayout,
    onToggleLayout,
    onSetPrintLayout,
    showOutlineSidebar,
    onToggleOutlineSidebar,
    zoomLevel,
    onChangeZoom,
    onOpenFindReplace,
    onOpenWordCount,
    spellCheck,
    onToggleSpellCheck,
    onOpenLinkModal,
    onOpenImageModal,
  } = props;

  const isInTable = editor?.isActive('table') || false;

  const handleSelectPrintLayout = (enablePrint: boolean) => {
    if (onSetPrintLayout) {
      onSetPrintLayout(enablePrint);
    } else {
      if (enablePrint !== isPrintLayout) {
        onToggleLayout(enablePrint);
      }
    }
  };

  return {
    File: [
      { id: 'new', label: 'New document', shortcut: 'Ctrl+N', onClick: onNewDocument },
      { id: 'open', label: 'Open...', shortcut: 'Ctrl+O', onClick: onOpenFile },
      { id: 'save', label: 'Save', shortcut: 'Ctrl+S', onClick: onSaveDocument },
      { id: 'save-as', label: 'Save as...', shortcut: 'Ctrl+Shift+S', onClick: props.onSaveAsDocument },
      { id: 'rename', label: 'Rename', onClick: onRenameFocus },
      {
        id: 'export',
        label: 'Export',
        submenu: [
          { id: 'exp-docx', label: 'Microsoft Word (.docx)', onClick: () => onExport('docx') },
          { id: 'exp-pdf', label: 'PDF Document (.pdf)', onClick: () => onExport('pdf') },
          { id: 'exp-md', label: 'Markdown (.md)', onClick: () => onExport('md') },
          { id: 'exp-html', label: 'Web Page (.html)', onClick: () => onExport('html') },
          { id: 'exp-txt', label: 'Plain Text (.txt)', onClick: () => onExport('txt') },
        ],
      },
      { id: 'div-print', divider: true, label: '' },
      { id: 'print', label: 'Print', shortcut: 'Ctrl+P', onClick: () => window.print() },
    ],
    Edit: [
      {
        id: 'undo',
        label: 'Undo',
        shortcut: 'Ctrl+Z',
        onClick: () => editor?.chain().focus().undo().run(),
        disabled: !editor?.can().undo(),
      },
      {
        id: 'redo',
        label: 'Redo',
        shortcut: 'Ctrl+Y',
        onClick: () => editor?.chain().focus().redo().run(),
        disabled: !editor?.can().redo(),
      },
      { id: 'div-clipboard', divider: true, label: '' },
      {
        id: 'cut',
        label: 'Cut',
        shortcut: 'Ctrl+X',
        onClick: () => cutSelection(editor),
      },
      {
        id: 'copy',
        label: 'Copy',
        shortcut: 'Ctrl+C',
        onClick: () => copySelection(editor),
      },
      {
        id: 'paste',
        label: 'Paste',
        shortcut: 'Ctrl+V',
        onClick: () => pasteClipboard(editor, false),
      },
      {
        id: 'paste-plain',
        label: 'Paste without formatting',
        shortcut: 'Ctrl+Shift+V',
        onClick: () => pasteClipboard(editor, true),
      },
      {
        id: 'select-all',
        label: 'Select all',
        shortcut: 'Ctrl+A',
        onClick: () => editor?.chain().focus().selectAll().run(),
      },
      { id: 'div-find', divider: true, label: '' },
      {
        id: 'find-replace',
        label: 'Find and replace',
        shortcut: 'Ctrl+H / Ctrl+F',
        onClick: onOpenFindReplace,
      },
    ],
    View: [
      {
        id: 'print-layout',
        label: 'Print layout',
        checked: isPrintLayout,
        onClick: () => handleSelectPrintLayout(true),
      },
      {
        id: 'pageless-layout',
        label: 'Pageless layout',
        checked: !isPrintLayout,
        onClick: () => handleSelectPrintLayout(false),
      },
      { id: 'div-outline', divider: true, label: '' },
      {
        id: 'outline-sidebar',
        label: 'Show outline',
        checked: showOutlineSidebar,
        onClick: onToggleOutlineSidebar,
      },
      {
        id: 'zoom',
        label: 'Zoom',
        submenu: [
          { id: 'z-50', label: '50%', checked: zoomLevel === 50, onClick: () => onChangeZoom(50) },
          { id: 'z-75', label: '75%', checked: zoomLevel === 75, onClick: () => onChangeZoom(75) },
          { id: 'z-90', label: '90%', checked: zoomLevel === 90, onClick: () => onChangeZoom(90) },
          { id: 'z-100', label: '100% (Normal)', shortcut: 'Ctrl+0', checked: zoomLevel === 100, onClick: () => onChangeZoom(100) },
          { id: 'z-125', label: '125%', checked: zoomLevel === 125, onClick: () => onChangeZoom(125) },
          { id: 'z-150', label: '150%', checked: zoomLevel === 150, onClick: () => onChangeZoom(150) },
          { id: 'z-200', label: '200%', checked: zoomLevel === 200, onClick: () => onChangeZoom(200) },
        ],
      },
      { id: 'div-fs', divider: true, label: '' },
      {
        id: 'fullscreen',
        label: 'Full screen',
        onClick: () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        },
      },
    ],
    Insert: [
      { id: 'image', label: 'Image...', onClick: onOpenImageModal },
      {
        id: 'table',
        label: isInTable ? 'Table Actions' : 'Table (3x3)',
        onClick: isInTable ? undefined : () => {
          editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
        submenu: isInTable ? [
          { id: 't-row-before', label: 'Add row above', onClick: () => editor?.chain().focus().addRowBefore().run() },
          { id: 't-row-after', label: 'Add row below', onClick: () => editor?.chain().focus().addRowAfter().run() },
          { id: 't-row-del', label: 'Delete row', onClick: () => editor?.chain().focus().deleteRow().run() },
          { id: 't-col-before', label: 'Add column before', onClick: () => editor?.chain().focus().addColumnBefore().run() },
          { id: 't-col-after', label: 'Add column after', onClick: () => editor?.chain().focus().addColumnAfter().run() },
          { id: 't-col-del', label: 'Delete column', onClick: () => editor?.chain().focus().deleteColumn().run() },
          { id: 't-del', label: 'Delete table', onClick: () => editor?.chain().focus().deleteTable().run() },
        ] : undefined,
      },
      { id: 'link', label: 'Link...', shortcut: 'Ctrl+K', onClick: onOpenLinkModal },
      { id: 'code-block', label: 'Code block', onClick: () => editor?.chain().focus().toggleCodeBlock().run() },
      { id: 'hr', label: 'Horizontal line', onClick: () => editor?.chain().focus().setHorizontalRule().run() },
      { id: 'page-break', label: 'Page break', onClick: () => (editor as any)?.chain().focus().setPageBreak().run() },
    ],
    Format: [
      {
        id: 'text-formatting',
        label: 'Text styles',
        submenu: [
          { id: 'bold', label: 'Bold', shortcut: 'Ctrl+B', checked: editor?.isActive('bold'), onClick: () => editor?.chain().focus().toggleBold().run() },
          { id: 'italic', label: 'Italic', shortcut: 'Ctrl+I', checked: editor?.isActive('italic'), onClick: () => editor?.chain().focus().toggleItalic().run() },
          { id: 'underline', label: 'Underline', shortcut: 'Ctrl+U', checked: editor?.isActive('underline'), onClick: () => editor?.chain().focus().toggleUnderline().run() },
          { id: 'strike', label: 'Strikethrough', checked: editor?.isActive('strike'), onClick: () => editor?.chain().focus().toggleStrike().run() },
        ],
      },
      {
        id: 'headings',
        label: 'Paragraph styles',
        submenu: [
          { id: 'p', label: 'Normal text', checked: editor?.isActive('paragraph'), onClick: () => editor?.chain().focus().setParagraph().run() },
          { id: 'h1', label: 'Heading 1', checked: editor?.isActive('heading', { level: 1 }), onClick: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
          { id: 'h2', label: 'Heading 2', checked: editor?.isActive('heading', { level: 2 }), onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
          { id: 'h3', label: 'Heading 3', checked: editor?.isActive('heading', { level: 3 }), onClick: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
          { id: 'bq', label: 'Blockquote', checked: editor?.isActive('blockquote'), onClick: () => editor?.chain().focus().toggleBlockquote().run() },
        ],
      },
      {
        id: 'align',
        label: 'Align',
        submenu: [
          { id: 'al-left', label: 'Left align', checked: editor?.isActive({ textAlign: 'left' }), onClick: () => editor?.chain().focus().setTextAlign('left').run() },
          { id: 'al-center', label: 'Center', checked: editor?.isActive({ textAlign: 'center' }), onClick: () => editor?.chain().focus().setTextAlign('center').run() },
          { id: 'al-right', label: 'Right align', checked: editor?.isActive({ textAlign: 'right' }), onClick: () => editor?.chain().focus().setTextAlign('right').run() },
          { id: 'al-justify', label: 'Justify', checked: editor?.isActive({ textAlign: 'justify' }), onClick: () => editor?.chain().focus().setTextAlign('justify').run() },
        ],
      },
      {
        id: 'lists',
        label: 'Lists & Checklists',
        submenu: [
          { id: 'li-bullet', label: 'Bulleted list', checked: editor?.isActive('bulletList'), onClick: () => editor?.chain().focus().toggleBulletList().run() },
          { id: 'li-ordered', label: 'Numbered list', checked: editor?.isActive('orderedList'), onClick: () => editor?.chain().focus().toggleOrderedList().run() },
          { id: 'li-task', label: 'Task checklist', checked: editor?.isActive('taskList'), onClick: () => editor?.chain().focus().toggleTaskList().run() },
        ],
      },
      { id: 'div-clr', divider: true, label: '' },
      { id: 'clear-format', label: 'Clear formatting', onClick: () => editor?.chain().focus().unsetAllMarks().clearNodes().run() },
    ],
    Tools: [
      { id: 'word-count', label: 'Word count', shortcut: 'Ctrl+Shift+C', onClick: onOpenWordCount },
      { id: 'spell-check', label: 'Spelling and grammar check', checked: spellCheck, onClick: onToggleSpellCheck },
    ],
  };
}
