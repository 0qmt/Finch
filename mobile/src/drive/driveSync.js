import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

const CACHE_FILE = `${FileSystem.documentDirectory}finch-mobile-cache.json`;
const TOKEN_FILE = `${FileSystem.documentDirectory}finch-google-token.json`;
const DEVICE_FILE = `${FileSystem.documentDirectory}finch-mobile-device.json`;
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FINCH_MIME = 'application/json';

function nowIso() {
  return new Date().toISOString();
}

function safeJson(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function normalizeForChecksum(data) {
  return {
    settings: data?.settings || {},
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    purchases: Array.isArray(data?.purchases) ? data.purchases : [],
    goals: Array.isArray(data?.goals) ? data.goals : []
  };
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function checksum(data) {
  const input = stableStringify(normalizeForChecksum(data));
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

async function fileExists(path) {
  return (await FileSystem.getInfoAsync(path)).exists;
}

async function readJsonFile(path) {
  if (!(await fileExists(path))) return null;
  return safeJson(await FileSystem.readAsStringAsync(path));
}

async function writeJsonFile(path, data) {
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
}

export async function saveLocalCache(data) {
  await writeJsonFile(CACHE_FILE, data);
  return { ok: true };
}

export async function loadLocalCache() {
  return readJsonFile(CACHE_FILE);
}

export async function saveToken(token) {
  await writeJsonFile(TOKEN_FILE, token);
  return token;
}

export async function loadToken() {
  return readJsonFile(TOKEN_FILE);
}

export async function clearToken() {
  if (await fileExists(TOKEN_FILE)) await FileSystem.deleteAsync(TOKEN_FILE);
}

export async function getDevice() {
  const saved = await readJsonFile(DEVICE_FILE);
  if (saved?.id) return saved;
  const device = {
    id: `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: 'Finch Mobile',
    platform: 'android',
    createdAt: nowIso()
  };
  await writeJsonFile(DEVICE_FILE, device);
  return device;
}

function authHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

async function driveRequest(accessToken, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(accessToken),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? safeJson(text, text) : null;
  if (!response.ok) {
    const message = body?.error?.message || body || `Erro Google Drive ${response.status}`;
    throw new Error(String(message));
  }
  return body;
}

function q(value) {
  return String(value).replace(/'/g, "\\'");
}

async function findFile(accessToken, { name, parentId, mimeType }) {
  const filters = [
    `name='${q(name)}'`,
    'trashed=false',
    parentId ? `'${q(parentId)}' in parents` : null,
    mimeType ? `mimeType='${q(mimeType)}'` : null
  ].filter(Boolean);
  const params = new URLSearchParams({
    q: filters.join(' and '),
    fields: 'files(id,name,mimeType,modifiedTime,size)'
  });
  const result = await driveRequest(accessToken, `${DRIVE_API}/files?${params.toString()}`);
  return result.files?.[0] || null;
}

async function createFolder(accessToken, name, parentId) {
  return driveRequest(accessToken, `${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    })
  });
}

async function ensureFolder(accessToken, name, parentId) {
  const existing = await findFile(accessToken, {
    name,
    parentId,
    mimeType: 'application/vnd.google-apps.folder'
  });
  return existing || createFolder(accessToken, name, parentId);
}

async function ensureStructure(accessToken) {
  const root = await ensureFolder(accessToken, 'Finch');
  const backups = await ensureFolder(accessToken, 'backups', root.id);
  const attachments = await ensureFolder(accessToken, 'attachments', root.id);
  return { root, backups, attachments };
}

async function readDriveJson(accessToken, name, parentId) {
  const file = await findFile(accessToken, { name, parentId });
  if (!file) return null;
  const data = await driveRequest(accessToken, `${DRIVE_API}/files/${file.id}?alt=media`);
  return { file, data };
}

async function uploadDriveJson(accessToken, name, parentId, data, existingId) {
  const metadata = {
    name,
    mimeType: FINCH_MIME,
    parents: existingId ? undefined : [parentId]
  };
  const boundary = `finch-${Date.now()}`;
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(data, null, 2),
    `--${boundary}--`
  ].join('\r\n');
  const url = existingId
    ? `${DRIVE_UPLOAD}/files/${existingId}?uploadType=multipart&fields=id,name,modifiedTime,size`
    : `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id,name,modifiedTime,size`;
  return driveRequest(accessToken, url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  });
}

