# finch

Aplicativo desktop de controle financeiro pessoal com foco em clareza, organizacao e projecao do futuro financeiro.

## Rodar localmente

```bash
npm install
npm run dev
```

No desktop, o app salva os dados localmente em um arquivo JSON dentro da pasta de dados do usuario. No navegador, ele usa `localStorage`. Backups podem ser exportados e importados pela tela de configuracoes.

## Build

```bash
npm run build
```

## Windows .exe

```bash
npm run dist:win
```

O instalador e gerado na pasta `release/`.

## Atualizacoes

O app verifica a ultima Release publicada em `https://github.com/0qmt/Finch` quando e aberto. Se existir uma versao maior que a instalada, o usuario recebe um aviso para baixar o novo instalador.

Para publicar uma nova versao:

```bash
npm version patch
npm run dist:win
```

Depois, crie uma GitHub Release com a tag gerada e envie:

- `release/finch-Setup-<versao>.exe`
- `release/finch-Setup-<versao>.exe.blockmap`
- `release/latest.yml`
- `release/finch-win-unpacked-<versao>.zip`

O instalador, o `.blockmap` e o `latest.yml` sao usados pelo auto-update. O ZIP e opcional para quem quer baixar a versao sem instalador.

## Sincronizacao via Google Drive

O Finch usa o Google Drive do proprio usuario como transporte de dados. Nao existe servidor proprio do Finch, nao ha LAN, porta, IP local, roteador ou WebSocket.

Estrutura criada no Drive:

```txt
Finch/
  data.json
  sync-log.json
  devices.json
  backups/
  attachments/
```

O desktop continua salvando `finch-data.json` localmente. Quando o usuario conecta o Google Drive em **Configuracoes > Sincronizacao**, o Finch cria/encontra a pasta `Finch`, envia `data.json`, registra `devices.json` e cria backup antes de sobrescrever dados remotos.

### Configurar OAuth Google

Para login Google real, crie um OAuth Client ID no Google Cloud e salve as credenciais em um destes locais:

- variaveis de ambiente `FINCH_GOOGLE_CLIENT_ID` e `FINCH_GOOGLE_CLIENT_SECRET`;
- arquivo `google-oauth.json` na pasta de dados do Finch;
- arquivo `google-oauth.json` na raiz do projeto durante desenvolvimento.

Formato aceito:

```json
{
  "client_id": "SEU_CLIENT_ID",
  "client_secret": "SEU_CLIENT_SECRET"
}
```

Escopo usado: `https://www.googleapis.com/auth/drive.file`.

### Como funciona

- **Upload:** ao sincronizar, o Finch envia os dados atuais para `data.json`.
- **Download:** se a nuvem tiver revisao mais nova, o Finch sinaliza conflito antes de baixar.
- **Backup:** antes de sobrescrever `data.json`, a versao anterior vai para `backups/`.
- **Dispositivos:** `devices.json` registra dispositivos conectados, plataforma e ultimo acesso.
- **Offline-first:** desktop e mobile continuam abrindo com cache local; quando houver conexao, a sync pode atualizar a nuvem.

### Mobile

O app mobile fica em `mobile/` e usa Expo/React Native com visual proprio do Finch. O build Android local nao depende de EAS cloud.

O Finch Mobile consulta a ultima release publica em `https://github.com/0qmt/Finch/releases/latest` ao abrir. Se encontrar uma versao maior com asset `.apk`, mostra a atualizacao em **Ajustes > Atualizacoes** e abre o download pelo navegador do Android. A instalacao continua sendo confirmada pelo usuario, como um APK normal fora da Play Store.

Comandos:

```bash
cd mobile
npm install
npx expo prebuild --platform android
cd android
.\gradlew assembleDebug
```

APK debug:

```txt
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

APK release versionado:

```txt
mobile/Finch-Mobile-<versao>.apk
```

### Limites atuais

- Primeira versao sem criptografia.
- OAuth Google precisa de Client ID configurado.
- Merge ainda e simples: revisao mais nova gera conflito e o usuario escolhe nuvem ou dispositivo.
- Delta sync, anexos reais e iOS ficam para fases seguintes.
