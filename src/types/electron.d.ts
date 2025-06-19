export interface ElectronAPI {
  getUsageStats: () => Promise<any>;
  refreshData: () => Promise<any>;
  onUsageUpdated: (callback: () => void) => void;
  removeUsageUpdatedListener: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}