import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { MatchRange } from './docsSearchHelper';

export interface SearchHighlightState {
  matches: MatchRange[];
  currentIndex: number;
}

export const SearchHighlightPluginKey = new PluginKey<SearchHighlightState>('searchHighlight');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchHighlight: {
      setSearchHighlights: (matches: MatchRange[], currentIndex: number) => ReturnType;
      clearSearchHighlights: () => ReturnType;
    };
  }
}

/**
 * TipTap extension that manages canvas decorations for Find & Replace.
 * Renders non-intrusive soft highlights on all matches without modifying document content.
 */
export const SearchHighlight = Extension.create({
  name: 'searchHighlight',

  addCommands() {
    return {
      setSearchHighlights:
        (matches: MatchRange[], currentIndex: number) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(SearchHighlightPluginKey, { matches, currentIndex });
            dispatch(tr);
          }
          return true;
        },
      clearSearchHighlights:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(SearchHighlightPluginKey, { matches: [], currentIndex: -1 });
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<SearchHighlightState>({
        key: SearchHighlightPluginKey,
        state: {
          init(): SearchHighlightState {
            return { matches: [], currentIndex: -1 };
          },
          apply(tr, prev): SearchHighlightState {
            const meta = tr.getMeta(SearchHighlightPluginKey);
            if (meta) {
              return meta;
            }
            if (!tr.docChanged || prev.matches.length === 0) {
              return prev;
            }
            // Map match positions across document mutations
            const mappedMatches: MatchRange[] = [];
            for (const m of prev.matches) {
              const from = tr.mapping.map(m.from, 1);
              const to = tr.mapping.map(m.to, -1);
              if (from < to) {
                mappedMatches.push({ from, to });
              }
            }
            return {
              matches: mappedMatches,
              currentIndex: prev.currentIndex >= mappedMatches.length ? 0 : prev.currentIndex,
            };
          },
        },
        props: {
          decorations(state) {
            const pluginState = SearchHighlightPluginKey.getState(state);
            if (!pluginState || pluginState.matches.length === 0) {
              return DecorationSet.empty;
            }

            const decos: Decoration[] = [];
            const docSize = state.doc.content.size;

            pluginState.matches.forEach((match, idx) => {
              if (match.from >= 0 && match.to <= docSize && match.from < match.to) {
                const isActive = idx === pluginState.currentIndex;
                decos.push(
                  Decoration.inline(match.from, match.to, {
                    class: isActive
                      ? 'docs-search-match docs-search-match-active'
                      : 'docs-search-match',
                  })
                );
              }
            });

            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});
