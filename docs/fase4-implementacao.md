# Fase 4 — Fidelidade automática

A cada oito banhos elegíveis pagos e concluídos, o titular recebe um banho gratuito. O saldo reúne seus pets. Benefícios acumulam sem validade, são reservados automaticamente no próximo **novo** agendamento elegível e usados do mais antigo para o mais recente, por `criadoEm` e ID. A ordem cronológica dos atendimentos não interfere na reserva.

Concluir um gratuito consome a reserva e não conta para o próximo ciclo. Cancelamento ou falta devolvem o benefício, preservando preço e desconto históricos no contrato cancelado. Reagendamento conserva o contrato e a reserva. Consultas, serviços inelegíveis, valores zero e estados sem conclusão paga não incrementam o progresso. Agendamentos anteriores não recebem benefício retroativo.

## Modelo e transações

- `Servico.elegivelFidelidade` inicia em false. Somente ADMIN habilita explicitamente um serviço de categoria BANHO_TOSA. O nome não determina participação; um combo habilitado recebe gratuidade integral, sem decomposição de preço.
- `Agendamento` guarda elegibilidade contratada, `precoBase`, `desconto`, `precoContratado` final e `beneficioId`. Cálculos usam Prisma Decimal. Mudanças posteriores do catálogo não alteram contratos.
- `BeneficioFidelidade` representa cada benefício em DISPONIVEL, RESERVADO, CONSUMIDO ou REVOGADO. O vínculo de uso é único por agendamento; o contrato cancelado conserva a referência histórica mesmo depois da reutilização em outra reserva.
- `MovimentoFidelidade` registra IMPORTACAO, CONTAGEM, EMISSAO, RESERVA, LIBERACAO, CONSUMO e AJUSTE, com antes/depois, autor, instante, motivo e vínculos. Importações não inventam autor humano. Ajustes relacionam os IDs afetados no snapshot.
- `Fidelidade.progresso` é o saldo atual entre 0 e 7. `qntdServicos` espelha esse progresso; `beneficioAtivo` espelha a existência de benefícios disponíveis. Preços e autorização de uso consultam os benefícios individuais.

Criação, transições e ajustes usam `transacaoAgenda`: advisory lock global 30003, depois lock do agendamento quando aplicável, em READ COMMITTED. Contagem, emissão, projeções, status e auditoria são confirmados ou revertidos juntos. Repetição de estado final não gera movimento nem evento adicional. Estados finais não reabrem.

PostgreSQL impõe unicidade para contagem por agendamento, atendimento gerador e vínculo de uso. Checks protegem progresso, preço final, desconto, categoria, autor de movimentos e motivo de ajustes. Constraint triggers diferidos validam reciprocidade de reserva/contrato, estado, titular e vínculos de emissão/contagem/movimentos ao final da transação. FKs RESTRICT impedem apagar histórico, inclusive pela remoção do titular ou autor. Reservas liberadas continuam identificáveis pelos movimentos e pelo contrato original.

## Contratos HTTP

Todas as rotas privadas exigem sessão e perfil completo. Swagger: `/api-docs`.

| Operação | Permissão e comportamento |
| --- | --- |
| `GET /fidelidades/me` | CLIENTE ou ADMIN consulta o próprio saldo, derivado da sessão; não aceita titular por query |
| `GET /fidelidades` | CLIENTE recebe somente a própria; ADMIN lista todas |
| `GET /fidelidades/:id` | Titular ou ADMIN; outro titular recebe 403; ID ausente recebe 404 |
| `POST /fidelidades/:id/ajustes` | Exclusivo ADMIN, motivo obrigatório; alteração e auditoria atômicas |
| `POST /agendamentos/previa` | CLIENTE titular do pet ou ADMIN; valida a seleção e agenda sem gravar ou reservar |
| `POST /agendamentos` | Recalcula contrato dentro da transação; reserva o disponível mais antigo quando elegível |
| `PUT /agendamentos/:id` | Conserva contrato e benefício; mesmas permissões e políticas da agenda |
| `PATCH /agendamentos/:id/status` | Mantém escopo/prazos da fase 3; profissional responsável produz efeitos apenas pelas transições permitidas |

Funcionário não consulta nem ajusta saldos pelas rotas de fidelidade. A disponibilidade pública não expõe saldo, benefício ou dados pessoais.

Exemplo de saldo:

