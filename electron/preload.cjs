const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('finchStorage', {
  loadData: () => ipcRenderer.invoke('finch:data:load'),
  saveData: (data) => ipcRenderer.invoke('finch:data:save', data),
  exportBackup: (data) => ipcRenderer.invoke('finch:data:export-backup', data)
});

contextBridge.exposeInMainWorld('finchUpdates', {
  getStatus: () => ipcRenderer.invoke('finch:update:status'),
  checkForUpdates: () => ipcRenderer.invoke('finch:update:check'),
  downloadUpdate: () => ipcRenderer.invoke('finch:update:download'),
  installNow: () => ipcRenderer.invoke('finch:update:install-now'),
  installOnQuit: () => ipcRenderer.invoke('finch:update:install-on-quit'),
  onUpdateEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('finch:update:event', listener);
    return () => ipcRenderer.removeListener('finch:update:event', listener);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.desktop = 'true';
});
