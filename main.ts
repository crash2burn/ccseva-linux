import { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CCUsageService } from './src/services/ccusageService.js';
import { NotificationService } from './src/services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CCMonitorApp {
  private tray: Tray | null = null;
  private window: BrowserWindow | null = null;
  private usageService: CCUsageService;
  private notificationService: NotificationService;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.usageService = CCUsageService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  async initialize() {
    await app.whenReady();
    
    this.createTray();
    this.createWindow();
    this.setupIPC();
    this.startUsagePolling();

    app.on('window-all-closed', () => {
      // Prevent app from quitting, keep in menu bar
    });

    app.on('activate', () => {
      if (this.window === null) {
        this.createWindow();
      }
    });
  }

  private createTray() {
    // Create a simple text-based menu bar icon
    const iconPath = path.join(__dirname, '../assets/icon.png');
    let icon: Electron.NativeImage;
    
    try {
      icon = nativeImage.createFromPath(iconPath);
      if (icon.isEmpty()) {
        throw new Error('Icon file not found or empty');
      }
    } catch (error) {
      // Fallback: create a simple colored square
      icon = nativeImage.createFromBuffer(Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF, 0x61, 0x00, 0x00, 0x00,
        0x2E, 0x49, 0x44, 0x41, 0x54, 0x38, 0x8D, 0x63, 0xFC, 0xFF, 0xFF, 0x3F,
        0x03, 0x35, 0x00, 0x8B, 0x91, 0x81, 0x01, 0x02, 0x8A, 0x91, 0x81, 0x01,
        0x46, 0x06, 0x06, 0x18, 0x18, 0x60, 0x64, 0x80, 0x81, 0x01, 0x46, 0x06,
        0x18, 0x18, 0x60, 0x64, 0x80, 0x91, 0x81, 0x81, 0x01, 0x02, 0x8A, 0x91,
        0x81, 0x01, 0x00, 0x43, 0x5F, 0x01, 0x3F, 0x36, 0x8E, 0xC9, 0x47, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]));
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('Claude Code Monitor');
    
    // Initial context menu
    this.updateTrayMenu();

    this.tray.on('click', () => {
      this.toggleWindow();
    });
  }

  private async updateTrayMenu() {
    try {
      const menuBarData = await this.usageService.getMenuBarData();
      const percentage = Math.round(menuBarData.percentageUsed);
      const statusColor = menuBarData.status === 'critical' ? '🔴' : 
                         menuBarData.status === 'warning' ? '🟡' : '🟢';

      const contextMenu = Menu.buildFromTemplate([
        {
          label: `${statusColor} ${percentage}% used (${menuBarData.tokensUsed.toLocaleString()} tokens)`,
          enabled: false
        },
        {
          label: `💰 $${menuBarData.cost.toFixed(2)} today`,
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Show Details',
          click: () => this.showWindow()
        },
        {
          label: 'Refresh Data',
          click: () => this.refreshData()
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            if (this.updateInterval) {
              clearInterval(this.updateInterval);
            }
            app.quit();
          }
        }
      ]);

      this.tray?.setContextMenu(contextMenu);
      
      // Update tray title with percentage
      this.tray?.setTitle(`${percentage}%`);
      
      // Check for notifications
      this.notificationService.checkAndNotify(menuBarData);
      
    } catch (error) {
      console.error('Error updating tray menu:', error);
      
      // Fallback menu
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Loading...', enabled: false },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
      ]);
      this.tray?.setContextMenu(contextMenu);
    }
  }

  private createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    this.window = new BrowserWindow({
      width: 600,
      height: 600,
      x: width - 420,
      y: 50,
      show: false,
      frame: false,
      resizable: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load the React app
    if (process.env.NODE_ENV === 'development') {
      this.window.loadFile(path.join(__dirname, 'index.html'));
      this.window.webContents.openDevTools({ mode: 'detach' });
    } else {
      this.window.loadFile(path.join(__dirname, 'index.html'));
    }

    this.window.on('blur', () => {
      this.hideWindow();
    });

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  private setupIPC() {
    ipcMain.handle('get-usage-stats', async () => {
      try {
        return await this.usageService.getUsageStats();
      } catch (error) {
        console.error('Error getting usage stats:', error);
        throw error;
      }
    });

    ipcMain.handle('refresh-data', async () => {
      try {
        // Clear cache and fetch fresh data
        const stats = await this.usageService.getUsageStats();
        await this.updateTrayMenu();
        return stats;
      } catch (error) {
        console.error('Error refreshing data:', error);
        throw error;
      }
    });
  }

  private startUsagePolling() {
    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.updateTrayMenu();
      
      // Notify renderer if window is open
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('usage-updated');
      }
    }, 30000);

    // Initial update
    setTimeout(() => this.updateTrayMenu(), 1000);
  }

  private showWindow() {
    if (this.window) {
      this.window.show();
      this.window.focus();
    }
  }

  private hideWindow() {
    if (this.window) {
      this.window.hide();
    }
  }

  private toggleWindow() {
    if (this.window) {
      if (this.window.isVisible()) {
        this.hideWindow();
      } else {
        this.showWindow();
      }
    }
  }

  private async refreshData() {
    await this.updateTrayMenu();
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('usage-updated');
    }
  }
}

// Initialize the app
const ccMonitorApp = new CCMonitorApp();
ccMonitorApp.initialize().catch(console.error);