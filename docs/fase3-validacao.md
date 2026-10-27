# Verificação da fase 3

Verificação executada no ambiente local isolado em 27/10/2026.

## Automação

- `pnpm --filter @petshop/backend test`: **57 testes passaram, em 11 arquivos**.
- Typecheck e lint de backend e frontend: passaram.
- Builds de backend e frontend: passaram.
- `prisma migrate deploy` em base vazia: quatro migrações aplicadas, incluindo agenda real.
- `prisma migrate status` no banco de teste: schema atualizado.
- `git diff --check`: sem erros.

A suíte cobre disponibilidade com relógio controlado (pausa, fechamento, fim de semana, bloqueios, antecedência exata, duração de 45 minutos, UTC/São Paulo e frações de duração histórica); catálogo e habilitação; campos controlados; titularidade; filtros; prazos e permissões; idempotência e estados finais; conservação do contrato; rollback de reagendamento e auditoria; concorrência real de criação, reagendamento, cancelamento, configuração e elegibilidade; exclusão GiST em escritas diretas; tradução do erro SQL em 409; migração legada com aborto e preservação de vínculos; auditoria antes/depois do novo schema; contratos Swagger; cliente HTTP e calendário do frontend.

## Aceite no navegador

Executado com `agent-browser`, frontend na porta 25173 e API na 25000, ambos usando PostgreSQL `petshop_test` e Redis `/15`. Dados demonstrativos exclusivos de `apps/backend/tests/fixtures/browser.ts`.

- Pet cadastrado pelo formulário real e carregado nas telas de agendamento.
- Serviço e consulta confirmados pela interface, com dados carregados da API; consulta com profissional habilitado e observações.
- Reservas consultadas no perfil após recarga.
- Serviço reagendado pela tela correspondente, com pet e serviço bloqueados; nova data persistida no perfil.
- Cancelamento confirmado na interface e refletido no histórico.
- Atendimento passado de fixture concluído por `PATCH /agendamentos/:id/status` usando sessão ADMIN; histórico do cliente exibiu CONCLUIDO.
- Conflito real: outra requisição reservou o slot selecionado antes da confirmação. A interface exibiu 409, atualizou horários, preservou pet, serviço e data e bloqueou envio sem novo slot.
- Falha de rede simulada somente no navegador para disponibilidade: mensagem de erro e recuperação pelo botão Tentar novamente.
- Estado sem slots: mensagem de vazio na composição do calendário.
- Resposta de novembro atrasada artificialmente enquanto o usuário navegava para dezembro: calendário e dias disponíveis permaneceram em dezembro.
- Navegação mensal e alinhamento dos dias conferidos; desktop em 1280×900 e mobile em 390×844. Na viewport mobile de serviço, `scrollWidth === innerWidth === 390`.
- Telas comparadas com `apps/frontend-html/servicos.html` e `consultas.html`. Serviços mantém painel de detalhes 5/12 e formulário 7/12; consultas mantém cartões e coluna de agenda/resumo. Calendário mensal, placeholders e conteúdo real substituem os elementos demonstrativos previstos no plano.

Capturas locais de QA (não são assets do produto):

- `/tmp/fase3-servicos-desktop-final.png`
- `/tmp/fase3-servicos-mobile-final.png`
- `/tmp/fase3-consultas-desktop.png`
- `/tmp/fase3-consultas-mobile.png`
- `/tmp/fase3-perfil-mobile.png`
- `/tmp/fase3-servicos-conflito-mobile.png`
- `/tmp/fase3-servicos-vazio-mobile.png`

A suíte de integração recria dados e sessões do banco de teste. Para repetir o aceite, execute a fixture depois da suíte. Nenhuma migração ou cadastro foi aplicado ao banco de desenvolvimento/produção. Não houve publicação de branch ou PR.
