import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { ToolbarHistory } from './toolbar/ToolbarHistory';
import { ToolbarTypography } from './toolbar/ToolbarTypography';
import { ToolbarLayout } from './toolbar/ToolbarLayout';
import { ToolbarModes } from './toolbar/ToolbarModes';

export interface DocsToolbarProps {
  editor: Editor | null;
  zoomLevel?: number;
  onChangeZoom?: (zoom: number) => void;
  onOpenLinkModal?: () => void;
  onOpenImageModal?: () => void;
  onPrint?: () => void;
  isHeaderHidden?: boolean;
  onToggleHeader?: () => void;
  onOpenFindReplace?: () => void;
}

export const DocsToolbar: React.FC<DocsToolbarProps> = ({
  editor,
  zoomLevel,
  onChangeZoom,
  onOpenLinkModal,
  onOpenImageModal,
  onPrint,
  isHeaderHidden,
  onToggleHeader,
  onOpenFindReplace,
}) => {
  const [isEditable, setIsEditable] = useState(editor?.isEditable ?? true);

  useEffect(() => {
    if (!editor) return;
    setIsEditable(editor.isEditable);
    const syncEditable = () => {
      setIsEditable(editor.isEditable);
    };
    editor.on('update', syncEditable);
    editor.on('transaction', syncEditable);
    return () => {
      editor.off('update', syncEditable);
      editor.off('transaction', syncEditable);
    };
  }, [editor]);

  if (!editor) {
    return <div className="h-11 bg-[#f8fafd]" />;
  }

  return (
    <div className="bg-[#f8fafd] px-4 py-1 select-none shrink-0 z-20 print:hidden">
      {/* Sleek rounded full-width pill matching Google Docs with visible overflow to prevent menu clipping & vertical scroll */}
      <div className="flex items-center justify-between w-full bg-[#edf2fa] px-2.5 py-1 rounded-full border border-slate-200/50 shadow-none relative overflow-visible">
        <div className="flex items-center gap-1 min-w-0 overflow-visible">
          <ToolbarHistory
            editor={editor}
            isEditable={isEditable}
            zoomLevel={zoomLevel}
            onChangeZoom={onChangeZoom}
            onPrint={onPrint}
            onSearchMenus={onOpenFindReplace}
          />

          <div className="h-4 w-px bg-slate-300/50 mx-0.5 shrink-0" />

          {/* Formatting Controls Container - disabled when in Viewing mode */}
          <div
            className={cn(
              'flex items-center gap-1 min-w-0 overflow-visible transition-opacity duration-150',
              !isEditable && 'opacity-40 pointer-events-none'
            )}
            aria-disabled={!isEditable}
          >
            <ToolbarTypography editor={editor} />

            <div className="h-4 w-px bg-slate-300/50 mx-0.5 shrink-0" />

            <ToolbarLayout
              editor={editor}
              onOpenLinkModal={onOpenLinkModal}
              onOpenImageModal={onOpenImageModal}
            />
          </div>
        </div>

        <ToolbarModes
          editor={editor}
          isEditable={isEditable}
          onSetEditable={setIsEditable}
          isHeaderHidden={isHeaderHidden}
          onToggleHeader={onToggleHeader}
        />
      </div>
    </div>
  );
};
