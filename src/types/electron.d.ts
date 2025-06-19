export interface ElectronAPI {
  getUsageStats: () => Promise<any>;
  refreshData: () => Promise<any>;
  quitApp: () => Promise<void>;
  onUsageUpdated: (callback: () => void) => void;
  removeUsageUpdatedListener: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}