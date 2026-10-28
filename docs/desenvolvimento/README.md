# Guia de desenvolvimento

[Índice da documentação](../README.md) · [Arquitetura](../arquitetura/README.md) · [Banco de dados](../banco-de-dados/README.md)

## Requisitos

- Node.js 22.
- pnpm 10.11.0, conforme `packageManager` no [`package.json`](../../package.json).
- Docker com Docker Compose para PostgreSQL 16 e Redis 7.
- Projeto Firebase com Google habilitado para testar essa opção de login.

## Preparar o ambiente

Na raiz do repositório:

```bash
pnpm install
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env
```

Antes de iniciar a API, confira as variáveis abaixo. Os arquivos `.env` são locais e ignorados pelo Git. Em particular, deixe `FIREBASE_SERVICE_ACCOUNT_JSON` vazio enquanto não configurar credenciais Google; quando preenchido, ele precisa conter um JSON válido de service account.

### Variáveis da API e do Compose

| Variável | Uso / padrão de desenvolvimento |
| --- | --- |
| `DATABASE_URL` | `postgresql://petshop:petshop_dev@localhost:15432/petshop?schema=public` |
| `REDIS_URL` | `redis://localhost:16379` |
| `PORT` | Porta HTTP da API; `3000` |
| `FRONTEND_ORIGIN` | Origem permitida pelo CORS; `http://localhost:5173` |
| `NODE_ENV` | `development` localmente; controla também a opção Secure do cookie em produção |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase; o exemplo usa `petshop-tic` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Caminho absoluto do JSON de service account para credencial padrão do Firebase Admin no host |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Alternativa com o JSON da credencial em uma linha; usado também no serviço backend do Compose |
| `POSTGRES_PORT` | Porta publicada do PostgreSQL pelo Compose; padrão `15432` |
| `REDIS_PORT` | Porta publicada do Redis pelo Compose; padrão `16379` |

[`config/env.ts`](../../apps/backend/src/config/env.ts) carrega o `.env` da raiz, com fallback para `.env.example`. O Compose injeta URLs internas próprias no serviço `backend`: hostnames `postgres`/`redis` e portas `5432`/`6379`. Para a API executada no host, use as portas publicadas `15432`/`16379`. Se alterar uma porta no Compose, atualize a URL correspondente no `.env`.

### Variáveis do frontend

| Variável | Finalidade |
| --- | --- |
| `VITE_API_URL` | URL da API acessível pelo navegador; padrão `http://localhost:3000` |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` | Configuração web do Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` | Demais identificadores da configuração web |

Variáveis `VITE_*` são públicas e incorporadas ao frontend. Credenciais de service account ficam somente no backend. Veja o [guia Google](../google-auth.md) para configurar a integração.

## Iniciar o projeto

```bash
docker compose up -d postgres redis
pnpm --filter @petshop/backend prisma:generate
pnpm --filter @petshop/backend exec prisma migrate deploy
```

Em dois terminais separados, na raiz:

```bash
# API
pnpm --filter @petshop/backend dev
```

```bash
# Frontend
pnpm --filter @petshop/frontend dev
```

- Aplicação: <http://localhost:5173>
- API / health check: <http://localhost:3000/>
- Swagger: <http://localhost:3000/api-docs>

A API só inicia o servidor após conectar ao Redis. Execute-a pelo script do pacote para manter o diretório de trabalho esperado pela descoberta das rotas Swagger. Para subir também a API em container, o Compose oferece o serviço `backend`; use apenas uma instância na porta 3000.

