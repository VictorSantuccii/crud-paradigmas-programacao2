# Verificação da fase 4

Validação local em 28/10/2026, exclusivamente no PostgreSQL `petshop_test` (25432) e Redis `/15` (26379). Nenhuma migração ou fixture foi aplicada ao banco de desenvolvimento/produção. Sem publicação no GitHub.

## Automação

- Suíte backend: **77 testes passaram em 15 arquivos**.
- Typecheck e lint de backend e frontend: passaram.
- Builds de backend (incluindo Prisma Client) e frontend: passaram.
- `prisma validate`: schema válido.
- `prisma migrate deploy`: as cinco migrações aplicadas em base vazia isolada.
- `prisma migrate status`: banco atualizado.
- `git diff --check`: sem erros.

A suíte cobre as fases anteriores e os cenários novos:

| Área | Evidência automatizada |
| --- | --- |
| Contagem | Sete sem benefício, oito com um, dezesseis com dois; pets compartilham saldo; gratuito, valor zero, inelegível e estados sem conclusão paga não contam |
| Concorrência e repetição | Mesmo atendimento concluído simultaneamente conta uma vez; duas conclusões cruzando a meta preservam progresso; duas criações disputando um benefício reservam apenas uma vez |
| Ciclo | Mais antigo primeiro; ordem de criação prevalece sobre horário; reserva, consumo, devolução por cancelamento/falta e reutilização; reagendamento mantém reserva |
| Contrato | Decimal e desconto integral; alterações posteriores de preço/elegibilidade não alteram valores contratados; nenhuma retroatividade; cotações obsoletas por preço/elegibilidade/benefício retornam 409 sem criar reserva |
| Rollback | Falhas injetadas em evento de criação/conclusão/cancelamento e movimento de emissão revertem contrato, benefício, projeções, status e auditoria juntos |
| Segurança | Titularidade, sessão, ADMIN em ajustes/serviço, motivo obrigatório, inteiros e limite 0–7; funcionário restrito às transições; mutações genéricas ausentes; exclusão de usuário com histórico bloqueada |
| Integridade SQL | Checks de saldo, preço, categoria, autor e vínculos; reservas cruzadas rejeitadas; emissão a partir de contrato inelegível e movimento de outro titular rejeitados |
| Migração | Base vazia, importação de contador/flag e estado original, aborto com diagnóstico, auditoria antes/depois, preservação de IDs/relações/preço e histórico sem elegibilidade presumida |
| HTTP/frontend | Swagger atualizado e schema da cotação; helper de seleção invalida cotação de outro pet, profissional, horário ou seleção incompleta |

Os testes de migrações anteriores agora selecionam explicitamente as colunas da versão em exame. A expectativa do POST genérico de fidelidade foi atualizada para a remoção deliberada (404 com sessão válida).

## Aceite ponta a ponta

Executado com `agent-browser`, frontend em 25173 e API em 25000, ambos usando bancos isolados. `tests/fixtures/fidelidadeBrowser.ts` preparou dois pets, serviço explicitamente elegível e oito atendimentos ainda AGENDADO. A fixture não cria contagem nem benefício.

1. Sete atendimentos foram concluídos por `PATCH /agendamentos/:id/status` com sessão ADMIN de teste. Após recarga, perfil mostrou 7/8 e nenhum benefício.
2. A oitava conclusão pela API zerou progresso e emitiu um disponível. Perfil mostrou 0/8, um disponível e nenhuma reserva.
3. Pelo formulário real, selecionados Sol, banho elegível, data e horário. Prévia mostrou base R$ 89,90, desconto R$ 89,90, total R$ 0,00 e aviso de reserva. Confirmação criou contrato gratuito e mostrou Benefício reservado.
4. Cancelamento pelo perfil devolveu o saldo. Histórico conservou total R$ 0,00 e mostrou Benefício devolvido.
5. O mesmo benefício foi reutilizado pela interface para Lua, comprovando compartilhamento entre pets. Perfil passou a zero disponíveis e um reservado.
6. Reagendamento pela interface preservou base, desconto, total e ID do benefício.
7. Alterado somente o preço do catálogo de teste enquanto uma nova seleção paga tinha cotação anterior. Confirmação retornou COTACAO_ALTERADA; manteve pet/serviço/data/horário e mostrou novo total R$ 91,23. Nenhum novo agendamento foi criado e não houve reenvio automático.
8. Uma prévia foi atrasada no navegador. Confirmação ficou desabilitada; outra seleção recebeu sua prévia e a resposta antiga, liberada depois, não substituiu o horário mais recente.
9. Falhas de fetch simuladas somente no navegador para a prévia e saldo exibiram erro e permitiram nova tentativa. A confirmação permaneceu bloqueada sem cotação. O cartão com falha não exibiu saldo zero.
10. O relógio da API de QA foi avançado com preload temporário fora de `src/`, guardado para aceitar apenas os bancos de teste. A conclusão operacional do gratuito consumiu o benefício. Após recarga, perfil mostrou zero disponíveis/reservados, um utilizado e progresso 0/8. O contrato continuou com R$ 89,90 de desconto apesar da mudança posterior de catálogo.
11. Consulta exibiu preço base/total R$ 150,00, desconto zero e mensagem de não participação. A suíte também verifica consulta com benefício disponível sem aplicá-lo.

