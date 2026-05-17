const { google } = require('googleapis');

const MIME_FOLDER = 'application/vnd.google-apps.folder';
const JSON_MIME = 'application/json';

function escapeQueryValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

class FinchDriveApi {
  constructor(auth) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  async findFile({ name, parentId, mimeType }) {
    const filters = [
      `name='${escapeQueryValue(name)}'`,
      'trashed=false',
      parentId ? `'${parentId}' in parents` : null,
      mimeType ? `mimeType='${mimeType}'` : null
    ].filter(Boolean);
    const response = await this.drive.files.list({
      q: filters.join(' and '),
      spaces: 'drive',
      fields: 'files(id,name,mimeType,modifiedTime,size)'
    });

    return response.data.files?.[0] || null;
  }

  async createFolder(name, parentId) {
    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: MIME_FOLDER,
        parents: parentId ? [parentId] : undefined
      },
      fields: 'id,name,mimeType,modifiedTime'
    });

    return response.data;
  }

  async findOrCreateFolder(name, parentId) {
    return (await this.findFile({ name, parentId, mimeType: MIME_FOLDER })) || this.createFolder(name, parentId);
  }

  async ensureStructure() {
    const root = await this.findOrCreateFolder('Finch');
    const backups = await this.findOrCreateFolder('backups', root.id);
    const attachments = await this.findOrCreateFolder('attachments', root.id);

    return { root, backups, attachments };
  }

  async readJsonFile(name, parentId) {
    const file = await this.findFile({ name, parentId });
    if (!file) return null;

    const response = await this.drive.files.get(
      { fileId: file.id, alt: 'media' },
      { responseType: 'text' }
    );

    return {
      file,
      data: typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    };
  }

  async upsertJsonFile(name, parentId, data) {
    const body = JSON.stringify(data, null, 2);
    const media = {
      mimeType: JSON_MIME,
      body
    };
    const existing = await this.findFile({ name, parentId });

    if (existing) {
      const response = await this.drive.files.update({
        fileId: existing.id,
        media,
        fields: 'id,name,modifiedTime,size'
      });
      return response.data;
    }

    const response = await this.drive.files.create({
      requestBody: {
        name,
        parents: [parentId],
        mimeType: JSON_MIME
      },
      media,
      fields: 'id,name,modifiedTime,size'
    });

    return response.data;
  }

  async listFiles(parentId) {
    const response = await this.drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id,name,mimeType,modifiedTime,size)'
    });
    return response.data.files || [];
  }
}

module.exports = {
  FinchDriveApi
};
