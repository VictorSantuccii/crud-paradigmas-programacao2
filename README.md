# PetExpress

Sistema acadêmico de gestão de pet shop com React/Vite, Express, Prisma, PostgreSQL e sessões Redis.

**Estado atual:** fases 1, 2 e 3 implementadas: autenticação e autorização por papel/titularidade; perfil, endereços e pets persistidos; catálogo, disponibilidade e agendamento real com proteção contra concorrência. As telas de serviços e consultas usam a API, e o perfil apresenta próximos atendimentos e histórico.

| Área | Situação |
| --- | --- |
| Cadastro, login e onboarding Google | Sessões HttpOnly em Redis, completude de perfil, CPF/e-mail validados e normalizados |
| Perfil, endereços e pets | Consulta, cadastro, edição e remoção com titularidade, raça opcional e proteção de vínculos |
| Serviços e consultas | Catálogo ativo, habilitação explícita de profissionais, calendário navegável e confirmação persistida |
| Agenda e histórico | Contrato de preço/duração, cancelamento, reagendamento, estados e auditoria transacional |
| Administração | APIs ADMIN para catálogo, equipe, expediente e bloqueios; painel visual fica para fase futura |
| Fidelidade, pagamentos e prontuário | Fidelidade tem cadastro/CRUD, sem contabilização automática; demais fluxos ficam para fases seguintes |

A agenda inicia de segunda a sexta, 09–12h e 13–18h, no fuso America/Sao_Paulo, com slots de 30 minutos e antecedências de 24h. Preço e duração são fixos por serviço e ficam preservados na reserva. PostgreSQL impede sobreposição por profissional com exclusão GiST (`btree_gist`). Catálogo e equipe começam sem dados demonstrativos: um ADMIN deve classificá-los, ativá-los e configurar habilitações.

Veja [operação, políticas, contratos e migração da agenda](docs/agenda-operacao.md), incluindo auditoria de legado e configuração inicial. `DELETE /agendamentos/:id` foi retirado: use `PATCH /agendamentos/:id/status` para cancelar.

## Tecnologias e organização

- **Monorepo:** pnpm workspaces e Turborepo.
- **Frontend:** React 19, TypeScript, Vite, React Router e Tailwind CSS 4.
- **Backend:** Node.js, Express, TypeScript e Prisma.
- **Persistência:** PostgreSQL 16.
- **Sessões:** Redis 7.
- **Autenticação Google:** Firebase Authentication no navegador e Firebase Admin na API.

```text
apps/
  backend/       API Express, serviços, repositórios, rotas e schema Prisma
  frontend/      aplicação React/Vite
  frontend-html/ páginas HTML de referência/protótipo
packages/
  eslint-config/ configurações compartilhadas do ESLint
  tsconfig/      configurações compartilhadas do TypeScript
docs/
  google-auth.md instruções de configuração da autenticação Google
```

## Como executar localmente

### Pré-requisitos

- Node.js 22 ou compatível com as dependências do projeto.
- pnpm 10.11.0 (ou Corepack habilitado).
- Docker e Docker Compose para PostgreSQL e Redis.
- Projeto Firebase configurado se quiser testar login com Google.

### Instalação

Na raiz do repositório:

```bash
pnpm install
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env
docker compose up -d postgres redis
pnpm --filter @petshop/backend prisma:generate
pnpm --filter @petshop/backend exec prisma migrate deploy
```

Em uma base existente, execute primeiro `pnpm --filter @petshop/backend auditoria:agenda` e siga [as instruções de migração](docs/agenda-operacao.md). A migração aborta intervalos inválidos ou sobrepostos, sem excluir reservas. Serviços e profissionais legados começam inativos; preço histórico desconhecido permanece nulo.

O arquivo `.env` controla a conexão da API com PostgreSQL/Redis e a origem do frontend. O arquivo `apps/frontend/.env` define a URL da API e as variáveis públicas do Firebase para o navegador. Configure as credenciais de serviço do Firebase no `.env` para validar tokens Google no backend. Consulte [docs/google-auth.md](docs/google-auth.md) para detalhes.

Para iniciar a API e o frontend em terminais separados:

```bash
pnpm --filter @petshop/backend dev
pnpm --filter @petshop/frontend dev
```

URLs locais padrão:

- Frontend: <http://localhost:5173>
- API: <http://localhost:3000>
- Swagger: <http://localhost:3000/api-docs>
- Health check: <http://localhost:3000/>

