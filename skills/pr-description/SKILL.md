---
name: pr-description
description: Gera a descrição de um Pull Request em markdown a partir do diff entre a branch atual e a main, pronta pra copiar direto do chat. Use sempre que o usuário pedir para gerar/escrever descrição de PR, resumir as mudanças de uma branch para abrir PR, comparar a branch atual com a main para montar esse texto, ou pedir ajuda pra preencher a descrição de um Pull Request a partir do código alterado.
---

# PR Description

Gera uma descrição de Pull Request em Markdown, pronta para copiar do chat, com base no que a branch atual introduziu em relação à branch base.

Para determinar o repositório e a referência base, siga também [petexpress-repository-target](../petexpress-repository-target/SKILL.md). Neste projeto, use o remoto `upstream` e compare com `upstream/main` (ou `upstream/master` se `main` não existir).

## Obter o diff

1. Verifique as branches disponíveis. Use `main` como base padrão; se ela não existir, tente `master`.
2. Atualize a referência remota da base canônica com `git fetch upstream <branch-base>`.
3. Inspecione as mudanças introduzidas pela branch atual com `git diff upstream/<branch-base>...HEAD`. Os três pontos são importantes: incluem apenas mudanças da branch atual desde o ponto em que ela divergiu da base.
4. Leia o contexto dos commits com `git log upstream/<branch-base>..HEAD --oneline`.
5. Se o diff estiver vazio, informe que não há mudanças para descrever e não invente uma descrição. Se a base ou o remoto não estiver disponível, explique o problema e tente resolver usando as branches/remotos existentes antes de tirar conclusões.

Considere o diff e as mensagens de commit juntos. Analise o conteúdo real das alterações e não afirme que uma validação foi executada apenas porque um commit sugere isso.

## Analisar e classificar

Escolha o tipo que melhor representa a maior parte das mudanças:

- `feat` — arquivos, funções, rotas, componentes ou funcionalidades novas.
- `fix` — correção de comportamento incorreto.
- `refactor` — reestruturação sem alteração do comportamento externo.
- `test` — alterações restritas a testes.
- `docs` — alterações restritas a documentação ou comentários.
- `style` — formatação sem alteração de lógica.
- `chore` — configuração, dependências ou build.

Se houver tipos diferentes, escolha o predominante e cite alterações secundárias relevantes. Escreva uma descrição específica que explique o que mudou e o efeito pretendido. Liste as alterações em linguagem natural; não cole código nem produza bullets genéricos.

## Perguntar sobre validações

Antes de gerar o resultado final, pergunte ao usuário, em uma única mensagem, e aguarde as respostas:

1. Fez teste manual? Passou?
2. Rodou build local? Passou?
3. Rodou lint/type-check? Passou?
4. Ficou algo pendente para completar essa parte?

Não deduza as respostas com base no diff. No resultado final, só inclua a seção `Validações` com as informações fornecidas pelo usuário. Se ele disser que não fez nenhuma validação, omita a seção inteira. Se houver pendências mencionadas, inclua uma linha `Itens pendentes` com o que falta.

## Entregar

Responda diretamente no chat com a descrição dentro de um bloco de código marcado como `markdown`, pronta para copiar. Siga esta estrutura:

```markdown
## 🏷️ Tipo de mudança

**Tipo:** <tipo escolhido>

---

## 📋 Descrição

<descrição detalhada>

---

## 🔨 Alterações

- <alteração 1>
- <alteração 2>

---

## ✅ Validações

- <validação 1>: <status>
- <validação 2>: <status>

**Itens pendentes:** <o que falta>
```

O exemplo acima mostra a seção de validações e a linha de pendências quando aplicáveis. Omita `## ✅ Validações` por completo quando nenhuma validação tiver sido feita ou relatada. Omita `**Itens pendentes**` quando não houver pendências.

Nunca crie ou salve um arquivo `.md` com a descrição do PR. O resultado deve ficar no chat para cópia direta; só crie um arquivo se o usuário pedir explicitamente.
