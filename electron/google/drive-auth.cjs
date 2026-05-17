const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_FILE = 'finch-google-token.json';
const OAUTH_FILE = 'google-oauth.json';
const LAST_CALLBACK_FILE = 'finch-google-oauth-last-callback.json';

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function getOAuthConfig(userDataPath) {
  const localConfig =
    readJsonIfExists(path.join(userDataPath, OAUTH_FILE)) ||
    readJsonIfExists(path.join(process.cwd(), OAUTH_FILE)) ||
    readJsonIfExists(path.join(__dirname, OAUTH_FILE));
  const installed = localConfig?.installed || localConfig?.web || localConfig || {};
  const clientId = process.env.FINCH_GOOGLE_CLIENT_ID || installed.client_id || installed.clientId;
  const clientSecret = process.env.FINCH_GOOGLE_CLIENT_SECRET || installed.client_secret || installed.clientSecret || '';

  if (!clientId) {
    return {
      ok: false,
      error: `Credencial Google nao configurada. Crie ${OAUTH_FILE} em ${userDataPath} ou defina FINCH_GOOGLE_CLIENT_ID.`
    };
  }

  return {
    ok: true,
    clientId,
    clientSecret
  };
}

function getTokenPath(userDataPath) {
  return path.join(userDataPath, TOKEN_FILE);
}

function maskValue(value = '') {
  if (!value) return '';
  if (value.length <= 10) return `${value.slice(0, 2)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function writeOAuthDiagnostic(userDataPath, payload) {
  if (!userDataPath) return;
  fs.writeFileSync(
    path.join(userDataPath, LAST_CALLBACK_FILE),
    JSON.stringify(
      {
        ...payload,
        receivedState: maskValue(payload.receivedState),
        expectedState: maskValue(payload.expectedState),
        code: payload.code ? 'present' : 'missing'
      },
      null,
      2
    ),
    'utf8'
  );
}

function createOAuthClient(config, redirectUri) {
  return new google.auth.OAuth2(config.clientId, config.clientSecret, redirectUri);
}

function listenForOAuthCode({ port, expectedState, userDataPath }) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      try {
        const url = new URL(request.url, `http://127.0.0.1:${port}`);
        if (url.pathname !== '/oauth/google/callback') {
          response.writeHead(404);
          response.end('Finch OAuth endpoint nao encontrado.');
          return;
        }

        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        writeOAuthDiagnostic(userDataPath, {
          receivedAt: new Date().toISOString(),
          pathname: url.pathname,
          params: Object.fromEntries(url.searchParams.entries()),
          code,
          receivedState: state,
          expectedState
        });

        if (error) {
          throw new Error(`Google recusou o login: ${error}`);
        }

        if (!code) {
          throw new Error('Retorno OAuth invalido: o Google voltou sem codigo de autorizacao.');
        }

        if (state !== expectedState) {
          throw new Error('Retorno OAuth invalido: a sessao de login nao confere. Feche as abas antigas do Google, clique em Conectar Google Drive novamente e use a nova aba que abrir.');
        }

        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end('<h1>Finch conectado ao Google Drive.</h1><p>Voce ja pode voltar para o app.</p>');
        server.close();
        resolve(code);
      } catch (error) {
        response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        response.end(error.message);
        server.close();
        reject(error);
      }
    });

    server.once('error', reject);
    server.listen(port, '127.0.0.1');
  });
}

async function connectGoogleDrive({ userDataPath, shell }) {
  fs.mkdirSync(userDataPath, { recursive: true });
  const config = getOAuthConfig(userDataPath);
  if (!config.ok) {
    return { ok: false, needsConfig: true, error: config.error };
  }

  const port = 53987;
  const redirectUri = `http://127.0.0.1:${port}/oauth/google/callback`;
  const state = crypto.randomBytes(18).toString('hex');
  const oauth2Client = createOAuthClient(config, redirectUri);
  const codePromise = listenForOAuthCode({ port, expectedState: state, userDataPath });
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state
  });

  await shell.openExternal(authUrl);
  const code = await codePromise;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  fs.writeFileSync(getTokenPath(userDataPath), JSON.stringify(tokens, null, 2), 'utf8');

  return {
    ok: true,
    connected: true,
    scopes: SCOPES
  };
}

function getAuthenticatedClient(userDataPath) {
  const config = getOAuthConfig(userDataPath);
  if (!config.ok) {
    return { ok: false, needsConfig: true, error: config.error };
  }

  const tokens = readJsonIfExists(getTokenPath(userDataPath));
  if (!tokens) {
    return { ok: false, connected: false, error: 'Google Drive nao conectado.' };
  }

  const oauth2Client = createOAuthClient(config, 'http://127.0.0.1');
  oauth2Client.setCredentials(tokens);
  oauth2Client.on('tokens', (nextTokens) => {
    const merged = { ...tokens, ...nextTokens };
    fs.writeFileSync(getTokenPath(userDataPath), JSON.stringify(merged, null, 2), 'utf8');
  });

  return { ok: true, auth: oauth2Client };
}

function disconnectGoogleDrive(userDataPath) {
  const tokenPath = getTokenPath(userDataPath);
  if (fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath);
  }
  return { ok: true };
}

module.exports = {
  SCOPES,
  connectGoogleDrive,
  disconnectGoogleDrive,
  getAuthenticatedClient,
  getOAuthConfig
};
