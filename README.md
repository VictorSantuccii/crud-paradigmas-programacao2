# PetExpress

Projeto acadêmico de um sistema para gestão de um pet shop. A proposta reúne cadastro de clientes e animais, agendamento de serviços e controle de fidelidade. O repositório contém uma interface web em desenvolvimento e uma API REST com persistência em PostgreSQL.

> **Estado atual:** autenticação, autorização por papel/titularidade, cadastro com perfil obrigatório e onboarding Google estão implementados na API e no formulário de conta. Telas de animais, agenda e fidelidade ainda têm partes demonstrativas; essas integrações permanecem para fases seguintes.

## Progresso das telas

Percentuais estimados considerando a interface, a conexão com a API e as regras de negócio previstas. Uma tela pode estar visualmente pronta e ainda ter baixo percentual se seus dados e ações forem demonstrativos.

| Tela | Rota | Implementado | Situação atual |
| --- | --- | ---: | --- |
| Página inicial | `/` | **90%** | Apresentação e navegação implementadas; falta revisar os links e conteúdos conforme o escopo final. |
| Cadastro de cliente | `/cadastro` | **70%** | Cadastro conectado à API com CPF validado, telefone, endereço obrigatório e validações de duplicidade. |
| Login | `/login` | **85%** | Login com e-mail/senha e Google conectado à API, com sessão em Redis. |
| Completar cadastro Google | `/cadastro/google/cpf` | **80%** | Conclui CPF, telefone e endereço para conta Google nova; onboarding retoma após recarga por cookie temporário. |
| Serviços | `/servicos` | **35%** | Formulário visual de pet, data e horário; opções são locais e não criam um agendamento persistido. |
| Consultas | `/consultas` | **30%** | Fluxo visual existe e exige sessão no frontend; pets, especialidades, profissionais e horários são demonstrativos. |
| Meus Pets / Perfil | `/meus-pets`, `/meu-perfil` | **30%** | Exibe dados básicos da sessão; pets, histórico e ações de edição/cadastro usam dados locais ou não têm ação persistente. |
| Gestão de funcionário/proprietário | — | **0%** | Não há telas administrativas para agenda geral, funcionários ou gestão de clientes. |

## O que implementar em cada tela

### Página inicial — `/`

- Revisar os links de serviços e consultas para encaminhar ao fluxo correto.
- Substituir informações ilustrativas por catálogo e dados que serão oferecidos pelo sistema, quando disponíveis na API.

### Cadastro de cliente — `/cadastro`

- Telefone/WhatsApp e endereço completos agora são obrigatórios; CPF e e-mail são validados e normalizados pelo backend.
- Duplicidades são apresentadas no formulário e cadastro com conta, endereço e fidelidade é atômico.

### Login — `/login`

- Manter os fluxos de e-mail/senha e Google e tratar estados de carregamento, falha de rede e sessão expirada.
- API revalida a sessão no banco em cada requisição privada e aplica papel, titularidade e escopo nos CRUDs.

### Completar cadastro Google — `/cadastro/google/cpf`

- O onboarding exige CPF, telefone e endereço antes de persistir a nova conta e pode ser retomado por cookie após recarga.
- Erros de validação, duplicidade e expiração da sessão são apresentados na tela.

### Serviços — `/servicos`

- Buscar serviços, pets e horários disponíveis na API em vez de usar listas fixas.
- Enviar a confirmação para `POST /agendamentos` e apresentar o resultado persistido.
- Calcular o fim do atendimento conforme duração do serviço e porte do animal, se essa regra for confirmada para o sistema.
- Impedir seleção de horários ocupados e tratar conflitos devolvidos pelo backend.
- Aplicar o benefício de fidelidade quando elegível.

### Consultas — `/consultas`

- Carregar pets do cliente, especialidades/serviços, profissionais e disponibilidade reais.
- Enviar o agendamento à API e apresentar confirmação ou erro de horário indisponível.
- Implementar o bloqueio de sobreposição para o mesmo funcionário no backend; a interface não deve ser a única responsável por essa regra.
- Persistir observações da consulta se fizerem parte do escopo, pois o modelo atual de agendamento não possui esse campo.

### Meus Pets / Perfil — `/meus-pets` e `/meu-perfil`

- Carregar e editar os dados do cliente pela API, incluindo telefone/WhatsApp e endereços.
- Implementar cadastro, edição e remoção de pets usando `GET/POST/PUT/DELETE /animais`.
- Filtrar pets e agendamentos pelo usuário autenticado; as rotas agora restringem esses dados ao titular.
- Substituir histórico, vacinas, microchip, raça e demais dados fixos por dados persistidos, após incluí-los no modelo/API.
- Conectar as preferências de contato a uma persistência real ou remover a ação de salvar enquanto não houver suporte.
- Exibir o progresso de fidelidade e o benefício disponível com base no estado real do cliente.

### Gestão de funcionário/proprietário — ainda sem tela

- Criar telas para cadastrar funcionários e visualizar/gerenciar a agenda geral.
- Criar área de gestão para o proprietário, com acesso aos dados de gestão e funcionários conforme RNF001.
- Proteger essas telas e endpoints por papel, impedindo que clientes acessem funções administrativas.

## Status dos requisitos de negócio

