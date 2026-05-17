# AGENTS.md

## Finch

Projeto Electron + React + Vite, com app mobile Expo/React Native.

## Regras

- Nao reescrever o app sem necessidade.
- Nao usar Flutter.
- Nao migrar para SQLite sem uma fase propria.
- Nao usar Firebase/Supabase/backend proprio.
- Sincronizacao atual usa Google Drive do proprio usuario.
- Nao quebrar build atual.
- Nao quebrar auto-update do desktop.
- Nao alterar o formato base do `finch-data.json`.
- Desktop integra APIs nativas via Electron main/preload/contextBridge.
- Renderer nao deve acessar Node diretamente.
- Mobile deve manter visual alinhado ao Finch Desktop.
- Interface em portugues.
- Mudancas pequenas e focadas.
- Nao refatorar `src/main.jsx` inteiro sem necessidade.
- Tokens e segredos nao devem ir para o repositorio.
- Google OAuth Desktop fica fora do repo em `AppData/Roaming/finch/google-oauth.json`.
- APKs, builds e pastas nativas geradas devem ficar fora do Git, exceto quando forem anexados em Releases.
