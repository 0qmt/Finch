const { app, BrowserWindow, Menu, dialog, ipcMain, shell, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

const isDev = !app.isPackaged;
const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
let mainWindow = null;
let updateStatus = {
  state: 'idle',
  currentVersion: app.getVersion() || packageJson.version
};

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowPrerelease = false;

function getDataFilePath() {
  return path.join(app.getPath('userData'), 'finch-data.json');
}

function ensureDataDirectory() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
}

function readDataFile() {
  const dataFilePath = getDataFilePath();

  if (!fs.existsSync(dataFilePath)) {
    return null;
  }

  const content = fs.readFileSync(dataFilePath, 'utf8');
  return JSON.parse(content);
}

function writeDataFile(data) {
  ensureDataDirectory();

  const dataFilePath = getDataFilePath();
  const tempFilePath = `${dataFilePath}.tmp`;
  const payload = JSON.stringify(data, null, 2);

  fs.writeFileSync(tempFilePath, payload, 'utf8');
  fs.renameSync(tempFilePath, dataFilePath);

  return dataFilePath;
}

function formatDateForFileName() {
  return new Date().toISOString().slice(0, 10);
}

function getAdaptiveZoomFactor() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  if (width <= 1280 || height <= 720) return 0.86;
  if (width <= 1366 || height <= 780) return 0.9;
  if (width <= 1440 || height <= 850) return 0.94;

  return 1;
}

function sendUpdateEvent(payload) {
  updateStatus = {
    ...updateStatus,
    ...payload,
    currentVersion: app.getVersion() || packageJson.version
  };

  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('finch:update:event', updateStatus);
  });
}

function formatUpdateInfo(info = {}) {
  return {
    version: info.version,
    releaseName: info.releaseName || info.version,
    releaseDate: info.releaseDate
  };
}

ipcMain.handle('finch:data:load', () => {
  try {
    return {
      ok: true,
      data: readDataFile(),
      path: getDataFilePath()
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      path: getDataFilePath()
    };
  }
});

ipcMain.handle('finch:data:save', (_event, data) => {
  try {
    return {
      ok: true,
      path: writeDataFile(data)
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle('finch:data:export-backup', async (_event, data) => {
  const result = await dialog.showSaveDialog({
    title: 'Salvar backup do finch',
    defaultPath: `finch-backup-${formatDateForFileName()}.json`,
    filters: [{ name: 'Backup JSON', extensions: ['json'] }]
  });

  if (result.canceled || !result.filePath) {
    return { ok: true, canceled: true };
  }

  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');
    return {
      ok: true,
      canceled: false,
      path: result.filePath
    };
  } catch (error) {
    return {
      ok: false,
      canceled: false,
      error: error.message
    };
  }
});

autoUpdater.on('checking-for-update', () => {
  sendUpdateEvent({ state: 'checking', error: '' });
});

autoUpdater.on('update-available', (info) => {
  sendUpdateEvent({
    state: 'available',
    updateInfo: formatUpdateInfo(info),
    progress: null,
    error: ''
  });
});

autoUpdater.on('update-not-available', (info) => {
  sendUpdateEvent({
    state: 'not-available',
    updateInfo: formatUpdateInfo(info),
    progress: null,
    error: ''
  });
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateEvent({
    state: 'downloading',
    progress: {
      percent: Math.max(0, Math.min(100, progress.percent || 0)),
      transferred: progress.transferred || 0,
      total: progress.total || 0,
      bytesPerSecond: progress.bytesPerSecond || 0
    },
    error: ''
  });
});

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateEvent({
    state: 'downloaded',
    updateInfo: formatUpdateInfo(info),
    progress: {
      percent: 100,
      transferred: 0,
      total: 0,
      bytesPerSecond: 0
    },
    error: ''
  });
});

autoUpdater.on('error', (error) => {
  sendUpdateEvent({
    state: 'error',
    error: error.message || 'Nao foi possivel atualizar agora.'
  });
});

ipcMain.handle('finch:update:status', () => updateStatus);

ipcMain.handle('finch:update:check', async () => {
  if (isDev) {
    return {
      ok: true,
      state: 'dev',
      updateAvailable: false,
      currentVersion: packageJson.version,
      message: 'Atualizacoes automaticas funcionam apenas no app instalado.'
    };
  }

  try {
    sendUpdateEvent({ state: 'checking', error: '' });
    await autoUpdater.checkForUpdates();
    return { ok: true, ...updateStatus };
  } catch (error) {
    return {
      ok: false,
      ...updateStatus,
      error: error.message
    };
  }
});

ipcMain.handle('finch:update:download', async () => {
  if (isDev) {
    return { ok: false, error: 'Atualizacoes automaticas funcionam apenas no app instalado.' };
  }

  try {
    sendUpdateEvent({ state: 'downloading', progress: { percent: 0 } });
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('finch:update:install-now', () => {
  autoUpdater.quitAndInstall(false, true);
  return { ok: true };
});

ipcMain.handle('finch:update:install-on-quit', () => {
  autoUpdater.autoInstallOnAppQuit = true;
  sendUpdateEvent({ state: 'install-on-quit' });
  return { ok: true };
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 620,
    title: 'finch',
    icon: iconPath,
    backgroundColor: '#f5f5f7',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.webContents.setZoomFactor(getAdaptiveZoomFactor());
    mainWindow.show();
  });

  mainWindow.on('resize', () => {
    mainWindow.webContents.setZoomFactor(getAdaptiveZoomFactor());
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && process.env.FINCH_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.FINCH_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
