const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { FinchDriveApi } = require('./drive-api.cjs');
const { connectGoogleDrive, disconnectGoogleDrive, getAuthenticatedClient, getOAuthConfig } = require('./drive-auth.cjs');
const { stableStringify, sha256 } = require('../sync/finch-sync-core.cjs');

const DEVICE_FILE = 'finch-device.json';

function nowIso() {
  return new Date().toISOString();
}

function getDevice(userDataPath) {
  const filePath = path.join(userDataPath, DEVICE_FILE);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const device = {
    id: crypto.randomUUID(),
    name: 'Finch Desktop',
    platform: process.platform,
    createdAt: nowIso()
  };
  fs.writeFileSync(filePath, JSON.stringify(device, null, 2), 'utf8');
  return device;
}

function withMetadata(data, device, previousRevision = 0) {
  return {
    ...data,
    syncMetadata: {
      syncVersion: 1,
      lastModifiedAt: nowIso(),
      lastModifiedBy: device.id,
      deviceId: device.id,
      revision: Number(previousRevision || 0) + 1,
      checksum: sha256(stableStringify({
        settings: data.settings,
        transactions: data.transactions,
        purchases: data.purchases,
        goals: data.goals
      }))
    }
  };
}

function createStatus(extra = {}) {
  return {
    ok: true,
    connected: false,
    state: 'not-connected',
    lastSyncAt: '',
    lastBackupAt: '',
    devices: [],
    backups: [],
    conflict: null,
    cloudStatus: 'Google Drive nao conectado',
    ...extra
  };
}

class FinchDriveSync {
  constructor({ userDataPath, shell }) {
    this.userDataPath = userDataPath;
    this.shell = shell;
    this.status = createStatus({
      device: getDevice(userDataPath),
      needsConfig: !getOAuthConfig(userDataPath).ok
    });
  }

  getAuth() {
    return getAuthenticatedClient(this.userDataPath);
  }

  async getApi() {
    const auth = this.getAuth();
    if (!auth.ok) {
      return auth;
    }
    return { ok: true, api: new FinchDriveApi(auth.auth) };
  }

  async connect() {
    const authResult = await connectGoogleDrive({
      userDataPath: this.userDataPath,
      shell: this.shell
    });
    if (!authResult.ok) {
      this.status = createStatus({ ...this.status, ...authResult, state: 'needs-config' });
      return this.status;
    }

    await this.ensureRemoteState();
    return this.getStatus();
  }

  disconnect() {
    disconnectGoogleDrive(this.userDataPath);
    this.status = createStatus({ device: getDevice(this.userDataPath) });
    return this.status;
  }

  async ensureRemoteState() {
    const apiResult = await this.getApi();
    if (!apiResult.ok) {
      this.status = createStatus({
        ...this.status,
        connected: false,
        state: apiResult.needsConfig ? 'needs-config' : 'not-connected',
        needsConfig: apiResult.needsConfig,
        cloudStatus: apiResult.error
      });
      return this.status;
    }

    const api = apiResult.api;
    const structure = await api.ensureStructure();
    const device = getDevice(this.userDataPath);
    const devicesFile = await api.readJsonFile('devices.json', structure.root.id);
    const devices = Array.isArray(devicesFile?.data?.devices) ? devicesFile.data.devices : [];
    const nextDevices = [
      ...devices.filter((item) => item.id !== device.id),
      {
        ...device,
        appVersion: require('../../package.json').version,
        lastSeenAt: nowIso()
      }
    ];

    await api.upsertJsonFile('devices.json', structure.root.id, {
      syncVersion: 1,
      updatedAt: nowIso(),
      devices: nextDevices
    });

    const backups = await api.listFiles(structure.backups.id);
    this.status = createStatus({
      connected: true,
      state: 'connected',
      cloudStatus: 'Conectado ao Google Drive',
      device,
      devices: nextDevices,
      backups,
      folders: {
        rootId: structure.root.id,
        backupsId: structure.backups.id,
        attachmentsId: structure.attachments.id
      }
    });

    return this.status;
  }

  async getStatus() {
    return this.ensureRemoteState().catch(() => this.status);
  }

  async syncNow(localData, { force = 'auto' } = {}) {
    const apiResult = await this.getApi();
    if (!apiResult.ok) {
      return createStatus({
        ...this.status,
        ok: false,
        state: apiResult.needsConfig ? 'needs-config' : 'not-connected',
        needsConfig: apiResult.needsConfig,
        cloudStatus: apiResult.error
      });
    }

    const api = apiResult.api;
    const structure = await api.ensureStructure();
    const device = getDevice(this.userDataPath);
    const remoteFile = await api.readJsonFile('data.json', structure.root.id);
    const remoteData = remoteFile?.data || null;
    const remoteRevision = Number(remoteData?.syncMetadata?.revision || 0);
    const localRevision = Number(localData?.syncMetadata?.revision || 0);
    const remoteChecksum = remoteData?.syncMetadata?.checksum || '';
    const localChecksum = sha256(stableStringify({
      settings: localData.settings,
      transactions: localData.transactions,
      purchases: localData.purchases,
      goals: localData.goals
    }));

    if (remoteData && remoteRevision > localRevision && remoteChecksum !== localChecksum && force === 'auto') {
      this.status = createStatus({
        ...this.status,
        connected: true,
        state: 'conflict',
        cloudStatus: 'Conflito detectado',
        conflict: {
          remoteRevision,
          localRevision,
          remoteModifiedAt: remoteData.syncMetadata?.lastModifiedAt,
          message: 'Existem alteracoes na nuvem diferentes dos dados locais.'
        },
        remoteData
      });
      return this.status;
    }

    if (remoteData) {
      await api.upsertJsonFile(`backup-${nowIso().replace(/[:.]/g, '-')}.json`, structure.backups.id, remoteData);
    }

    if (force === 'remote' && remoteData) {
      this.status = createStatus({
        ...this.status,
        connected: true,
        state: 'synced',
        lastSyncAt: nowIso(),
        cloudStatus: 'Dados baixados da nuvem',
        downloadedData: remoteData
      });
      return this.status;
    }

    const nextData = withMetadata(localData, device, Math.max(localRevision, remoteRevision));
    const dataFile = await api.upsertJsonFile('data.json', structure.root.id, nextData);
    await api.upsertJsonFile('sync-log.json', structure.root.id, {
      syncVersion: 1,
      updatedAt: nowIso(),
      latest: {
        type: 'sync',
        deviceId: device.id,
        dataFileId: dataFile.id,
        revision: nextData.syncMetadata.revision
      }
    });

    const latestStatus = await this.ensureRemoteState();
    this.status = {
      ...latestStatus,
      state: 'synced',
      lastSyncAt: nowIso(),
      lastBackupAt: remoteData ? nowIso() : '',
      cloudStatus: 'Dados sincronizados',
      uploadedData: nextData
    };
    return this.status;
  }
}

module.exports = {
  FinchDriveSync,
  withMetadata
};