```json
{
  "id": 11,
  "meta": 8,
  "progresso": 3,
  "qntdServicos": 3,
  "beneficioAtivo": true,
  "beneficios": { "disponiveis": 1, "reservados": 0, "consumidos": 2, "revogados": 0 },
  "regra": "Descrição da regra do programa"
}
```

A prévia recebe `animalId`, `servicoId`, `funcionarioId`, `dataHoraIni` e `observacoes` opcional, os mesmos campos de seleção da criação. Retorna:

```json
{
  "precoBase": 89.9,
  "desconto": 89.9,
  "precoContratado": 0,
  "elegivelFidelidade": true,
  "beneficioId": 1
}
```

Na criação, o frontend sempre envia essa resposta em `cotacaoEsperada`, além da seleção. Se valores, elegibilidade ou benefício mudarem, o servidor responde **409 COTACAO_ALTERADA** sem criar agendamento ou reserva. O cliente mantém o formulário, busca nova prévia e exige outro clique de confirmação. Não reenvia automaticamente. Chamadas antigas que omitem `cotacaoEsperada` continuam válidas: o servidor calcula e devolve o contrato efetivo. Prévia não garante disponibilidade nem benefício até a confirmação transacional.

Respostas de agendamento incluem `precoBase`, `desconto`, `precoContratado`, `elegivelFidelidade`, `beneficioId` e `situacaoBeneficio` (null, RESERVADO, CONSUMIDO ou DEVOLVIDO). A situação descreve aquele contrato; uma reserva cancelada continua DEVOLVIDO mesmo que o benefício já tenha sido reutilizado. Contratos legados sem preço conhecido mantêm preço base/final nulos.

Ajuste administrativo:

```json
{ "progresso": 4, "variacaoBeneficios": -1, "motivo": "Correção após conferência do histórico" }
```

`progresso` é o saldo final inteiro 0–7; `variacaoBeneficios` é inteira; motivo deve conter texto não vazio de até 300 caracteres. Variação negativa revoga somente disponíveis, do mais recente ao mais antigo. Reserva ou consumo nunca são retirados. Saldo insuficiente retorna 409 e preserva todo o estado. Auditoria guarda autor, instante, motivo, saldo antes/depois e IDs emitidos/revogados.

**Incompatibilidade deliberada:** `POST /fidelidades`, `PUT /fidelidades/:id` e `DELETE /fidelidades/:id` foram retirados e retornam 404 com sessão válida. Use ajustes; criação ocorre com a conta. Não é permitido apagar fidelidade com histórico, nem removê-la por exclusão do usuário.

## Auditoria e migração

Antes de migrar base existente:

```bash
pnpm --filter @petshop/backend auditoria:fidelidade
pnpm --filter @petshop/backend exec prisma migrate deploy
pnpm --filter @petshop/backend exec prisma generate
```

Execute com `DATABASE_URL` do ambiente correto. A auditoria usa SQL compatível com o schema anterior e informa IDs, contador, flag e titular original. Contadores fora de 0–7 exigem saneamento explícito; a migração aborta com `id=contador` no diagnóstico e não normaliza valores silenciosamente.

A migration `20261028000000_fidelidade_automatica` importa o contador como progresso e `beneficioAtivo=true` como um benefício disponível. Cada fidelidade recebe um movimento IMPORTACAO com o estado original. Não reconta atendimentos anteriores nem deduz elegibilidade por nome. Serviços e contratos existentes começam não elegíveis; preços, IDs e relações existentes são preservados. Preço base do histórico copia o preço contratado conhecido, ou permanece null quando desconhecido.

## Interface

O quarto cartão do resumo do perfil, antes Conta, apresenta progresso e benefícios na mesma posição, grade, cores e tipografia. Carregamento, falha e nova tentativa são explícitos; falha nunca se apresenta como saldo zero. O saldo recarrega ao entrar/retornar à página, focar a janela e após criação/cancelamento.

O resumo existente de serviços/consultas usa a prévia do servidor e mostra preço base, desconto e total. Antes da confirmação informa que o benefício será reservado; depois mostra a situação efetiva. Reagendamento usa o contrato original. AbortController e chave de seleção impedem aplicação de prévias antigas; confirmação fica bloqueada sem prévia válida.

Painel de equipe/administração, pagamentos, notificações e publicação no GitHub não fazem parte desta fase. Veja [evidências de validação](fase4-validacao.md).
