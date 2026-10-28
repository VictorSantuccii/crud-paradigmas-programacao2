# Documentação do PetExpress

[Voltar à apresentação do projeto](../README.md)

Esta pasta reúne os guias do sistema, as decisões técnicas e as evidências de validação. Os guias abaixo descrevem a implementação atual; os documentos de fases e as especificações preservam o contexto de cada entrega.

## Guias do sistema

| Documento | Conteúdo |
| --- | --- |
| [Arquitetura](arquitetura/README.md) | Monorepo, camadas, módulos, autenticação, permissões e fluxo de agendamento |
| [Banco de dados](banco-de-dados/README.md) | Diagrama de entidades, tabelas, relacionamentos, restrições SQL e migrações |
| [Desenvolvimento](desenvolvimento/README.md) | Ambiente local, variáveis, primeiro ADMIN, comandos, testes e diagnóstico |
| [API](api/README.md) | Autenticação por cookie, recursos, códigos HTTP e contratos de agenda/fidelidade |
| [Galeria de telas](capturas/README.md) | Capturas desktop/mobile e contexto dos dados de teste |
| [Identidade visual](assets/README.md) | Origem e atualização da logo usada no README |

Para conhecer o projeto, comece por **arquitetura → banco de dados → API**. Para executar o sistema ou desenvolver as próximas etapas do trabalho, comece pelo **guia de desenvolvimento**.

## Configuração e operação

- [Autenticação Google](google-auth.md): Firebase, credenciais e onboarding.
- [Operação da agenda](agenda-operacao.md): catálogo, equipe, expediente, bloqueios, prazos, estados e concorrência.
- [Fidelidade automática](fase4-implementacao.md): regra dos oito banhos, cotações, reserva, consumo, devolução e ajustes administrativos.

## Entregas e validações

| Entrega | Documentos |
| --- | --- |
| Identidade e autorização | [Contratos e permissões da fase 1](fase-1-identidade-autorizacao.md) |
| Agenda persistida | [Implementação da fase 3](fase3-implementacao.md) · [Validação da fase 3](fase3-validacao.md) |
| Fidelidade automática | [Implementação da fase 4](fase4-implementacao.md) · [Validação da fase 4](fase4-validacao.md) |

Relatórios de validação registram resultados obtidos na data de cada entrega. Para verificar o estado atual, execute os comandos do [guia de desenvolvimento](desenvolvimento/README.md#verificação).

## Especificações e planejamento

- [Modelagem inicial do domínio](superpowers/specs/2026-09-27-entidades-petshop-design.md)
- [Fluxos funcionais do PetExpress](superpowers/specs/2026-10-22-petexpress-fluxos-funcionais-spec.md)

## Como manter esta documentação

Ao alterar uma regra, atualize o guia correspondente e os contratos Swagger quando houver mudança de API. Alterações de dados devem considerar tanto o schema Prisma quanto o SQL das migrações. Mantenha imagens em `capturas/`, recursos de marca em `assets/` e links relativos para que a navegação funcione no GitHub e no clone local.
