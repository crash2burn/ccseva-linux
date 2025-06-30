export interface ScreenshotResult {
  success: boolean;
  filename?: string;
  filepath?: string;
  message?: string;
  error?: string;
}

export interface ElectronAPI {
  getUsageStats: () => Promise<any>;
  refreshData: () => Promise<any>;
  quitApp: () => Promise<void>;
  takeScreenshot: () => Promise<ScreenshotResult>;
  updateMenuBarDisplay: (mode: 'off' | 'percentage' | 'value' | 'all') => Promise<void>;
  onUsageUpdated: (callback: () => void) => void;
  removeUsageUpdatedListener: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}