Esse procedimento considera uma **base nova**. Para dados existentes, consulte [migrações e auditorias](../banco-de-dados/README.md#migrações) antes de atualizar.

## Primeiro administrador e catálogo

O primeiro ADMIN é criado por comando local. Configure `ADMIN_NOME`, `ADMIN_EMAIL`, `ADMIN_CPF` e `ADMIN_SENHA` no ambiente do processo ou no `.env` local da raiz. Use CPF válido e senha com pelo menos oito caracteres; não há credencial administrativa padrão.

```bash
pnpm --filter @petshop/backend admin:bootstrap
```

O comando recusa outro ADMIN quando já existe um, salvo uso explícito da opção `--adicional`. Depois do bootstrap, autentique-se em `POST /auth/login` e use a sessão para as APIs administrativas do Swagger.

Para disponibilizar horários:

1. Cadastre/classifique serviços com categoria, preço, duração e ativação.
2. Cadastre profissionais ativos e associe seus `servicoIds`.
3. Revise expediente, prazos e bloqueios da operação.
4. Se desejar fidelidade, habilite `elegivelFidelidade` explicitamente em serviços `BANHO_TOSA`.

O catálogo começa vazio e não há seed operacional demonstrativo. As fixtures de testes são exclusivas da base isolada. O expediente inicial é segunda a sexta, 09–12h e 13–18h, fuso `America/Sao_Paulo`, slots de 30 minutos e antecedências de 24 horas. Veja os payloads em [operação da agenda](../agenda-operacao.md).

## Comandos

Execute os comandos a partir da raiz.

| Comando | Finalidade |
| --- | --- |
| `pnpm dev` | Desenvolvimento dos pacotes com tarefa `dev` |
| `pnpm build` | Build dos pacotes |
| `pnpm lint` | ESLint dos pacotes |
| `pnpm typecheck` | Verificação TypeScript dos pacotes |
| `pnpm prisma:generate` | Gerar Prisma Client |
| `pnpm prisma:migrate` | Criar/aplicar migração de desenvolvimento com Prisma Migrate |
| `pnpm --filter @petshop/backend exec prisma migrate deploy` | Aplicar migrações já versionadas |
| `pnpm --filter @petshop/backend test` | Executar a suíte Vitest |
| `pnpm --filter @petshop/backend test:e2e` | Compilar o backend e executar E2E HTTP com servidor real |
| `pnpm --filter @petshop/backend auditoria:legado` | Auditar identidade legada |
| `pnpm --filter @petshop/backend auditoria:agenda` | Auditar intervalos e sobreposições |
| `pnpm --filter @petshop/backend auditoria:fidelidade` | Auditar contadores de fidelidade |

## Verificação

### Análise estática e build

```bash
pnpm lint
pnpm typecheck
pnpm build
```

### Testes com banco isolado

**A suíte recria dados e limpa Redis. Use somente `petshop_test` e Redis `/15`, nunca os dados de desenvolvimento ou produção.** A configuração está em [`vitest.config.ts`](../../apps/backend/vitest.config.ts).

```bash
docker compose -p petshop-phase1-test -f .phase1-test-compose.yml up -d
DATABASE_URL=postgresql://petshop:test_password@localhost:25432/petshop_test pnpm --filter @petshop/backend exec prisma migrate deploy
pnpm --filter @petshop/backend test
pnpm --filter @petshop/backend test:e2e
```

O nome de projeto explícito separa os containers de teste dos containers de desenvolvimento. O arquivo [`.phase1-test-compose.yml`](../../.phase1-test-compose.yml) publica PostgreSQL em `25432` e Redis em `26379`; esses são os padrões de teste. O PostgreSQL isolado usa tmpfs e perde os dados ao remover o container. Caso personalize o ambiente, Vitest lê `TEST_DATABASE_URL` e `TEST_REDIS_URL`; mantenha as condições de isolamento exigidas pela suíte.

A suíte principal cobre validação de identidade, parsers (IDs, preços, datas e atualizações parciais), autorização, segurança de sessões e autenticação, contratos HTTP/Swagger, migrações vazias/legadas, disponibilidade, prazos, estados, fidelidade, rollback e concorrência real. Há testes de helpers do frontend no pacote backend; não existe um script de teste separado no frontend. O lint e o typecheck do backend também verificam os arquivos de teste e as configurações Vitest.

### E2E HTTP

O comando `test:e2e` compila o backend e inicia `dist/server.js` em um processo separado, em uma porta local livre. Os testes usam `fetch` com cookies reais, PostgreSQL e Redis; o servidor é encerrado ao final. Não é necessário iniciar a API manualmente. A suíte E2E tem configuração própria em [`vitest.e2e.config.ts`](../../apps/backend/vitest.e2e.config.ts) e não é incluída no comando `test`.

Os fluxos automatizados são:

- Saúde, Swagger, CORS com credenciais, rota inexistente, rota privada e JSON malformado pela rede.
- Cadastro, consulta de sessão, criação/edição de pet, logout, novo login, persistência e exclusão do pet.
- Login ADMIN, criação de serviço/profissional, ajuste de benefício, disponibilidade, cotação e reserva; conflito sem duplicação; preservação do preço contratado e cancelamento com devolução do benefício e liberação do horário.

Somente o ADMIN inicial e a configuração inicial da agenda são preparados diretamente no banco; a operação do fluxo usa a API. As datas são calculadas a partir do dia da execução. A configuração Vitest usa um projeto Firebase fictício e não carrega `FIREBASE_SERVICE_ACCOUNT_JSON` local. A verificação de identidade Google é simulada nos testes de integração, sem credenciais privadas. Não há cobertura automatizada de navegador ou do provedor Google real.

**Execute a suíte principal e os E2E em sequência**, pois ambas recriam dados de `petshop_test` e limpam Redis `/15`. Use os mesmos `TEST_DATABASE_URL`/`TEST_REDIS_URL` para personalizar os dois comandos. Os E2E verificam o nome exato do banco e o índice Redis antes da limpeza.

### CI de Pull Requests

O workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) executa na abertura, reabertura e atualização de PRs, em pushes para `main` e manualmente pelo GitHub Actions. Usa Node 24, pnpm definido no `packageManager` e instalação com `--frozen-lockfile`. Não precisa de secrets Firebase.

