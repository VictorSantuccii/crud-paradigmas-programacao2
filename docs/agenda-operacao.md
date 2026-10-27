# Operação da agenda — fase 3

A API e as telas de serviços, consultas e perfil usam reservas persistidas. Pagamentos, prontuário, fidelidade automática e painel de administração ficam para as fases seguintes.

## Preparar e migrar uma instalação

1. Faça backup e suspenda escritas durante a atualização do schema.
2. Gere o cliente: `pnpm --filter @petshop/backend prisma:generate`.
3. Audite o legado: `pnpm --filter @petshop/backend auditoria:agenda`. O comando é somente leitura e funciona antes e depois da migração. Informa IDs com fim anterior/igual ao início e pares sobrepostos por profissional, inclusive intervalos contidos. Após a migração, considera apenas AGENDADO/CONCLUIDO para sobreposição; código de saída 1 indica intervenção necessária.
4. Corrija os registros identificados explicitamente com os responsáveis pelos dados. A migração não exclui nem cancela registros. Depois, repita a auditoria.
5. Execute `pnpm --filter @petshop/backend exec prisma migrate deploy`. PostgreSQL precisa disponibilizar a extensão `btree_gist`; a migração executa `CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public`. Em serviços gerenciados, peça ao operador para habilitá-la se o usuário da migração não tiver permissão. Os IDs e vínculos são preservados.
6. Reinicie a API com o novo cliente Prisma. Configure catálogo e equipe via APIs ADMIN autenticadas.

A migração repete a auditoria antes de alterar o domínio e aborta com os IDs em conflito. Havendo falha de uma migração Prisma, corrija a causa e siga o procedimento de recuperação de migrations do Prisma antes de reaplicar; não marque uma migração incompleta como aplicada. Não use `db push` no lugar de `migrate deploy`: a exclusão GiST e os CHECKs são SQL mantidos na migração.

Serviços antigos ficam `ativo: false`, `categoria: null`. Funcionários antigos ficam inativos, sem habilitações inferidas a partir do cargo. Reservas antigas ficam `AGENDADO`; não inferimos conclusão pela data. `precoContratado` histórico desconhecido é `null`; `duracaoContratadaMin` vem do intervalo de tempo efetivamente registrado, preservando inclusive frações de minuto. Nenhum evento de criação ou autor histórico é inventado.

## Configuração inicial

O único dado operacional inserido na migração é a configuração global:

- Fuso: `America/Sao_Paulo` (único suportado nesta versão).
- Segunda a sexta: `09:00–12:00` e `13:00–18:00`; fim de semana sem intervalos.
- Inícios a cada 30 minutos, ancorados no início de cada intervalo.
- Antecedência inicial de criação, cancelamento e reagendamento: 24 horas exatas.
- Preço e duração por serviço, sem variação por porte.

`GET /configuracao-agenda` e `PUT /configuracao-agenda` exigem ADMIN. PUT substitui todos os campos, sem `id`:

```json
{
  "fuso": "America/Sao_Paulo",
  "intervaloSlotMin": 30,
  "antecedenciaCriacaoHoras": 24,
  "antecedenciaCancelamentoHoras": 24,
  "antecedenciaReagendamentoHoras": 24,
  "intervalos": [
    { "diaSemana": 1, "inicio": "09:00", "fim": "12:00" },
    { "diaSemana": 1, "inicio": "13:00", "fim": "18:00" }
  ]
}
```

O exemplo abre somente segunda-feira: para manter os outros dias, envie seus intervalos também. `diaSemana`: 0 domingo, 6 sábado. `intervalos: []` fecha a operação para novas reservas. Intervalos não podem atravessar a meia-noite ou se sobrepor no mesmo dia. Slots têm 1–1440 minutos; antecedências são inteiros positivos até 8760 horas.

## Cadastrar catálogo e habilitar profissionais

Use a sessão de ADMIN provisionada pelo comando local de bootstrap, conforme o README. Exemplo de `POST /servicos`:

```json
{ "nome": "Nome do atendimento", "descricao": "Descrição oferecida pela operação", "categoria": "CONSULTA", "duracaoMin": 45, "preco": 100, "ativo": true }
```

