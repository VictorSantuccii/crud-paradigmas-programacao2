---
name: petexpress-repository-target
description: Define o repositório GitHub canônico do PetExpress e o destino correto para publicar branches e Pull Requests. Use sempre que trabalhar com git remote, git push, gh pr create, abrir/revisar PRs ou comparar branches deste projeto com main.
---

# Repositório canônico do PetExpress

O repositório oficial deste projeto é [`VictorSantuccii/crud-paradigmas-programacao2`](https://github.com/VictorSantuccii/crud-paradigmas-programacao2). Use-o como destino de publicação mesmo quando o clone local também tiver um fork configurado como `origin`.

## Antes de publicar

1. Confira os remotos com `git remote -v` e confirme que `upstream` aponta para `https://github.com/VictorSantuccii/crud-paradigmas-programacao2.git`.
2. Atualize a base canônica com `git fetch upstream main`.
3. Use nomes de branches em inglês, curtos e descritivos, como `feat/phase-1-identity-authorization` ou `docs/pr-description-skill`.

Se o remoto `upstream` estiver ausente, adicione-o usando a URL canônica. Se existir com outra URL, corrija-o antes de publicar. Não trate `origin` como destino só por ser o remoto padrão local.

## Enviar branch e abrir PR

- Envie explicitamente para o remoto canônico: `git push -u upstream <branch>`.
- Abra PRs explicitamente no repositório canônico: `gh pr create --repo VictorSantuccii/crud-paradigmas-programacao2 --base main --head <branch> ...`.
- Para visualizar, atualizar ou verificar um PR, sempre informe `--repo VictorSantuccii/crud-paradigmas-programacao2`.
- Depois de publicar, confirme o remoto da branch e consulte o PR no repositório canônico para verificar `base`, `head`, título e estado.
- Não crie PRs no fork nem feche ou altere PRs existentes sem instrução explícita do usuário.

Se o GitHub negar acesso ao repositório canônico, informe o erro e a branch local/remota que já foi enviada. Não publique silenciosamente no fork como alternativa.