Dois jobs executam independentemente:

1. **Lint e TypeScript**: gera Prisma Client, roda `pnpm lint` e `pnpm typecheck` para backend, frontend e testes.
2. **Testes e E2E HTTP**: inicia PostgreSQL 16 e Redis 7 isolados com health checks, gera Prisma Client, aplica as migrações versionadas e executa a suíte principal e os E2E em sequência. O comando E2E também valida o build do backend.

Os relatórios JUnit ficam no artefato `test-results` por sete dias, inclusive quando algum teste falha. Localmente, é possível gerá-los com as mesmas opções do CI:

```bash
pnpm --filter @petshop/backend test --reporter=default --reporter=junit --outputFile.junit=test-results/integration.xml
pnpm --filter @petshop/backend test:e2e --reporter=default --reporter=junit --outputFile.junit=test-results/e2e.xml
```

Os arquivos são escritos em `apps/backend/test-results/` e ignorados pelo Git. Para exigir esses checks antes do merge, configure as regras de proteção da branch no GitHub; a criação do workflow não altera essas regras.

Os relatórios das [fases 3](../fase3-validacao.md) e [4](../fase4-validacao.md) registram as verificações e o aceite visual dessas entregas. As fixtures de navegador em `apps/backend/tests/fixtures/` também exigem bancos isolados.

## Diagnóstico rápido

| Sintoma | O que conferir |
| --- | --- |
| API não inicia | Redis acessível, `REDIS_URL` e configuração Firebase válida |
| Erro de conexão com PostgreSQL | Container saudável, porta publicada e `DATABASE_URL` |
| Catálogo vazio / sem horários | Serviços e profissionais ativos, habilitações, expediente, bloqueios e antecedência |
| Login não mantém sessão | `VITE_API_URL`, `FRONTEND_ORIGIN` e uso consistente de `localhost` ou `127.0.0.1` |
| `PERFIL_INCOMPLETO` | CPF, telefone e endereço obrigatório pelo fluxo de perfil |
| `HORARIO_INDISPONIVEL` | Atualizar disponibilidade e selecionar outro horário |
| `COTACAO_ALTERADA` | Exibir o novo resumo e confirmar novamente |
| Migração abortada | Executar a auditoria correspondente e tratar os registros indicados |

Ao desenvolver as próximas etapas do trabalho, atualize os guias afetados e registre as mudanças e suas verificações para facilitar o acompanhamento pela equipe e a apresentação na disciplina.
