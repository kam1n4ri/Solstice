import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { registerIpcHandlers } from '../src/main/ipcHandlers';

async function testExtraTools() {
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

  // Click "New Board"
  await win.webContents.executeJavaScript(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newBoardBtn = buttons.find(b => b.innerText.includes('New Board') || b.innerText.includes('Blank infinite sheet'));
      newBoardBtn?.click();
    })()
  `);

  await new Promise((r) => setTimeout(r, 2500));

  // Click the extra tools button
  console.log('Clicking extra tools button...');
  await win.webContents.executeJavaScript(`
    (() => {
      const btn = document.querySelector('.App-toolbar__extra-tools-trigger');
      btn?.click();
    })()
  `);

  await new Promise((r) => setTimeout(r, 1000));

  // Check items in the dropdown
  const menuInfo = await win.webContents.executeJavaScript(`
    (() => {
      const items = Array.from(document.querySelectorAll('.dropdown-menu-item'));
      return items.map(el => ({
        text: el.innerText.trim(),
        tag: el.tagName
      }));
    })()
  `);
  console.log('Dropdown items found:', menuInfo);

  // Click "Frame tool"
  console.log('Testing clicking Frame tool item...');
  const frameResult = await win.webContents.executeJavaScript(`
    (() => {
      const items = Array.from(document.querySelectorAll('.dropdown-menu-item'));
      const frameItem = items.find(i => i.innerText.includes('Frame'));
      if (frameItem) {
        frameItem.click();
        return 'CLICKED_FRAME';
      }
      return 'FRAME_NOT_FOUND';
    })()
  `);
  console.log('Frame tool click result:', frameResult);

  await new Promise((r) => setTimeout(r, 1000));

  // Re-open extra tools menu
  console.log('Re-opening extra tools menu...');
  await win.webContents.executeJavaScript(`
    (() => {
      const btn = document.querySelector('.App-toolbar__extra-tools-trigger');
      btn?.click();
    })()
  `);

  await new Promise((r) => setTimeout(r, 1000));

  // Click "Laser pointer"
  console.log('Testing clicking Laser pointer item...');
  const laserResult = await win.webContents.executeJavaScript(`
    (() => {
      const items = Array.from(document.querySelectorAll('.dropdown-menu-item'));
      const laserItem = items.find(i => i.innerText.includes('Laser'));
      if (laserItem) {
        laserItem.click();
        return 'CLICKED_LASER';
      }
      return 'LASER_NOT_FOUND';
    })()
  `);
  console.log('Laser tool click result:', laserResult);

  await new Promise((r) => setTimeout(r, 1000));

  console.log('Checking canvas responsiveness after tool selections...');
  const responsive = await win.webContents.executeJavaScript(`
    (() => {
      return {
        activeTool: document.querySelector('.App-toolbar')?.innerText?.replace(/\\n/g, ' '),
        bodyActive: !document.hidden
      };
    })()
  `);
  console.log('Whiteboard responsiveness check:', responsive);

  app.quit();
}

testExtraTools().catch((err) => {
  console.error('Test error:', err);
  app.quit();
});