Categorias: `CONSULTA` ou `BANHO_TOSA`. Cada especialidade é um serviço de consulta; não há entidade de especialidade separada. Preço aceita duas casas decimais; duração é um inteiro positivo. Ativo é opcional na criação e começa falso. Novos serviços exigem categoria. `GET /servicos/administracao` (ADMIN) inclui inativos e legados sem classificação. Classifique legados com `PUT /servicos/:id`; ative apenas após revisão. `GET /servicos` e `GET /servicos/:id` são públicos e incluem apenas ativos classificados. Filtro opcional `categoria=CONSULTA` ou `BANHO_TOSA`.

`POST /funcionarios` e `PUT /funcionarios/:id` aceitam `nome`, `cargo`, `telefone`, `ativo` e `servicoIds`. Na criação, ativo começa falso e lista de habilitações vazia. PUT preserva campos omitidos e **substitui** a lista quando `servicoIds` é enviado; `[]` remove todas as habilitações. Cargo não determina quais serviços o funcionário executa. Vincule a conta de FUNCIONARIO pelo contrato administrativo de `/usuarios`. `GET /servicos/:id/profissionais` é público e retorna somente ID, nome e cargo dos ativos habilitados, sem telefone ou conta.

Nenhum serviço, profissional, avaliação, registro profissional ou foto fictícia é cadastrado em produção. As telas mostram os placeholders do perfil. Catálogo vazio é um estado esperado antes da configuração.

## Bloqueios extraordinários

`GET/POST /bloqueios-agenda` e `DELETE /bloqueios-agenda/:id` exigem ADMIN. DELETE retorna 204. POST recebe início/fim ISO 8601 com offset e motivo opcional (até 300 caracteres):

```json
{ "inicio": "2026-12-25T00:00:00-03:00", "fim": "2026-12-26T00:00:00-03:00", "funcionarioId": null, "motivo": "Fechamento" }
```

Omitir `funcionarioId` ou enviar `null` bloqueia todos. Informe um ID para indisponibilidade de um profissional. Mudanças de configuração, ativação, habilitação e bloqueios impedem novas reservas, sem cancelar ou alterar reservas existentes.

## Disponibilidade

`GET /disponibilidade?servicoId=1&dataInicio=2026-11-02&dataFim=2026-11-30&funcionarioId=1` é público. Datas locais inclusivas, estritas `YYYY-MM-DD`, janela máxima de 31 dias. Profissional é opcional; sem ele, retorna alternativas por profissional.

A resposta contém `fuso`, `preco`, `duracaoMin` e `slots`. Cada slot informa `data`, `inicio`, `fim` (ISO 8601 com offset), profissional mínimo, preço e duração. Não expõe clientes, pets, observações ou reservas ocupantes. O atendimento inteiro deve caber em um intervalo de expediente, sem atravessar pausa, fechamento, bloqueio ou reserva AGENDADO/CONCLUIDO. Serviços/profissionais inativos e profissionais não habilitados não oferecem slots. Antecedência exata é aceita. Disponibilidade é uma consulta; outra requisição pode reservar o slot antes da confirmação.

Para reagendamento, use `GET /agendamentos/:id/disponibilidade` com `dataInicio`, `dataFim`, `funcionarioId?`. Exige titular ou ADMIN, usa a duração contratada e exclui a própria reserva do cálculo; preserva preço histórico inclusive nulo. Este endpoint evita usar duração nova do catálogo em reservas antigas.

## Criar, consultar e reagendar

`POST /agendamentos` recebe somente `animalId`, `servicoId`, `funcionarioId`, `dataHoraIni` e `observacoes?` (até 300 caracteres). Titular deriva do animal; CLIENTE só usa pets próprios e ADMIN cria para o dono do animal selecionado. O servidor calcula fim, preço, duração e estado inicial. Campos desconhecidos ou controlados (`usuarioId`, `dataHoraFim`, preço, duração, estado etc.) retornam 400.

