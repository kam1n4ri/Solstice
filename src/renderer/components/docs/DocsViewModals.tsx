import React from 'react';
import { Editor } from '@tiptap/react';
import { DocsWordCountModal } from './DocsWordCountModal';
import { DocsLinkModal, DocsImageModal } from './DocsInsertModals';

interface DocsViewModalsProps {
  editor: Editor | null;
  showWordCountModal: boolean;
  onCloseWordCount: () => void;
  showLiveWordCount: boolean;
  onToggleLiveWordCount: (val: boolean) => void;
  showLinkModal: boolean;
  onCloseLink: () => void;
  showImageModal: boolean;
  onCloseImage: () => void;
}

export const DocsViewModals: React.FC<DocsViewModalsProps> = ({
  editor,
  showWordCountModal,
  onCloseWordCount,
  showLiveWordCount,
  onToggleLiveWordCount,
  showLinkModal,
  onCloseLink,
  showImageModal,
  onCloseImage,
}) => {
  const selectedText = editor && !editor.state.selection.empty
    ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
    : '';

  const handleSaveLink = (url: string, text?: string) => {
    if (!editor) return;
    const label = text?.trim() || url;
    const { empty } = editor.state.selection;

    if (empty) {
      editor.chain().focus().insertContent({
        type: 'text',
        text: label,
        marks: [{ type: 'link', attrs: { href: url } }],
      }).run();
    } else {
      if (text?.trim() && text.trim() !== selectedText) {
        editor.chain().focus().insertContent({
          type: 'text',
          text: label,
          marks: [{ type: 'link', attrs: { href: url } }],
        }).run();
      } else {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  };

  return (
    <>
      <DocsWordCountModal
        isOpen={showWordCountModal}
        onClose={onCloseWordCount}
        editor={editor}
        showLiveWordCount={showLiveWordCount}
        onToggleLiveWordCount={onToggleLiveWordCount}
      />
      <DocsLinkModal
        isOpen={showLinkModal}
        onClose={onCloseLink}
        initialUrl={editor?.getAttributes('link').href || ''}
        initialText={selectedText}
        onSave={handleSaveLink}
        onRemove={() => editor?.chain().focus().unsetLink().run()}
      />
      <DocsImageModal
        isOpen={showImageModal}
        onClose={onCloseImage}
        onInsert={(src) => editor?.chain().focus().setImage({ src }).run()}
      />
    </>
  );
};
