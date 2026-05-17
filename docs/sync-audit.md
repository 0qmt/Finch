# Auditoria da sincronizacao Google Drive

## 1. Stack detectada

- Electron 42 com processo principal em CommonJS.
- React 19 + Vite 7 no renderer.
- `electron-updater` para auto-update via GitHub Releases.
- Persistencia desktop em JSON local via IPC.
- Build Windows via `electron-builder` e script `npm run dist:win`.
- Seguranca Electron atual: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

## 2. Estrutura atual do Finch

- `electron/main.cjs`: janela principal, leitura/gravacao de dados locais, backup, auto-update.
- `electron/preload.cjs`: expoe APIs seguras `window.finchStorage` e `window.finchUpdates`.
- `src/main.jsx`: app React, estado principal, tabs, onboarding, CRUD de transacoes/compras/metas, projecoes e configuracoes.
- `src/styles.css`: estilos globais e responsivos.
- `README.md`: instrucoes atuais de instalacao, build, `.exe` e atualizacao.

## 3. Como o Finch salva dados

No desktop, o renderer chama `window.finchStorage.saveData(data)`. O preload encaminha para `ipcRenderer.invoke('finch:data:save', data)`. O main process escreve `finch-data.json` em `app.getPath('userData')` usando arquivo temporario e `renameSync`.

No navegador de desenvolvimento sem Electron, o app pode usar `localStorage`, mas o modo de teste atual ignora persistencia para reiniciar no onboarding.

## 4. Como o Finch carrega dados

No desktop, o renderer chama `window.finchStorage.loadData()`. O main process le `finch-data.json`, retorna o JSON e o renderer normaliza com `normalizeData`. Se nao existir arquivo, o app usa `createEmptyData`.

## 5. Onde ficam APIs Electron

- IPC de dados: `electron/main.cjs` e `electron/preload.cjs`.
- Auto-update: `electron/main.cjs` e `electron/preload.cjs`.
- Sync via Google Drive: `electron/google/*` fica no main process e o preload expoe apenas metodos seguros em `window.finchDriveSync`.

## 6. Estrutura dos dados

### settings

Tema, dados do onboarding, flags de boas-vindas/tutorial, salario, orcamento, categorias e contas.

### transactions

Lancamentos financeiros com `id`, `title`, `amount`, `type`, `category`, `account`, `date`, `status`, recorrencia, parcelas e observacoes.

### purchases

Compras planejadas/realizadas com `id`, `name`, `priceMode`, `targetPrice`, `isPromotionalPrice`, prioridade, categoria, loja, link, imagem, notas, status e vinculo opcional com transacao de compra.

### goals

Metas financeiras com `id`, `title`, `targetAmount`, `savedAmount`, prioridade, horizonte, prazo, notas e status.

## 7. Tabs existentes

- `overview`
- `wallet`
- `future`
- `projection`
- `settings`

## 8. Principais funcoes encontradas

- `normalizeData`
- `createEmptyData`
- `loadData`
- `saveTransaction`
- `deleteTransaction`
- `toggleTransactionStatus`
- `savePurchase`
- `deletePurchase`
- `reorderPlannedPurchases`
- `markPurchaseBought`
- `saveGoal`
- `deleteGoal`
- `reorderGoals`
- `resetData`
- `clearData`
- `importData`
- `completeOnboarding`

## 9. Pontos de integracao da sync

- `electron/google/drive-auth.cjs`: OAuth Google Desktop.
- `electron/google/drive-api.cjs`: operacoes da Drive API.
- `electron/google/drive-sync.cjs`: upload, download, backup, dispositivos e conflitos simples.
- `electron/preload.cjs`: expoe `window.finchDriveSync`.
- `src/main.jsx`: card de sincronizacao em Configuracoes e envio do estado atual para o main process.
- `mobile/src/drive/driveSync.js`: cache local, Google Drive REST, `data.json`, `devices.json` e backups.
- `mobile/App.js`: UI mobile, login Google, sync e checagem de atualizacao pelo GitHub.

## 10. Riscos

- Ausencia de `updatedAt` nas entidades dificulta resolucao real de conflitos.
- `src/main.jsx` e grande e concentra muitas responsabilidades.
- Sync futura vai precisar metadata por registro, versao de schema e historico minimo.
- Renderer e sandboxed, entao toda integracao Node precisa continuar passando pelo preload.
- Google OAuth em modo teste exige usuarios adicionados na lista do Google Cloud.
- Mobile fora da Play Store nao instala update silenciosamente; abre o APK/release para o usuario confirmar.
- Sem criptografia nesta fase, o `data.json` fica legivel no Drive do usuario.

## Comandos iniciais executados

- `git status --short`: sem alteracoes no inicio desta tarefa.
- `node -v`: `v24.13.1`.
- `npm -v`: `11.8.0`.
- `npm install`: sucesso, 0 vulnerabilidades.
- `npm run build`: sucesso.
