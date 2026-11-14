import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { registerIpcHandlers } from '../src/main/ipcHandlers';

async function testWhiteboard() {
  Menu.setApplicationMenu(null);
  registerIpcHandlers();

  await app.whenReady();

  const preloadPath = path.join(__dirname, '../dist/preload/index.js');
  const distPath = path.join(__dirname, '../dist/renderer/index.html');
  const fileUrl = `${pathToFileURL(distPath).href}?tool=whiteboard`;

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[RENDERER LOG][L${level}] ${message} (${sourceId}:${line})`);
  });

  await win.loadURL(fileUrl);
  await new Promise((r) => setTimeout(r, 2000));

  // Click New Board
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newBoardBtn = buttons.find(b => b.innerText.includes('New Board') || b.innerText.includes('Blank infinite sheet'));
      newBoardBtn?.click();
    })()
  `);

  await new Promise((r) => setTimeout(r, 2500));

  // Instrument window to watch DOM changes on .tl-container
  await win.webContents.executeJavaScript(`
    (() => {
      window.__domEvents = [];
      const container = document.querySelector('.tl-container');
      if (container) {
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            for (const node of m.removedNodes) {
              window.__domEvents.push({
                type: 'removed',
                tag: node.tagName,
                className: node.className,
                html: node.outerHTML?.slice(0, 100),
                stack: new Error().stack
              });
            }
          }
        });
        observer.observe(container, { childList: true, subtree: true });
      }
    })()
  `);

  // Draw on canvas
  await win.webContents.executeJavaScript(`
    (() => {
      const canvasEl = document.querySelector('.tl-canvas');
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        canvasEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: rect.left + 200, clientY: rect.top + 200, pointerId: 1, pressure: 0.5, buttons: 1 }));
        canvasEl.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: rect.left + 250, clientY: rect.top + 250, pointerId: 1, pressure: 0.5, buttons: 1 }));
        canvasEl.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: rect.left + 250, clientY: rect.top + 250, pointerId: 1, pressure: 0, buttons: 0 }));
      }
    })()
  `);

  // Poll DOM state and log mutations every 500ms for 5 seconds
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const step = await win.webContents.executeJavaScript(`
      (() => {
        const container = document.querySelector('.tl-container');
        const toolbar = document.querySelector('.tlui-toolbar') || document.querySelector('.tlui-main-toolbar__tools');
        const canvas = document.querySelector('.tl-canvas');
        const statusText = document.querySelector('.WhiteboardHeader, header')?.innerText?.replace(/\\n/g, ' ');
        const events = window.__domEvents ? window.__domEvents.splice(0) : [];
        return {
          step: ${i},
          hasContainer: !!container,
          hasToolbar: !!toolbar,
          hasCanvas: !!canvas,
          statusText,
          removedNodesCount: events.length,
          removedSamples: events.slice(0, 3).map(e => ({ tag: e.tag, cls: e.className, html: e.html }))
        };
      })()
    `);
    console.log(`[T+${(i+1)*500}ms]`, JSON.stringify(step));
  }

  app.quit();
}

testWhiteboard().catch((err) => {
  console.error(err);
  app.quit();
});
