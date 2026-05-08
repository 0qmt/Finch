const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('finchStorage', {
  loadData: () => ipcRenderer.invoke('finch:data:load'),
  saveData: (data) => ipcRenderer.invoke('finch:data:save', data),
  exportBackup: (data) => ipcRenderer.invoke('finch:data:export-backup', data)
});

contextBridge.exposeInMainWorld('finchUpdates', {
  checkForUpdates: () => ipcRenderer.invoke('finch:update:check'),
  openDownload: (url) => ipcRenderer.invoke('finch:update:open-download', url)
});

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.desktop = 'true';
});
