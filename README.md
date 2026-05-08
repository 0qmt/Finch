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

Depois, crie uma GitHub Release com a tag gerada e envie o arquivo `release/finch-Setup-<versao>.exe`.