O preload do relógio e as interceptações de fetch são recursos locais do aceite; a aplicação não ganhou endpoint ou opção operacional para alterar o tempo. A suíte usa relógio controlado do Vitest nos testes próprios.

## Interface e capturas

Desktop 1280×900 e mobile 390×844. Serviços, perfil e consultas conferidos contra o React existente e os HTMLs de referência. A grade do resumo do perfil continua 1/2/4 colunas nos mesmos breakpoints; o quarto cartão conserva wrapper, cores, ícone, posição e tipografia. Nenhum cartão ou seção foi acrescentado à página. O resumo financeiro foi ampliado dentro do bloco existente.

A rota `/servicos` existente usa `BookingPage` (seleções em cartões e coluna de agenda/resumo); `ServiceBookingPage`, com os selects da referência histórica, não é a rota ativa. A fase 4 preserva a composição React ativa. Os HTMLs orientaram a conferência de tokens, grade responsiva, calendário e resumo.

Em mobile, `document.documentElement.scrollWidth === innerWidth === 390` no perfil, serviços e consultas. Sem erros JavaScript registrados pelo navegador.

| Captura | Estado |
| --- | --- |
| [Perfil desktop](capturas/fase4/perfil-desktop.png) | Oitavo concluído, um benefício disponível |
| [Prévia desktop](capturas/fase4/servicos-previa-desktop.png) | Base, desconto integral e aviso de reserva |
| [Prévia mobile](capturas/fase4/servicos-previa-mobile.png) | Mesmo fluxo em 390 px |
| [Cotação alterada](capturas/fase4/cotacao-mobile.png) | Novo total e necessidade de reconfirmar |
| [Consumo desktop](capturas/fase4/perfil-consumo-desktop.png) | Saldo recarregado após concluir gratuito |
| [Consumo mobile](capturas/fase4/perfil-consumo-mobile.png) | Cartão completo e saldo persistido |
| [Consulta desktop](capturas/fase4/consulta-desktop.png) | Prévia sem desconto |
| [Consulta mobile](capturas/fase4/consulta-mobile.png) | Mesmo resumo em 390 px |

## Ambiente local

Um comando Compose inicial usou o nome de projeto padrão e recriou a definição dos contêineres de desenvolvimento com o arquivo de testes, sem conseguir iniciá-los por conflito de portas. A configuração foi restaurada com `docker-compose.yml` e os volumes originais existentes. PostgreSQL/Redis de desenvolvimento foram conferidos saudáveis em 15432/16379, sem executar migrações neles. Os testes usaram somente o projeto `petshop-phase1-test`, em 25432/26379.

## Repetição

```bash
docker compose -p petshop-phase1-test -f .phase1-test-compose.yml up -d
DATABASE_URL=postgresql://petshop:test_password@localhost:25432/petshop_test pnpm --filter @petshop/backend exec prisma migrate deploy
pnpm --filter @petshop/backend test
pnpm --filter @petshop/backend typecheck
pnpm --filter @petshop/frontend typecheck
pnpm --filter @petshop/backend lint
pnpm --filter @petshop/frontend lint
pnpm --filter @petshop/backend build
pnpm --filter @petshop/frontend build
DATABASE_URL=postgresql://petshop:test_password@localhost:25432/petshop_test pnpm --filter @petshop/backend exec prisma validate
DATABASE_URL=postgresql://petshop:test_password@localhost:25432/petshop_test pnpm --filter @petshop/backend exec prisma migrate status
git diff --check
```

A suíte recria dados e limpa Redis `/15`. Para repetir o aceite, rode a fixture **depois** da suíte, com `DATABASE_URL` e `REDIS_URL` isolados. Ela exige e-mails/CPFs próprios ainda livres; a suíte limpa a base antes de uma nova rodada. A API deve iniciar a partir de `apps/backend`, como no comando de desenvolvimento do pacote, pois o Swagger resolve os arquivos de rotas relativos a esse diretório.
