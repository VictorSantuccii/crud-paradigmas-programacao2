# Testes da API e CI de Pull Requests

## Escopo aprovado

Adicionar testes relevantes à API e validar cada PR com lint, typecheck e testes. O usuário escolheu E2E apenas por HTTP: sem navegador e sem Playwright.

## Abordagem

- Manter Vitest/Supertest para testes unitários e de integração existentes.
- Acrescentar casos de limites nos parsers e segurança de autenticação/sessão.
- Executar E2E em suíte separada: compilar o backend, iniciar `dist/server.js` em processo filho e usar `fetch` por TCP com cookies reais, sem importar a aplicação no processo de teste.
- Validar cadastro/login/logout e persistência de pets; configuração operacional por ADMIN, consulta de disponibilidade, cotação, reserva, conflito, cancelamento e liberação do horário.
- Usar datas futuras relativas ao dia da execução. Não adicionar relógio ou endpoint de teste ao produto.
- Usar exclusivamente PostgreSQL `petshop_test` e Redis DB `/15`. As suítes que recriam dados devem rodar sequencialmente.
- Fixar configuração Firebase fictícia nos testes, sem credenciais privadas ou chamadas ao Google. Autenticação Google fica nos testes de integração com verificação do provedor simulada.

## CI

GitHub Actions em `pull_request` (abertura, reabertura e novos commits), push em `main` e execução manual. Dois jobs independentes: qualidade (lint/typecheck) e testes (PostgreSQL 16/Redis 7 com health checks, migrações, suíte atual e E2E em sequência). Instalação com pnpm do `packageManager` e lockfile congelado; Node 24. Permissão somente de leitura do repositório e cancelamento de execução obsoleta do mesmo PR. Relatórios JUnit preservados como artefatos, inclusive em falha.

## Plano de execução e aceite

1. Registrar baseline: 77 testes existentes, lint e typecheck dos dois apps.
2. Adicionar casos novos e confirmar a reprodução da dependência indevida das credenciais locais.
3. Separar configuração/comando E2E, definir ambiente de teste e iniciar/encerrar o servidor com limites de tempo.
4. Criar workflow e documentar execução local e limites (sem cobertura de navegador e sem Google real).
5. Executar lint, typecheck, build, testes existentes/novos e E2E; validar sintaxe do workflow e diff.

Preservar a alteração local anterior em `.env.example`, mantendo-a fora desta entrega.