O backend espera que Redis esteja acessível durante a inicialização. O Compose também oferece um serviço `backend`; o fluxo acima permite executar a API diretamente no host para desenvolvimento.

### Comandos disponíveis

Na raiz:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

Comandos de banco:

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

## Identidade e autorização

Clientes precisam de telefone, CPF válido e endereço completo para habilitar a conta. A API calcula a completude pelos dados atuais; sessões Redis guardam somente o ID e papel/titularidade são recarregados do PostgreSQL em rotas privadas. Clientes acessam os próprios registros, funcionários consultam a agenda vinculada e ações administrativas exigem ADMIN. `GET /servicos` é público.

Google novo usa cookie temporário de onboarding por 30 minutos. Antes da migration, execute `pnpm --filter @petshop/backend auditoria:legado` e resolva colisões normalizadas sem mesclar contas. Crie o primeiro ADMIN localmente com `pnpm --filter @petshop/backend admin:bootstrap` e credenciais explícitas no ambiente. Veja [matriz de permissões e contratos da fase 1](docs/fase-1-identidade-autorizacao.md) e [onboarding Google](docs/google-auth.md).

## API REST

Todas as rotas de recursos usam JSON. A API está documentada no Swagger em `/api-docs`.

| Recurso | Rotas |
| --- | --- |
| Autenticação | `POST /auth/cadastro`, `POST /auth/login`, `POST /auth/google`, `GET/PUT /auth/me`, `GET/PUT /auth/onboarding`, `POST /auth/logout` |
| Usuários | `/usuarios` e `/usuarios/:id` — listar, criar, consultar, atualizar e remover |
| Endereços | `/enderecos` e `/enderecos/:id` |
| Animais | `/animais` e `/animais/:id` |
| Fidelidades | `/fidelidades` e `/fidelidades/:id` |
| Planos | `/planos` e `/planos/:id` |
| Assinaturas | `/assinaturas` e `/assinaturas/:id` |
| Serviços | `/servicos` e `/servicos/:id` |
| Funcionários | `/funcionarios` e `/funcionarios/:id` |
| Agendamentos | `GET/POST /agendamentos`, `GET/PUT /agendamentos/:id`, `PATCH /agendamentos/:id/status` |
| Disponibilidade | `GET /disponibilidade`, `GET /agendamentos/:id/disponibilidade` |
| Configuração e bloqueios (ADMIN) | `GET/PUT /configuracao-agenda`, `GET/POST /bloqueios-agenda`, `DELETE /bloqueios-agenda/:id` |

Para os recursos CRUD, exceto agendamentos, `GET` e `POST` são oferecidos na coleção; `GET`, `PUT` e `DELETE` são oferecidos na rota com `:id`. Consulte o Swagger para campos obrigatórios e formatos de cada entidade.

## Modelo e integridade da agenda

O schema inclui categoria/ativação de serviço, ativação de funcionário, habilitação funcionário–serviço, configuração global, bloqueios extraordinários, estados e contrato de preço/duração na reserva. Eventos registram autor, instante, ação e motivo opcional. Agendamentos legados conservam IDs e vínculos; estado inicial é AGENDADO sem inferir conclusão pela data.

Criação e reagendamento calculam disponibilidade no servidor e gravam reserva/auditoria em transação. Escritas administrativas usam o mesmo lock transacional. A exclusão GiST usa intervalo semiaberto `[início, fim)` por profissional nos estados AGENDADO e CONCLUIDO; atendimentos adjacentes são permitidos e cancelamentos/faltas liberam o intervalo. Conflito retorna 409 com `HORARIO_INDISPONIVEL`. Preço, duração e titular nunca vêm do navegador.

## Verificação

A suíte usa PostgreSQL/Redis isolados, testa migrações vazias e legadas, disponibilidade com relógio controlado, permissões, estados, prazos e concorrência real. Comandos completos e precauções de isolamento estão em [docs/agenda-operacao.md](docs/agenda-operacao.md#verificação-isolada).

## Próximas fases

- Automatizar fidelidade a partir de atendimentos concluídos e aplicar benefícios conforme a política definida.
- Criar painel de equipe e administração sobre as APIs autorizadas.
- Evoluir pagamentos e prontuário conforme o escopo aprovado.

As telas desta fase não apresentam diagnósticos, vacinas, receitas, avaliações, fotos ou credenciais profissionais fictícias. A página inicial ainda contém conteúdo ilustrativo a revisar no escopo de apresentação.
