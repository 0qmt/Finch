const crypto = require('crypto');

function maskToken(value = '') {
  const text = String(value || '');
  if (text.length <= 10) return text ? `${text.slice(0, 2)}...` : '';
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

class SyncLogger {
  constructor(limit = 160) {
    this.limit = limit;
    this.logs = [];
  }

  add(direction, type, title, message = '') {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      direction,
      type,
      title,
      message
    };

    this.logs = [entry, ...this.logs].slice(0, this.limit);
    return entry;
  }

  clear() {
    this.logs = [];
  }

  list() {
    return this.logs;
  }
}

module.exports = {
  SyncLogger,
  maskToken
};