`GET /agendamentos` e `GET /agendamentos/:id` mantêm escopo por papel: titular, profissional responsável ou ADMIN. A lista aceita `status` e o par `dataInicio/dataFim` (datas locais inclusivas, filtro pelo início da reserva). Retorna relações mínimas de pet, serviço e profissional, contrato, estado, observações e permissões atuais `podeCancelar`/`podeReagendar` para a interface. Não expõe contas de terceiros. ID inexistente retorna 404; registro fora do escopo retorna 403. Sessão ausente/expirada retorna 401; perfil incompleto mantém `PERFIL_INCOMPLETO`.

`PUT /agendamentos/:id` recebe `dataHoraIni?`, `funcionarioId?`, `observacoes?`. Somente CLIENTE titular ou ADMIN, enquanto AGENDADO. Pet, serviço, titular e valores contratados são imutáveis. Reagendamento de cliente exige antecedência da reserva original **e** do novo início. ADMIN pode escolher dentro das 24h, desde que nem a reserva original nem o novo horário tenham começado e haja disponibilidade. Profissional não altera esses campos. Falha preserva a reserva original e sua auditoria.

As duas telas compartilham contratos/carregamento e descartam respostas antigas. Mudança de serviço, profissional, data ou mês invalida o horário. Serviços escolhem profissional no slot; consultas mantêm o seletor de veterinário. Confirmação só aparece após persistência; envio pendente fica bloqueado. Em 409, os slots são atualizados e pet, serviço, data, profissional e observações válidos são mantidos.

## Estados e cancelamento (substitui DELETE)

**`DELETE /agendamentos/:id` foi retirado.** Use `PATCH /agendamentos/:id/status` com `{ "status": "CANCELADO", "motivo": "opcional" }`.

Só existem transições `AGENDADO → CONCLUIDO/CANCELADO/NAO_COMPARECEU`. Estados finais não reabrem. Repetir o mesmo estado final autorizado é idempotente, sem novo evento de auditoria. Transição incompatível retorna 409.

| Ator | Cancelar | Reagendar | Concluir / falta |
| --- | --- | --- | --- |
| CLIENTE titular | Até a antecedência configurada (inicial 24h) | Mesmo prazo sobre início original e novo início | Proibido |
| FUNCIONARIO responsável | Permitido | Proibido | Só após o fim previsto, inclusive exatamente no fim |
| ADMIN | Permitido | Antes do início original e novo início, respeitando disponibilidade | Só após o fim previsto |

CONCLUIDO continua ocupando o intervalo; CANCELADO e NAO_COMPARECEU liberam. Histórico não contém diagnóstico, vacina ou receita. Perfil e Meus Pets usam os mesmos dados e oferecem ações autorizadas.

## Integridade e auditoria

PostgreSQL usa exclusão GiST com `btree_gist`: profissional + `tsrange(início, fim, '[)')`, restrita a AGENDADO/CONCLUIDO. Instantes são persistidos em UTC nas colunas timestamp existentes. Intervalos adjacentes são permitidos. Escritas fora da API também não podem criar sobreposição; elas continuam responsáveis pelas demais regras operacionais.

Criação, reagendamento e transições gravam reserva/evento em uma única transação. Evento registra autor, instante, ação, motivo opcional, estado/horário/profissional anterior e posterior e contrato. Atualização de observações também registra ação sem replicar seu conteúdo na auditoria. Não há exclusão de auditoria na API.

A API usa `pg_advisory_xact_lock(30003)` para serializar escritas da agenda, catálogo e habilitações; mudanças na mesma reserva também usam `FOR UPDATE`. O lock global prioriza consistência nesta fase e limita a capacidade de escrita concorrente. Leituras de disponibilidade usam snapshot consistente. Violação da exclusão e slots indisponíveis retornam HTTP 409 com `code: HORARIO_INDISPONIVEL`. Regras de prazo/estado retornam 409 com mensagem específica. Consultas prévias não substituem a restrição de banco.

## Verificação isolada

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
```

A suíte exige o banco `petshop_test` e Redis `/15`. Não aponte testes ao banco de desenvolvimento/produção: fixtures truncam tabelas. Migrações legadas são verificadas em schemas separados. Fixtures de catálogo ficam em `tests/`; não há seed operacional demonstrativo. O PostgreSQL de teste usa tmpfs e perde os dados quando o container é removido.
