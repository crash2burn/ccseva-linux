import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage, screen } from 'electron';
import { CCUsageService } from './src/services/ccusageService.js';
import { NotificationService } from './src/services/notificationService.js';
import { DynamicTrayIcon } from './src/utils/dynamicIcon.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CCSevaApp {
  private tray: Tray | null = null;
  private window: BrowserWindow | null = null;
  private usageService: CCUsageService;
  private notificationService: NotificationService;
  private iconService: DynamicTrayIcon;
  private updateInterval: NodeJS.Timeout | null = null;
  private displayInterval: NodeJS.Timeout | null = null;
  private showPercentage = true;
  private cachedMenuBarData: any = null;
  private menuBarDisplayMode: 'off' | 'percentage' | 'value' | 'all' = 'all';

  constructor() {
    this.usageService = CCUsageService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.iconService = DynamicTrayIcon.getInstance();
  }

  async initialize() {
    await app.whenReady();

    this.createTray();
    this.createWindow();
    this.setupIPC();
    this.startUsagePolling();
    this.startDisplayToggle();

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
    // Create initial dynamic icon with 0%
    const initialIcon = this.iconService.createStaticIcon();
    this.tray = new Tray(initialIcon);
    this.tray.setToolTip('CCSeva - Claude Code Usage Monitor');

    // Update tray with usage percentage
    this.updateTrayTitle();

    this.tray.on('click', () => {
      this.toggleWindow();
    });
  }

  private async updateTrayTitle() {
    try {
      const menuBarData = await this.usageService.getMenuBarData();
      this.cachedMenuBarData = menuBarData;

      // Update tray title based on current display mode
      this.updateTrayDisplay();

      // Add context menu for Linux compatibility
      this.updateTrayContextMenu();

      // Check for notifications (auto source)
      this.notificationService.checkAndNotify(menuBarData, 'auto');
    } catch (error) {
      console.error('Error updating tray title:', error);
      this.tray?.setTitle('--');
      this.cachedMenuBarData = null;
    }
  }

  private updateTrayDisplay() {
    if (!this.cachedMenuBarData) return;

    // Handle different display modes
    switch (this.menuBarDisplayMode) {
      case 'off':
        // Show static Claude icon only
        const staticIcon = this.iconService.createStaticIcon();
        this.tray?.setImage(staticIcon);
        break;
      
      case 'percentage':
        const percentage = Math.round(this.cachedMenuBarData.percentageUsed);
        const percentageIcon = this.iconService.createPercentageIcon(percentage);
        this.tray?.setImage(percentageIcon);
        break;
      
      case 'value':
        const cost = this.cachedMenuBarData.cost;
        const costIcon = this.iconService.createCostIcon(cost);
        this.tray?.setImage(costIcon);
        break;
      
      case 'all':
        // Toggle between percentage and cost based on showPercentage flag
        if (this.showPercentage) {
          const percentage = Math.round(this.cachedMenuBarData.percentageUsed);
          const dynamicIcon = this.iconService.createPercentageIcon(percentage);
          this.tray?.setImage(dynamicIcon);
        } else {
          const cost = this.cachedMenuBarData.cost;
          const dynamicIcon = this.iconService.createCostIcon(cost);
          this.tray?.setImage(dynamicIcon);
        }
        break;
    }
    
    // Clear title since we're showing everything in the icon
    this.tray?.setTitle('');
  }

  private startDisplayToggle() {
    // Only toggle if in 'all' mode
    if (this.menuBarDisplayMode === 'all') {
      // Switch between percentage and cost every 3 seconds
      this.displayInterval = setInterval(() => {
        this.showPercentage = !this.showPercentage;
        this.updateTrayDisplay();
      }, 3000);
    }
  }

  private updateTrayContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show/Hide',
        click: () => this.toggleWindow()
      },
      {
        label: 'Refresh Data',
        click: async () => {
          await this.updateTrayTitle();
          if (this.window && !this.window.isDestroyed()) {
            this.window.webContents.send('usage-updated');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          if (this.updateInterval) clearInterval(this.updateInterval);
          if (this.displayInterval) clearInterval(this.displayInterval);
          app.quit();
        }
      }
    ]);
    
    this.tray?.setContextMenu(contextMenu);
  }

  private createWindow() {
    const { width } = screen.getPrimaryDisplay().workAreaSize;

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
        preload: path.join(__dirname, 'preload.js'),
      },
    });
    // this.window.webContents.openDevTools();

    // Load the React app
    if (process.env.NODE_ENV === 'development') {
      this.window.loadFile(path.join(__dirname, 'index.html'));
      this.window.webContents.openDevTools({ mode: 'detach' });
    } else {
      this.window.loadFile(path.join(__dirname, 'index.html'));
    }

    // Removed auto-hide on blur for better usability

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
        await this.updateTrayTitle();
        return stats;
      } catch (error) {
        console.error('Error refreshing data:', error);
        throw error;
      }
    });

    ipcMain.handle('quit-app', () => {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      if (this.displayInterval) {
        clearInterval(this.displayInterval);
      }
      app.quit();
    });

    ipcMain.handle('take-screenshot', async () => {
      return this.takeScreenshot();
    });

    ipcMain.handle('update-menu-bar-display', async (event, mode: 'off' | 'percentage' | 'value' | 'all') => {
      this.menuBarDisplayMode = mode;
      
      // Clear the display toggle interval if switching away from 'all' mode
      if (mode !== 'all' && this.displayInterval) {
        clearInterval(this.displayInterval);
        this.displayInterval = null;
      }
      
      // Restart the display toggle if switching to 'all' mode
      if (mode === 'all' && !this.displayInterval) {
        this.startDisplayToggle();
      }
      
      this.updateTrayDisplay();
    });
  }

  private startUsagePolling() {
    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.updateTrayTitle();

      // Notify renderer if window is open
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('usage-updated');
      }
    }, 30000);

    // Initial update
    setTimeout(() => this.updateTrayTitle(), 1000);
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

  private async takeScreenshot() {
    try {
      if (!this.window) {
        throw new Error('Window not available');
      }

      const image = await this.window.webContents.capturePage();
      const filepath = this.createScreenshotPath();

      fs.writeFileSync(filepath, image.toPNG());

      return {
        success: true,
        filename: path.basename(filepath),
        filepath,
        message: `Screenshot saved to ${filepath}`,
      };
    } catch (error) {
      console.error('Screenshot error:', error);
      return {
        success: false,
        error: this.getScreenshotErrorMessage(error),
      };
    }
  }

  private createScreenshotPath(): string {
    // Cross-platform screenshots directory
    const picturesDir = process.platform === 'win32' 
      ? path.join(os.homedir(), 'Pictures')
      : process.platform === 'darwin'
      ? path.join(os.homedir(), 'Pictures')
      : path.join(os.homedir(), 'Pictures'); // Linux typically has Pictures too
    
    const screenshotsDir = path.join(picturesDir, 'CCSeva-Screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `CCSeva-Screenshot-${timestamp}.png`;
    return path.join(screenshotsDir, filename);
  }

  private getScreenshotErrorMessage(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Unknown screenshot error';
    }

    if (error.message.includes('capturePage')) {
      return 'Failed to capture window content. Please make sure the window is visible.';
    }
    if (error.message.includes('ENOENT') || error.message.includes('directory')) {
      return 'Failed to create screenshots directory. Please check permissions.';
    }
    if (error.message.includes('EACCES')) {
      return 'Permission denied. Please check file system permissions.';
    }
    return error.message;
  }
}

// Initialize the app
const ccSevaApp = new CCSevaApp();
ccSevaApp.initialize().catch(console.error);
