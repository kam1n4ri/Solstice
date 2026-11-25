import { Node as PMNode } from '@tiptap/pm/model';

export interface MatchRange {
  from: number;
  to: number;
}

/**
 * Scans the ProseMirror document for all occurrences of searchTerm.
 * Concatenates inline text within each textblock to match seamlessly
 * across formatted text node boundaries (e.g. partial bold, italic, links).
 */
export function findMatchesInDoc(
  doc: PMNode,
  searchTerm: string,
  caseSensitive = false
): MatchRange[] {
  if (!searchTerm) {
    return [];
  }

  const query = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const results: MatchRange[] = [];

  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      let blockText = '';
      const charPosMap: number[] = [];

      node.forEach((child, offset) => {
        if (child.isText && child.text) {
          const childDocStart = pos + 1 + offset;
          for (let i = 0; i < child.text.length; i++) {
            blockText += child.text[i];
            charPosMap.push(childDocStart + i);
          }
        } else if (child.type.name === 'hardBreak') {
          blockText += '\n';
          charPosMap.push(pos + 1 + offset);
        } else {
          // Sentinel prevents matching across inline non-text nodes (e.g. images)
          blockText += '\uFFFC';
          charPosMap.push(-1);
        }
      });

      const textToSearch = caseSensitive ? blockText : blockText.toLowerCase();
      let idx = textToSearch.indexOf(query);
      while (idx !== -1) {
        const from = charPosMap[idx];
        const toChar = charPosMap[idx + query.length - 1];
        const to = typeof toChar === 'number' && toChar >= 0 ? toChar + 1 : -1;
        if (typeof from === 'number' && from >= 0 && to > from) {
          results.push({ from, to });
          idx = textToSearch.indexOf(query, idx + query.length);
        } else {
          idx = textToSearch.indexOf(query, idx + 1);
        }
      }
      return false; // Inline children processed
    }
    return true;
  });

  return results;
}
