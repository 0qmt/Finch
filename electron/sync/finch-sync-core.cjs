const crypto = require('crypto');

const PROTOCOL = 'finch-local-sync-poc';
const PROTOCOL_VERSION = 1;

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function normalizeForSnapshot(value) {
  if (!value || typeof value !== 'object') return value;

  const normalized = {};
  Object.entries(value).forEach(([key, item]) => {
    if (['image', 'link', 'notes'].includes(key)) return;
    normalized[key] = item;
  });
  return normalized;
}

function createEntityChecksum(entity) {
  return sha256(stableStringify(normalizeForSnapshot(entity)));
}

function safeLabel(value, fallback = 'Sem nome') {
  const text = String(value || fallback).trim();
  return text.length > 48 ? `${text.slice(0, 45)}...` : text;
}

function summarizeEntity(entityType, entity) {
  const labels = {
    transactions: entity.title,
    purchases: entity.name,
    goals: entity.title,
    categories: entity.name || entity.id,
    accounts: entity.name || entity.id,
    settings: entity.id
  };

  return {
    entityType,
    id: String(entity.id),
    label: safeLabel(labels[entityType], entity.id),
    status: String(entity.status || entity.type || 'active'),
    checksum: createEntityChecksum(entity),
    summaryDate: entity.date || entity.createdAt || entity.deadline || ''
  };
}

function buildFinchSnapshot(data = {}, device = {}) {
  const settings = data.settings || {};
  const transactions = Array.isArray(data.transactions) ? data.transactions : [];
  const purchases = Array.isArray(data.purchases) ? data.purchases : [];
  const goals = Array.isArray(data.goals) ? data.goals : [];
  const categories = Array.isArray(settings.categories) ? settings.categories : [];
  const accounts = Array.isArray(settings.accounts) ? settings.accounts : [];

  const entities = [
    ...transactions.map((item) => summarizeEntity('transactions', item)),
    ...purchases.map((item) => summarizeEntity('purchases', item)),
    ...goals.map((item) => summarizeEntity('goals', item)),
    ...categories.map((name) => summarizeEntity('categories', { id: name, name })),
    ...accounts.map((name) => summarizeEntity('accounts', { id: name, name })),
    summarizeEntity('settings', {
      id: 'settings',
      theme: settings.theme,
      salaryIsVariable: settings.salaryIsVariable,
      planningGoal: settings.planningGoal,
      monthlyBudgetEnabled: Number(settings.monthlyBudget || 0) > 0,
      categoriesCount: categories.length,
      accountsCount: accounts.length
    })
  ];

  const counts = entities.reduce(
    (acc, entity) => {
      acc[entity.entityType] = (acc[entity.entityType] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0 }
  );

  return {
    protocol: PROTOCOL,
    protocolVersion: PROTOCOL_VERSION,
    mode: 'dry-run',
    device: {
      id: device.id || crypto.randomUUID(),
      name: device.name || 'Finch Device',
      platform: device.platform || 'unknown'
    },
    createdAt: new Date().toISOString(),
    counts,
    entities,
    checksum: sha256(stableStringify(entities))
  };
}

function entityKey(entity) {
  return `${entity.entityType}:${entity.id}`;
}

function compareFinchSnapshots(desktopSnapshot, mobileSnapshot) {
  const desktopMap = new Map((desktopSnapshot.entities || []).map((entity) => [entityKey(entity), entity]));
  const mobileMap = new Map((mobileSnapshot.entities || []).map((entity) => [entityKey(entity), entity]));
  const desktopOnly = [];
  const mobileOnly = [];
  const different = [];

  desktopMap.forEach((desktopEntity, key) => {
    const mobileEntity = mobileMap.get(key);
    if (!mobileEntity) {
      desktopOnly.push(desktopEntity);
      return;
    }

    if (desktopEntity.checksum !== mobileEntity.checksum) {
      different.push({
        key,
        entityType: desktopEntity.entityType,
        id: desktopEntity.id,
        desktop: desktopEntity,
        mobile: mobileEntity
      });
    }
  });

  mobileMap.forEach((mobileEntity, key) => {
    if (!desktopMap.has(key)) {
      mobileOnly.push(mobileEntity);
    }
  });

  const possibleConflicts = different.filter((item) =>
    ['transactions', 'purchases', 'goals', 'settings'].includes(item.entityType)
  );

  return {
    desktopOnly,
    mobileOnly,
    different,
    possibleConflicts,
    simulatedConflicts: possibleConflicts.slice(0, 5)
  };
}

function createDryRunReport(desktopSnapshot, mobileSnapshot) {
  const comparison = compareFinchSnapshots(desktopSnapshot, mobileSnapshot);

  return {
    protocol: PROTOCOL,
    protocolVersion: PROTOCOL_VERSION,
    mode: 'dry-run',
    generatedAt: new Date().toISOString(),
    desktop: {
      device: desktopSnapshot.device,
      counts: desktopSnapshot.counts,
      checksum: desktopSnapshot.checksum
    },
    mobile: {
      device: mobileSnapshot.device,
      counts: mobileSnapshot.counts,
      checksum: mobileSnapshot.checksum
    },
    ...comparison,
    summary: {
      desktopMainRecords:
        (desktopSnapshot.counts.transactions || 0) + (desktopSnapshot.counts.purchases || 0) + (desktopSnapshot.counts.goals || 0),
      mobileMainRecords:
        (mobileSnapshot.counts.transactions || 0) + (mobileSnapshot.counts.purchases || 0) + (mobileSnapshot.counts.goals || 0),
      wouldSendToMobile: comparison.desktopOnly.length,
      wouldReceiveFromMobile: comparison.mobileOnly.length,
      conflicts: comparison.possibleConflicts.length
    },
    message: 'Dry-run finalizado. Nenhum dado foi alterado.'
  };
}

function createEnvelope(type, payload = {}, requestId = crypto.randomUUID()) {
  return {
    type,
    protocol: PROTOCOL,
    protocolVersion: PROTOCOL_VERSION,
    requestId,
    sentAt: new Date().toISOString(),
    payload
  };
}

function validateEnvelope(message) {
  return Boolean(
    message &&
      message.protocol === PROTOCOL &&
      message.protocolVersion === PROTOCOL_VERSION &&
      typeof message.type === 'string' &&
      message.payload &&
      typeof message.payload === 'object'
  );
}

function isExpired(value) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

module.exports = {
  PROTOCOL,
  PROTOCOL_VERSION,
  stableStringify,
  sha256,
  normalizeForSnapshot,
  createEntityChecksum,
  buildFinchSnapshot,
  compareFinchSnapshots,
  createDryRunReport,
  createEnvelope,
  validateEnvelope,
  isExpired
};
