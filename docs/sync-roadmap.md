# Roadmap de sincronizacao do Finch

## Fase 1: Google Drive funcional

- Desktop conecta no Google Drive do usuario.
- Mobile conecta na mesma conta Google.
- Ambos leem e escrevem `Finch/data.json`.
- `devices.json` registra desktop e celular.
- Backups sao criados antes de sobrescrever dados remotos.

## Fase 2: UX de atualizacao

- Desktop usa `electron-updater` com GitHub Releases.
- Mobile consulta GitHub Releases ao abrir.
- Mobile mostra nova versao e abre o APK pelo navegador do Android.

## Fase 3: metadata por entidade

- Adicionar `createdAt`, `updatedAt`, `deletedAt`, `deviceId` e revisao por registro.
- Evitar conflito em arquivo inteiro quando so um item mudou.
- Melhorar historico de alteracoes.

## Fase 4: conflitos inteligentes

- Comparar entidade por entidade.
- Permitir escolher versao por transacao, compra, meta ou configuracao.
- Evitar sobrescrita silenciosa.

## Fase 5: anexos e imagens

- Mover imagens locais para `attachments/`.
- Referenciar anexos no `data.json`.
- Sincronizar imagens de compras futuras entre desktop e mobile.

## Fase 6: criptografia

- Criptografar `data.json` antes de enviar ao Drive.
- Guardar chave local por dispositivo.
- Criar fluxo de recuperacao/pareamento seguro.
