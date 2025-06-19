const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  getUsageStats: () => ipcRenderer.invoke('get-usage-stats'),
  refreshData: () => ipcRenderer.invoke('refresh-data'),
  onUsageUpdated: (callback: () => void) => ipcRenderer.on('usage-updated', callback),
  removeUsageUpdatedListener: (callback: () => void) => ipcRenderer.removeListener('usage-updated', callback)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);