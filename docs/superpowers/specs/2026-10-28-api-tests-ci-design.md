# Testes da API e E2E HTTP

## Escopo aprovado

Adicionar testes relevantes à API e validar localmente com lint, typecheck e testes. Os E2E são apenas por HTTP: sem navegador e sem Playwright. A entrega mantém somente os testes e seus comandos locais; CI automatizado fica fora do escopo atual.

## Abordagem

- Manter Vitest/Supertest para testes unitários e de integração existentes.
- Acrescentar casos de limites nos parsers e segurança de autenticação/sessão.
- Executar E2E em suíte separada: compilar o backend, iniciar `dist/server.js` em processo filho e usar `fetch` por TCP com cookies reais, sem importar a aplicação no processo de teste.
- Validar cadastro/login/logout e persistência de pets; configuração operacional por ADMIN, consulta de disponibilidade, cotação, reserva, conflito, cancelamento e liberação do horário.
- Usar datas futuras relativas ao dia da execução. Não adicionar relógio ou endpoint de teste ao produto.
- Usar exclusivamente PostgreSQL `petshop_test` e Redis DB `/15`. As suítes que recriam dados devem rodar sequencialmente.
- Fixar configuração Firebase fictícia nos testes, sem credenciais privadas ou chamadas ao Google. Autenticação Google fica nos testes de integração com verificação do provedor simulada.

## Execução local

Executar lint e typecheck de backend, frontend e testes. Preparar PostgreSQL e Redis isolados, aplicar migrações e executar a suíte principal e os E2E em sequência. O comando E2E compila o backend antes de iniciar o servidor real. Relatórios JUnit podem ser gerados localmente em `apps/backend/test-results/`.

## Plano de execução e aceite

1. Registrar baseline: 77 testes existentes, lint e typecheck dos dois apps.
2. Adicionar casos novos e confirmar a reprodução da dependência indevida das credenciais locais.
3. Separar configuração/comando E2E, definir ambiente de teste e iniciar/encerrar o servidor com limites de tempo.
4. Documentar execução local e limites (sem cobertura de navegador e sem Google real).
5. Executar lint, typecheck, build, testes existentes/novos e E2E; validar o diff.

Preservar a alteração local anterior em `.env.example`, mantendo-a fora desta entrega.
