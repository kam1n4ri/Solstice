import { app, BrowserWindow, Menu } from 'electron';
import { windowManager } from './windowManager';
import { registerIpcHandlers } from './ipcHandlers';

// 1. Hardware acceleration & GPU performance switches for smooth Linux & cross-platform rendering
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform', 'x11');
}

// 2. Globally strip the default OS menu bar across Windows and Linux
Menu.setApplicationMenu(null);

// 3. Register all IPC contracts before window creation
registerIpcHandlers();

app.whenReady().then(() => {
  // Spawn the primary Hub window
  windowManager.createHubWindow();

  app.on('activate', () => {
    // On macOS re-create a window in the app when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createHubWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS apps commonly remain active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
