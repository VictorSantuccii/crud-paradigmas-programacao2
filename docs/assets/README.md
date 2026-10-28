# Identidade visual da documentação

[Índice da documentação](../README.md) · [Apresentação do projeto](../../README.md)

![Logo do PetExpress](logo-petexpress.png)

## Origem da logo

`logo-petexpress.png` é uma exportação da marca já renderizada no cabeçalho da aplicação: o ícone preenchido `pets` de Material Symbols Outlined ao lado de **PetExpress**, com a fonte Quicksand e a cor primária `#005da7` sobre a superfície `#f7f9ff`.

A composição original pode ser consultada em:

- [`SiteHeader.tsx`](../../apps/frontend/src/components/layout/SiteHeader.tsx): marca do cabeçalho.
- [`AuthShell.tsx`](../../apps/frontend/src/components/auth/AuthShell.tsx): marca nas telas de autenticação.
- [`Icon.tsx`](../../apps/frontend/src/components/ui/Icon.tsx): ícone Material Symbols, preenchido com `filled`.
- [`index.css`](../../apps/frontend/src/index.css): cores e tipografia.
- [`index.html`](../../apps/frontend/index.html): carregamento das fontes.

A imagem foi capturada em 28/10/2026 com a composição ampliada no navegador para boa legibilidade no README. É um recurso da documentação; o frontend continua renderizando a marca pelos componentes existentes.

## Atualização

Se a identidade visual mudar, atualize a exportação a partir da interface e confira a imagem no README. Preserve a proporção, a patinha, a tipografia e as cores da aplicação. Capturas de páginas ficam em [`../capturas/`](../capturas/README.md).

## Badges

As badges do README usam Shields.io e indicam a licença e as tecnologias utilizadas no trabalho, declaradas em `package.json` e no Compose. As imagens das badges dependem de acesso externo ao Shields.io; logo e capturas são arquivos locais versionados.

O texto da licença foi baseado na [licença MIT publicada pela Open Source Initiative](https://opensource.org/license/mit). Licenças dos componentes de terceiros continuam sendo as de seus respectivos projetos.
