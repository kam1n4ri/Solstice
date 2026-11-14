import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

/**
 * Custom TipTap extension for indentation levels (0 to 8).
 * Handles increasing and decreasing margin/padding on paragraphs and list items.
 */
export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minLevel: 0,
      maxLevel: 8,
      indentSize: 24, // 24px per level
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const marginLeft = element.style.marginLeft || element.style.paddingLeft;
              if (!marginLeft) return 0;
              const px = parseInt(marginLeft, 10);
              return isNaN(px) ? 0 : Math.min(8, Math.max(0, Math.round(px / 24)));
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) {
                return {};
              }
              return {
                style: `margin-left: ${attributes.indent * 24}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          if (this.editor.isActive('listItem')) {
            return (this.editor.chain() as any).sinkListItem('listItem').run();
          }
          if (this.editor.isActive('taskItem')) {
            return (this.editor.chain() as any).sinkListItem('taskItem').run();
          }

          const { selection } = state;
          tr = tr.setSelection(selection);
          const { from, to } = selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                });
                changed = true;
              }
            }
          });

          if (changed && dispatch) {
            dispatch(tr);
          }
          return changed;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          if (this.editor.isActive('listItem')) {
            return (this.editor.chain() as any).liftListItem('listItem').run();
          }
          if (this.editor.isActive('taskItem')) {
            return (this.editor.chain() as any).liftListItem('taskItem').run();
          }

          const { selection } = state;
          tr = tr.setSelection(selection);
          const { from, to } = selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > this.options.minLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                });
                changed = true;
              }
            }
          });

          if (changed && dispatch) {
            dispatch(tr);
          }
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    const isTable = () =>
      this.editor.isActive('table') || this.editor.isActive('tableCell') || this.editor.isActive('tableHeader');

    return {
      Tab: () => {
        if (isTable()) {
          const ed = this.editor as any;
          return (
            ed.commands.goToNextCell?.() ||
            (ed.can?.().addRowAfter?.() ? ed.chain().addRowAfter().goToNextCell().run() : false)
          );
        }
        if (this.editor.isActive('listItem')) {
          return (this.editor.chain() as any).sinkListItem('listItem').run();
        }
        if (this.editor.isActive('taskItem')) {
          return (this.editor.chain() as any).sinkListItem('taskItem').run();
        }
        return this.editor.commands.indent();
      },
      'Shift-Tab': () => {
        if (isTable()) {
          return (this.editor as any).commands.goToPreviousCell?.() || false;
        }
        if (this.editor.isActive('listItem')) {
          return (this.editor.chain() as any).liftListItem('listItem').run();
        }
        if (this.editor.isActive('taskItem')) {
          return (this.editor.chain() as any).liftListItem('taskItem').run();
        }
        return this.editor.commands.outdent();
      },
    };
  },
});
