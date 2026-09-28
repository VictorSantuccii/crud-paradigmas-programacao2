# Domínio pet shop no lugar de Product

API REST do diagrama (pet shop / clínica): nove entidades, CRUD completo, camadas e PostgreSQL via Prisma. O recurso `Product` sai.

## Decisões fechadas

- Camadas em funções: rota → controller → service → repository → Prisma.
- Chave primária `Int` com autoincremento.
- Senha só no CRUD: o body envia `senha`, o service grava `senhaHash` com bcryptjs (custo 10). Não há login. A resposta nunca inclui o hash.
- Enums: `Role` = `CLIENTE | FUNCIONARIO | ADMIN`; `Porte` = `PEQUENO | MEDIO | GRANDE`; `TipoPlano` = `BASICO | PADRAO | PREMIUM`.
- `email` do usuário é opcional e único quando preenchido. `especie` existe só em `Animal`.
- `Funcionario` é cadastro próprio. O valor `FUNCIONARIO` em `Usuario.role` não cria nem liga um funcionário.
- Sem `createdAt` / `updatedAt`.
- Sem paginação, filtro ou objetos aninhados. A lista ordena por `id` decrescente e devolve o registro com os ids das chaves estrangeiras.
- `PUT` altera só os campos enviados. `senha` no usuário é opcional na atualização. `fidelidadeId` não muda na atualização: a troca de fidelidade fica fora deste CRUD.
- Sem suíte de testes. A verificação é `tsc` mais chamadas manuais à API.

## Camadas

```
requisição → rota → controller → service → repository → Prisma → PostgreSQL
```

| Camada | Responsabilidade |
|---|---|
| `prisma/schema.prisma` | Modelo e relações |
| `src/repositories` | Acesso a uma tabela. Não conhece HTTP |
| `src/services` | Campos obrigatórios, hash, vínculos, conflito ao apagar |
| `src/controllers` | Lê o request e devolve status e JSON. Não importa Prisma |
| `src/routes` | Verbos e JSDoc do Swagger |
| `src/lib/errors.ts` | `HttpError` com status 400, 404 ou 409 |
| `src/lib/password.ts` | `hashSenha` |
| `src/lib/asyncHandler.ts` | Encaminha rejeição ao middleware |
| `src/server.ts` | JSON, rotas, Swagger, middleware de erro |

O controller não importa o Prisma. O repository não lê `Request`. Transação que cruza tabelas fica no repository do agregado e o service decide quando chamá-la.

Erro de domínio vira JSON `{ "message": "..." }` com o status do `HttpError`. Código Prisma `P2002` vira 409, `P2003` vira 400, `P2025` vira 404. O resto vira 500 com `"Erro interno do servidor."` e o detalhe só no console. `id` de rota que não é inteiro positivo responde 400.

## Modelo

Campos Prisma em camelCase. `@@map` usa o nome da tabela abaixo. `@map` só entra quando o diagrama nomeia a coluna de outro jeito: `senha_hash`, `id_fidelidade`, `id_usuario`, `id_animal`, `id_servico`, `id_funcionario` e `id_plano`. `beneficioAtivo`, `qntdServicos`, `servicosRest`, `dataAquisicao`, `dataHoraIni`, `dataHoraFim` e `duracaoMin` permanecem com esse nome de coluna.

| Modelo | Tabela | Campos | Relações e apagar |
|---|---|---|---|
| `Usuario` | `usuarios` | `email` opcional e único, `senhaHash` → `senha_hash`, `role`, `cpf` único, `nome`, `fidelidadeId` único → `id_fidelidade` | 1:1 com `Fidelidade`. Vários endereços, animais, agendamentos e assinaturas |
| `Fidelidade` | `fidelidades` | `beneficioAtivo` boolean, `qntdServicos` int | Apagar responde 409 se algum usuário apontar para ela |
| `Endereco` | `enderecos` | `cep`, `complemento` opcional, `bairro`, `numero` int, `rua`, `usuarioId` → `id_usuario` | N:1 usuário. `onDelete: Cascade` |
| `Animal` | `animais` | `idade` int, `porte`, `especie`, `nome`, `usuarioId` → `id_usuario` | N:1 usuário. `onDelete: Cascade`. Apagar direto responde 409 se houver agendamento |
| `Plano` | `planos` | `preco` `Decimal(10, 2)`, `tipo` | Apagar responde 409 se houver assinatura |
| `Assinatura` | `assinaturas` | `servicosRest` JSON opcional, `dataAquisicao` date, `usuarioId` → `id_usuario`, `planoId` → `id_plano` | N:1 usuário e N:1 plano. `onDelete: Restrict` nos dois |
| `Servico` | `servicos` | `descricao` opcional, `duracaoMin` int, `preco` `Decimal(10, 2)`, `nome` | Apagar responde 409 se houver agendamento |
| `Funcionario` | `funcionarios` | `nome`, `cargo`, `telefone` opcional | Apagar responde 409 se houver agendamento |
| `Agendamento` | `agendamentos` | `dataHoraIni`, `dataHoraFim`, `usuarioId` → `id_usuario`, `animalId` → `id_animal`, `servicoId` → `id_servico`, `funcionarioId` → `id_funcionario` | Os quatro vínculos são obrigatórios. `onDelete: Restrict` |