async function addMetadata(data, device, previousRevision = 0) {
  return {
    ...data,
    syncMetadata: {
      syncVersion: 1,
      lastModifiedAt: nowIso(),
      lastModifiedBy: device.id,
      deviceId: device.id,
      revision: Number(previousRevision || 0) + 1,
      checksum: await checksum(data)
    }
  };
}

async function updateDevices(accessToken, rootId, device) {
  const file = await readDriveJson(accessToken, 'devices.json', rootId);
  const devices = Array.isArray(file?.data?.devices) ? file.data.devices : [];
  const nextDevices = [
    ...devices.filter((item) => item.id !== device.id),
    {
      ...device,
      appVersion: '1.0.0',
      lastSeenAt: nowIso()
    }
  ];
  await uploadDriveJson(
    accessToken,
    'devices.json',
    rootId,
    { syncVersion: 1, updatedAt: nowIso(), devices: nextDevices },
    file?.file?.id
  );
  return nextDevices;
}

export async function getDriveStatus(accessToken) {
  if (!accessToken) {
    return { state: 'not-connected', message: 'Google Drive não conectado.' };
  }
  const structure = await ensureStructure(accessToken);
  const device = await getDevice();
  const devices = await updateDevices(accessToken, structure.root.id, device);
  const remote = await readDriveJson(accessToken, 'data.json', structure.root.id);
  return {
    state: 'connected',
    message: remote ? 'Google Drive conectado.' : 'Google Drive conectado. Aguardando primeiro envio.',
    devices,
    remoteRevision: Number(remote?.data?.syncMetadata?.revision || 0),
    lastSyncAt: remote?.data?.syncMetadata?.lastModifiedAt || ''
  };
}

export async function syncWithGoogleDrive({ data, accessToken, force = 'auto' }) {
  await saveLocalCache(data);

  if (!accessToken) {
    return {
      ok: false,
      cached: true,
      state: 'not-connected',
      message: 'Entre com sua conta Google para sincronizar.'
    };
  }

  const structure = await ensureStructure(accessToken);
  const device = await getDevice();
  const devices = await updateDevices(accessToken, structure.root.id, device);
  const remote = await readDriveJson(accessToken, 'data.json', structure.root.id);
  const remoteData = remote?.data || null;
  const remoteRevision = Number(remoteData?.syncMetadata?.revision || 0);
  const localRevision = Number(data?.syncMetadata?.revision || 0);
  const localChecksum = await checksum(data);
  const remoteChecksum = remoteData?.syncMetadata?.checksum || '';
  const hasLocalSync = Boolean(data?.syncMetadata);

  if (remoteData && (!hasLocalSync || force === 'remote')) {
    await saveLocalCache(remoteData);
    return {
      ok: true,
      cached: true,
      state: 'synced',
      message: 'Dados baixados do Google Drive.',
      downloadedData: remoteData,
      devices,
      lastSyncAt: nowIso(),
      remoteRevision
    };
  }

  if (remoteData && remoteRevision > localRevision && remoteChecksum !== localChecksum && force === 'auto') {
    return {
      ok: false,
      cached: true,
      state: 'conflict',
      message: 'Conflito detectado. Escolha a versão do celular ou da nuvem.',
      remoteData,
      devices,
      conflict: { remoteRevision, localRevision }
    };
  }

  if (remoteData && force !== 'remote') {
    await uploadDriveJson(
      accessToken,
      `backup-${nowIso().replace(/[:.]/g, '-')}.json`,
      structure.backups.id,
      remoteData
    );
  }

  const nextData = await addMetadata(data, device, Math.max(localRevision, remoteRevision));
  const uploaded = await uploadDriveJson(accessToken, 'data.json', structure.root.id, nextData, remote?.file?.id);
  await uploadDriveJson(
    accessToken,
    'sync-log.json',
    structure.root.id,
    {
      syncVersion: 1,
      updatedAt: nowIso(),
      latest: {
        type: 'sync',
        deviceId: device.id,
        dataFileId: uploaded.id,
        revision: nextData.syncMetadata.revision
      }
    },
    (await readDriveJson(accessToken, 'sync-log.json', structure.root.id))?.file?.id
  );

  await saveLocalCache(nextData);
  return {
    ok: true,
    cached: true,
    state: 'synced',
    message: 'Dados sincronizados com o Google Drive.',
    uploadedData: nextData,
    devices,
    lastSyncAt: nowIso(),
    remoteRevision: nextData.syncMetadata.revision
  };
}
