import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function rebrandMermaidPlugin(): Plugin {
  return {
    name: 'rebrand-mermaid-plugin',
    enforce: 'pre',
    transform(code: string, id: string) {
      // Strictly target vendor Excalidraw modules to avoid mutating application source code
      if (id.includes('@excalidraw')) {
        let transformed = code;
        let modified = false;
        if (transformed.includes('Mermaid to Excalidraw')) {
          transformed = transformed.replaceAll('Mermaid to Excalidraw', 'Mermaid to Diagram');
          modified = true;
        }
        if (transformed.includes('in Excalidraw')) {
          transformed = transformed.replaceAll('in Excalidraw', 'on the whiteboard');
          modified = true;
        }
        if (modified) {
          return {
            code: transformed,
            map: null,
          };
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  plugins: [react(), rebrandMermaidPlugin()],
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