`servicosRest` aceita qualquer JSON. Não há schema interno.

`preco` entra como number. Na resposta o service devolve number com duas casas, para o JSON não sair como string do `Decimal`. `dataAquisicao` entra e sai como `YYYY-MM-DD`. `dataHoraIni` e `dataHoraFim` entram e saem em ISO 8601.

## Rotas

Cada entidade expõe `POST /`, `GET /`, `GET /:id`, `PUT /:id` e `DELETE /:id` no prefixo abaixo. Criar responde 201 com o registro. Buscar e atualizar respondem 200. Ausente responde 404. Apagar responde 200 com `{ "message": "<Entidade> removida com sucesso." }`.

| Prefixo |
|---|
| `/usuarios` |
| `/enderecos` |
| `/fidelidades` |
| `/animais` |
| `/planos` |
| `/assinaturas` |
| `/servicos` |
| `/funcionarios` |
| `/agendamentos` |

`GET /` continua respondendo a mensagem de saúde e o link `/api-docs`. O Swagger deixa de documentar produto e passa a documentar estas rotas, com schema de saída e de entrada para cada entidade.

### Regras por entidade

**Usuário.** Criar exige `senha`, `role`, `cpf` e `nome`. `email` é opcional. Sem `fidelidadeId`, o repository cria uma fidelidade (`beneficioAtivo: false`, `qntdServicos: 0`) e o usuário na mesma transação. Com `fidelidadeId`, a fidelidade precisa existir e estar livre; se já houver usuário nela, responde 409. `email` ou `cpf` repetido responde 409. Atualizar não troca `fidelidadeId`. Apagar: se existir agendamento do usuário, agendamento de um animal dele ou assinatura, responde 409; senão apaga o usuário (endereços e animais caem em cascata) e, na mesma transação, apaga a fidelidade que era dele.

**Fidelidade.** Criar exige `beneficioAtivo` e `qntdServicos`.

**Endereço.** Criar exige `cep`, `bairro`, `numero`, `rua` e `usuarioId`. `complemento` é opcional. Usuário inexistente responde 404.

**Animal.** Criar exige `idade`, `porte`, `especie`, `nome` e `usuarioId`. Usuário inexistente responde 404. Trocar o dono de um animal com agendamento responde 409.

**Plano.** Criar exige `preco` e `tipo`.

**Assinatura.** Criar exige `dataAquisicao`, `usuarioId` e `planoId`. `servicosRest` é opcional. Usuário ou plano inexistente responde 404.

**Serviço.** Criar exige `duracaoMin`, `preco` e `nome`. `descricao` é opcional.

**Funcionário.** Criar exige `nome` e `cargo`. `telefone` é opcional.

**Agendamento.** Criar exige `dataHoraIni`, `dataHoraFim`, `usuarioId`, `animalId`, `servicoId` e `funcionarioId`. O fim tem de ser posterior ao início (400 se não for). O animal tem de pertencer ao `usuarioId` informado (400 se for de outro dono). Qualquer vínculo inexistente responde 404.

Nas demais atualizações, um id de vínculo enviado e inexistente também responde 404. Enum fora da lista responde 400.

## Arquivos

Saem `src/routes/productRoutes.ts`, `src/controllers/productController.ts` e o model `Product`.

Entram, para cada entidade, um repository, um service, um controller e um route. Entram também `src/lib/errors.ts`, `src/lib/password.ts` e `src/lib/asyncHandler.ts`. `src/server.ts` e `src/config/swagger.ts` passam a registrar o domínio novo. Dependência nova: `bcryptjs` e `@types/bcryptjs`.

A primeira migration Prisma cria só este esquema. Não há pasta `prisma/migrations` hoje, então não existe migração antiga de `Product` para reconciliar.