| ID | Requisito | Status | Já existe | Pendente |
| --- | --- | --- | --- | --- |
| RF001 | Cadastrar clientes | **Parcial** | Cadastro com nome, CPF validado, e-mail, senha, telefone e endereço; perfil derivado; sessão e onboarding Google. | Conectar a tela de perfil a edição completa e adicionar dados de saúde conforme escopo. |
| RF002 | Cadastrar animais | **Parcial** | API CRUD de animais com nome, espécie, idade, porte e dono; valida vínculo e bloqueia troca de dono/remoção quando há agendamento. | Conectar telas ao CRUD e incluir raça, além dos dados de saúde exibidos na interface se estiverem no escopo. |
| RF003 | Agendar serviços | **Parcial** | API CRUD vincula cliente, animal, serviço e funcionário e valida referências, dono e horário final posterior ao inicial. | Conectar formulários, consultar disponibilidade e impedir conflitos de horário por funcionário. |
| RF004 | Gerenciar fidelidade | **Parcial** | Entidade e CRUD de fidelidade com contador e benefício ativo; nova fidelidade é criada no cadastro de usuário. | Contabilizar banhos concluídos, liberar automaticamente um benefício a cada oito e aplicá-lo no agendamento seguinte. |
| RNF001 | Controle de acesso | **Parcial** | Sessões Redis/HttpOnly revalidadas no PostgreSQL; CRUDs privados autenticados, escopados por titular e papel; bootstrap ADMIN local e provisionamento de FUNCIONARIO. | Painel administrativo e mudanças de estado de agendamento nas próximas fases. |

### Detalhes das regras das imagens

- **RF001 — duplicidade:** e-mail é aparado e normalizado para minúsculas; CPF aceita máscara, valida dígitos verificadores e persiste 11 dígitos. Conflitos concorrentes retornam conflito.
- **RF002 — porte:** o banco aceita `PEQUENO`, `MEDIO` e `GRANDE`; ainda não há regra de duração do serviço baseada no porte.
- **RF003 — conflito:** não implementado. A API permite agendamentos sobrepostos para o mesmo funcionário.
- **RF004 — benefício:** não implementado. O contador pode ser alterado pelo CRUD, mas não acompanha serviços finalizados.
- **RNF001 — permissões:** sessão, papel atual e titularidade são revalidados nas rotas privadas. Clientes acessam somente os próprios dados; funcionários consultam sua agenda vinculada; ADMIN gerencia os recursos desta fase.

## Funcionalidades da API já implementadas

- CRUD de usuários (ADMIN), endereços e animais próprios (CLIENTE), leitura própria de fidelidade e agenda vinculada de funcionário; demais recursos de gestão são protegidos por papel.
- Validação de entradas e tratamento uniforme de erros HTTP (`400`, `401`, `403`, `404`, `409` e `500`).
- Senhas com hash, sessão em Redis e documentação interativa via Swagger.
- Restrições de integridade para evitar remoção de registros com vínculos importantes.

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
pnpm --filter @petshop/backend prisma:migrate
```

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
| Agendamentos | `/agendamentos` e `/agendamentos/:id` |

Para os recursos CRUD, `GET` e `POST` são oferecidos na coleção; `GET`, `PUT` e `DELETE` são oferecidos na rota com `:id`. Consulte o Swagger para campos obrigatórios e formatos de cada entidade.

## Modelo de dados

O schema Prisma define as entidades `Usuario`, `Endereco`, `Animal`, `Fidelidade`, `Plano`, `Assinatura`, `Servico`, `Funcionario` e `Agendamento`. O usuário tem papel (`CLIENTE`, `FUNCIONARIO` ou `ADMIN`), CPF único normalizado, telefone nullable para migração e vínculo funcional único opcional, vínculo individual com fidelidade e relações com endereços, animais, assinaturas e agendamentos. O agendamento exige um usuário, animal, serviço, funcionário, início e fim.

O modelo ainda não representa status de conclusão/cancelamento do agendamento. Sem esse estado, não há base para determinar automaticamente quais serviços devem contar para a fidelidade.

## Próximos passos recomendados

1. Integrar o cadastro/edição de animais e perfil às rotas da API; adicionar raça e telefone/WhatsApp ao modelo conforme o requisito.
2. Integrar o fluxo de agendamento à API, carregar pets/serviços/funcionários reais e buscar horários disponíveis.
3. Impedir sobreposição de horários do mesmo funcionário no backend, incluindo validação em atualizações.
4. Definir estados do agendamento (por exemplo, agendado, concluído e cancelado) e contar apenas serviços concluídos para a fidelidade.
5. Implementar o benefício a cada oito banhos e aplicar o desconto automaticamente ao próximo agendamento elegível.
6. Adicionar autenticação e autorização nas rotas de dados, filtrando registros por usuário e restringindo ações por papel.
7. Evoluir o domínio de animais para suportar raça e, caso faça parte do escopo, dados de vacinas e histórico clínico.
8. Validar CPF e normalizar entradas antes de persistir, mantendo regras únicas consistentes.

## Escopo e limitações

Este README foi elaborado a partir do código presente no repositório e dos requisitos fornecidos. A existência de uma entidade ou endpoint não garante que esteja conectada a uma tela. Pets, consultas, agendamentos e fidelidade ainda têm partes demonstrativas que serão integradas nas próximas fases.
