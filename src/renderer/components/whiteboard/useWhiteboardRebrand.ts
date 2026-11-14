import { useEffect } from 'react';

const VENDOR_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/Mermaid to Excalidraw/g, 'Mermaid to Diagram'],
  [/in Excalidraw/g, 'on the whiteboard'],
];

/**
 * Replaces lingering vendor text across dynamically mounted popovers,
 * toolbars, and modals without triggering recursive mutation cycles.
 */
export function useWhiteboardRebrand(): void {
  useEffect(() => {
    let isMutating = false;

    const sanitizeNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        let text = node.nodeValue;
        let changed = false;

        for (const [pattern, replacement] of VENDOR_REPLACEMENTS) {
          if (pattern.test(text)) {
            text = text.replace(pattern, replacement);
            changed = true;
          }
        }

        if (changed && text !== node.nodeValue) {
          node.nodeValue = text;
        }
      }
    };

    const walkAndSanitize = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        sanitizeNode(root);
        return;
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      let currentNode: Node | null = walker.nextNode();
      while (currentNode) {
        sanitizeNode(currentNode);
        currentNode = walker.nextNode();
      }
    };

    const observer = new MutationObserver((mutations) => {
      if (isMutating) return;
      isMutating = true;
      try {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              walkAndSanitize(mutation.addedNodes[i]);
            }
          }
        }
      } finally {
        isMutating = false;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    walkAndSanitize(document.body);

    return () => {
      observer.disconnect();
    };
  }, []);
}
