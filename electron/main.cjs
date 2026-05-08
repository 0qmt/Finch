const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

const isDev = !app.isPackaged;
const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
const githubPublishConfig = Array.isArray(packageJson.build?.publish)
  ? packageJson.build.publish.find((item) => item.provider === 'github')
  : null;
const updateRepository = {
  owner: githubPublishConfig?.owner || '0qmt',
  repo: githubPublishConfig?.repo || 'Finch'
};

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

function normalizeVersion(version) {
  return String(version || '0.0.0').replace(/^v/i, '').split('-')[0];
}

function compareVersions(left, right) {
  const leftParts = normalizeVersion(left).split('.').map((part) => Number(part) || 0);
  const rightParts = normalizeVersion(right).split('.').map((part) => Number(part) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;

    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}

function getInstallerAsset(assets = []) {
  return assets.find((asset) => /\.(exe|msi)$/i.test(asset.name)) || assets[0] || null;
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

ipcMain.handle('finch:update:check', async () => {
  const currentVersion = app.getVersion() || packageJson.version;

  if (!updateRepository.owner || !updateRepository.repo) {
    return {
      ok: true,
      configured: false,
      updateAvailable: false,
      currentVersion
    };
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${updateRepository.owner}/${updateRepository.repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `finch/${currentVersion}`
      }
    });

    if (response.status === 404) {
      return {
        ok: true,
        configured: true,
        updateAvailable: false,
        currentVersion,
        message: 'Nenhuma release publicada ainda.'
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        configured: true,
        updateAvailable: false,
        currentVersion,
        error: `GitHub respondeu com ${response.status}.`
      };
    }

    const release = await response.json();
    const latestVersion = normalizeVersion(release.tag_name || release.name);
    const installer = getInstallerAsset(release.assets);
    const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

    return {
      ok: true,
      configured: true,
      updateAvailable,
      currentVersion,
      latestVersion,
      releaseName: release.name || release.tag_name,
      releaseUrl: release.html_url,
      downloadUrl: installer?.browser_download_url || release.html_url
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      updateAvailable: false,
      currentVersion,
      error: error.message
    };
  }
});

ipcMain.handle('finch:update:open-download', async (_event, url) => {
  if (!url || !/^https:\/\/github\.com\//i.test(url)) {
    return { ok: false, error: 'Link de atualizacao invalido.' };
  }

  await shell.openExternal(url);
  return { ok: true };
});

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 680,
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

  window.once('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && process.env.FINCH_DEV_SERVER_URL) {
    window.loadURL(process.env.FINCH_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
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
