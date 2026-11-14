import { BrowserWindow, shell } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { ToolId, WindowOpenResult, WindowStateInfo } from '../shared/types';

export class WindowManager {
  private hubWindow: BrowserWindow | null = null;
  private toolWindows: Map<ToolId, BrowserWindow> = new Map();

  private getPreloadPath(): string {
    return path.join(__dirname, '../preload/index.js');
  }

  private getRendererUrl(toolId?: ToolId, initialPath?: string): string {
    const isDev = process.env.NODE_ENV === 'development';
    const query = new URLSearchParams();
    if (toolId) query.set('tool', toolId);
    if (initialPath) query.set('filePath', initialPath);
    const qs = query.toString() ? `?${query.toString()}` : '';

    if (isDev) {
      const baseUrl = 'http://localhost:5173';
      return qs ? `${baseUrl}/${qs}` : baseUrl;
    }

    const distPath = path.join(__dirname, '../renderer/index.html');
    const fileUrl = pathToFileURL(distPath).href;
    return qs ? `${fileUrl}${qs}` : fileUrl;
  }

  private setupExternalLinkHandling(win: BrowserWindow): void {
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    win.webContents.on('will-navigate', (event, url) => {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev && (url.startsWith('http://localhost:5173') || url.startsWith('http://127.0.0.1:5173'))) {
        return;
      }
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });
  }

  public createHubWindow(): BrowserWindow {
    if (this.hubWindow && !this.hubWindow.isDestroyed()) {
      if (this.hubWindow.isMinimized()) {
        this.hubWindow.restore();
      }
      this.hubWindow.focus();
      return this.hubWindow;
    }

    this.hubWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      title: 'Solstice Hub',
      backgroundColor: '#f8f9fa',
      show: true,
      autoHideMenuBar: true,
      webPreferences: {
        preload: this.getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
      },
    });

    this.setupExternalLinkHandling(this.hubWindow);

    // Default to maximized state like modern productivity apps (resizable by user)
    this.hubWindow.maximize();
    this.hubWindow.loadURL(this.getRendererUrl());

    this.hubWindow.on('closed', () => {
      this.hubWindow = null;
    });

    return this.hubWindow;
  }

  public async openToolWindow(toolId: ToolId, initialPath?: string): Promise<WindowOpenResult> {
    try {
      // 1. Prevent duplicate window: If already open, restore, maximize if needed, and focus
      const existingWindow = this.toolWindows.get(toolId);
      if (existingWindow && !existingWindow.isDestroyed()) {
        if (existingWindow.isMinimized()) {
          existingWindow.restore();
        }
        existingWindow.focus();

        if (initialPath) {
          existingWindow.webContents.send('solstice:open-file-path', initialPath);
          existingWindow.webContents.send(`${toolId}:open-file-path`, initialPath);
        }

        this.notifyStateChanged({
          toolId,
          isOpen: true,
          isFocused: true,
        });

        return {
          success: true,
          toolId,
          alreadyOpen: true,
          windowId: existingWindow.id,
        };
      }

      // 2. Spawn a new, completely isolated OS-level BrowserWindow maximized by default
      const toolWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        title: `Solstice - ${toolId.toUpperCase()}`,
        backgroundColor: '#f8f9fa',
        show: true,
        autoHideMenuBar: true,
        webPreferences: {
          preload: this.getPreloadPath(),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
          backgroundThrottling: false,
        },
      });

      this.setupExternalLinkHandling(toolWindow);

      // Maximize tool window so it overlays the desktop/hub comfortably while remaining resizable
      toolWindow.maximize();
      this.toolWindows.set(toolId, toolWindow);

      const targetUrl = this.getRendererUrl(toolId, initialPath);
      await toolWindow.loadURL(targetUrl);
      toolWindow.focus();

      // Notify hub about open status
      this.notifyStateChanged({
        toolId,
        isOpen: true,
        isFocused: true,
      });

      // Window lifecycle listeners
      toolWindow.on('focus', () => {
        this.notifyStateChanged({
          toolId,
          isOpen: true,
          isFocused: true,
        });
      });

      toolWindow.on('blur', () => {
        this.notifyStateChanged({
          toolId,
          isOpen: true,
          isFocused: false,
        });
      });

      toolWindow.on('close', (e) => {
        const anyWin = toolWindow as any;
        if (anyWin.__isClosing || toolWindow.isDestroyed()) {
          return;
        }

        if (toolId === 'docs') {
          if (!anyWin.__isDocDirty) {
            // Document clean or on Home screen: let window close immediately
            return;
          }

          e.preventDefault();
          anyWin.__isClosing = true;
          toolWindow.webContents.send('docs:request-save-and-close');
          toolWindow.webContents.send('window:request-save-and-close');

          anyWin.__closeFallbackTimer = setTimeout(() => {
            if (!toolWindow.isDestroyed()) {
              toolWindow.destroy();
            }
          }, 4000);
        } else if (toolId === 'whiteboard') {
          if (!anyWin.__isWhiteboardDirty) {
            return;
          }

          e.preventDefault();
          anyWin.__isClosing = true;
          toolWindow.webContents.send('whiteboard:request-save-and-close');
          toolWindow.webContents.send('window:request-save-and-close');

          anyWin.__closeFallbackTimer = setTimeout(() => {
            if (!toolWindow.isDestroyed()) {
              toolWindow.destroy();
            }
          }, 4000);
        }
      });

      toolWindow.on('closed', () => {
        const anyWin = toolWindow as any;
        if (anyWin.__closeFallbackTimer) {
          clearTimeout(anyWin.__closeFallbackTimer);
          anyWin.__closeFallbackTimer = null;
        }
        this.toolWindows.delete(toolId);
        this.notifyStateChanged({
          toolId,
          isOpen: false,
          isFocused: false,
        });
      });

      return {
        success: true,
        toolId,
        alreadyOpen: false,
        windowId: toolWindow.id,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed to spawn window for ${toolId}:`, errorMessage);
      return {
        success: false,
        toolId,
        error: errorMessage,
      };
    }
  }

  public getActiveTools(): ToolId[] {
    const active: ToolId[] = [];
    for (const [toolId, win] of this.toolWindows.entries()) {
      if (win && !win.isDestroyed()) {
        active.push(toolId);
      }
    }
    return active;
  }

  public notifyStateChanged(state: WindowStateInfo): void {
    if (this.hubWindow && !this.hubWindow.isDestroyed()) {
      this.hubWindow.webContents.send('tool-window-state-changed', state);
    }
  }

  public getHubWindow(): BrowserWindow | null {
    return this.hubWindow;
  }
}

export const windowManager = new WindowManager();
