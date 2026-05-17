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

contextBridge.exposeInMainWorld('finchDriveSync', {
  connect: () => ipcRenderer.invoke('finch:drive-sync:connect'),
  disconnect: () => ipcRenderer.invoke('finch:drive-sync:disconnect'),
  getStatus: () => ipcRenderer.invoke('finch:drive-sync:get-status'),
  syncNow: (data) => ipcRenderer.invoke('finch:drive-sync:sync-now', data),
  useLocal: (data) => ipcRenderer.invoke('finch:drive-sync:use-local', data),
  useRemote: (data) => ipcRenderer.invoke('finch:drive-sync:use-remote', data),
  onEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('finch:drive-sync:event', listener);
    return () => ipcRenderer.removeListener('finch:drive-sync:event', listener);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.desktop = 'true';
});
