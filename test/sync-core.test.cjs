const test = require('node:test');
const assert = require('node:assert/strict');
const {
  stableStringify,
  sha256,
  createEntityChecksum,
  buildFinchSnapshot,
  compareFinchSnapshots,
  isExpired
} = require('../electron/sync/finch-sync-core.cjs');
const { maskToken } = require('../electron/sync/sync-logger.cjs');

test('stableStringify keeps object keys deterministic', () => {
  assert.equal(stableStringify({ b: 2, a: 1 }), stableStringify({ a: 1, b: 2 }));
});

test('checksum changes when normalized entity content changes', () => {
  const first = createEntityChecksum({ id: 'tx-1', title: 'Mercado', amount: 30 });
  const second = createEntityChecksum({ id: 'tx-1', title: 'Mercado', amount: 31 });

  assert.notEqual(first, second);
  assert.equal(first.length, 64);
  assert.equal(sha256('finch').length, 64);
});

test('compare snapshots detects desktop only and mobile only entities', () => {
  const desktop = buildFinchSnapshot(
    {
      settings: { categories: ['Mercado'], accounts: ['Nubank'] },
      transactions: [{ id: 'tx-desktop', title: 'Desktop', amount: 10 }],
      purchases: [],
      goals: []
    },
    { id: 'desktop', name: 'Desktop' }
  );
  const mobile = buildFinchSnapshot(
    {
      settings: { categories: ['Mercado'], accounts: ['Nubank'] },
      transactions: [{ id: 'tx-mobile', title: 'Mobile', amount: 20 }],
      purchases: [],
      goals: []
    },
    { id: 'mobile', name: 'Mobile' }
  );

  const comparison = compareFinchSnapshots(desktop, mobile);
  assert.ok(comparison.desktopOnly.some((item) => item.id === 'tx-desktop'));
  assert.ok(comparison.mobileOnly.some((item) => item.id === 'tx-mobile'));
});

test('compare snapshots marks shared changed entities as conflicts', () => {
  const base = {
    settings: { categories: ['Mercado'], accounts: ['Nubank'] },
    transactions: [{ id: 'tx-shared', title: 'Compra', amount: 10 }],
    purchases: [],
    goals: []
  };
  const desktop = buildFinchSnapshot(base, { id: 'desktop', name: 'Desktop' });
  const mobile = buildFinchSnapshot(
    {
      ...base,
      transactions: [{ id: 'tx-shared', title: 'Compra editada', amount: 10 }]
    },
    { id: 'mobile', name: 'Mobile' }
  );

  const comparison = compareFinchSnapshots(desktop, mobile);
  assert.equal(comparison.different.length, 1);
  assert.equal(comparison.possibleConflicts.length, 1);
});

test('maskToken hides temporary pairing token', () => {
  assert.equal(maskToken('abcdef123456'), 'abcd...3456');
});

test('expired payload is detected', () => {
  assert.equal(isExpired(new Date(Date.now() - 1000).toISOString()), true);
  assert.equal(isExpired(new Date(Date.now() + 1000).toISOString()), false);
});
