import { Agendamento, Prisma, StatusAgendamento } from '@prisma/client';
import prisma from '../lib/prisma';
import { cotar, cotacaoPublica, reservar, finalizar, situacaoBeneficio } from './fidelidadePrograma';
import { preco, booleano } from '../lib/parsers';
import { Contexto, autorizar, escopo } from '../lib/authorization';
import { conflict, existeOu404, forbidden, HttpError } from '../lib/errors';
import { dataHora, enumeracao, idReferencia, obrigatorio, opcional, parseAtualizacao, parseCriacao } from '../lib/parsers';
import { Configuracao, instanteLocal, objetoEstrito, somaDias } from '../lib/agenda';
import { AgendaDb, bloquearAgendamento, relacoesAgendamento, transacaoAgenda } from '../repositories/agendaRepository';
import { configuracao, disponibilidade, idQuery, janela, textoCurto, validarHorario } from './agendaService';

const campos = { animalId: obrigatorio(idReferencia), servicoId: obrigatorio(idReferencia), funcionarioId: obrigatorio(idReferencia), dataHoraIni: obrigatorio(dataHora), observacoes: opcional(textoCurto) };
const editaveis = { funcionarioId: campos.funcionarioId, dataHoraIni: campos.dataHoraIni, observacoes: campos.observacoes };
const formatar = <T extends Agendamento>(r: T) => ({ ...r, situacaoBeneficio: situacaoBeneficio(r), precoBase: r.precoBase === null ? null : Number(r.precoBase), desconto: Number(r.desconto), precoContratado: r.precoContratado === null ? null : Number(r.precoContratado) });
const acoes = (r: Agendamento, ctx: Contexto | undefined, config: Configuracao) => {
  const antecedencia = (r.dataHoraIni.getTime() - Date.now()) / 3600000;
  const aberto = r.status === 'AGENDADO';
  return {
    podeCancelar: aberto && (ctx?.role === 'ADMIN' || ctx?.role === 'FUNCIONARIO' || antecedencia >= config.antecedenciaCancelamentoHoras),
    podeReagendar: aberto && antecedencia > 0 && (ctx?.role === 'ADMIN' || ctx?.role === 'CLIENTE' && antecedencia >= config.antecedenciaReagendamentoHoras),
  };
};
async function buscar(db: AgendaDb, id: number, ctx?: Contexto) {
  const scope = escopo('agendamento', ctx);
  const r = await existeOu404(db.agendamento.findUnique({ where: { id }, include: relacoesAgendamento }), 'Agendamento não encontrado.');
  if (scope.usuarioId && r.usuarioId !== scope.usuarioId || scope.funcionarioId && r.funcionarioId !== scope.funcionarioId) throw forbidden();
  return r;
}
export async function list(ctx?: Contexto, query: Record<string, unknown> = {}) {
  const where: Prisma.AgendamentoWhereInput = escopo('agendamento', ctx);
  if (query.status !== undefined) where.status = enumeracao(StatusAgendamento)(query.status, 'status');
  if (query.dataInicio !== undefined || query.dataFim !== undefined) {
    const range = janela(query);
    where.dataHoraIni = { gte: instanteLocal(range.dataInicio, '00:00'), lt: instanteLocal(somaDias(range.dataFim, 1), '00:00') };
  }
  const [registros, config] = await Promise.all([prisma.agendamento.findMany({ where, include: relacoesAgendamento, orderBy: { dataHoraIni: 'asc' } }), configuracao()]);
  return registros.map(r => ({ ...formatar(r), ...acoes(r, ctx, config) }));
}
export const getById = async (id: number, ctx?: Contexto) => { const r = await buscar(prisma, id, ctx); return { ...formatar(r), ...acoes(r, ctx, await configuracao()) }; };
function snapshot(r: Agendamento): Prisma.InputJsonObject {
  return { dataHoraIni: r.dataHoraIni.toISOString(), dataHoraFim: r.dataHoraFim.toISOString(), funcionarioId: r.funcionarioId, status: r.status, precoContratado: r.precoContratado === null ? null : Number(r.precoContratado), duracaoContratadaMin: r.duracaoContratadaMin, precoBase: r.precoBase === null ? null : Number(r.precoBase), desconto: Number(r.desconto), elegivelFidelidade: r.elegivelFidelidade, beneficioId: r.beneficioId, situacaoBeneficio: situacaoBeneficio(r) };
}
async function evento(db: AgendaDb, depois: Agendamento, ctx: Contexto, acao: string, antes?: Agendamento, motivo?: string | null) {
  await db.eventoAgendamento.create({ data: { agendamentoId: depois.id, autorId: ctx.id, acao, motivo, ...(antes ? { antes: snapshot(antes) } : {}), depois: snapshot(depois) } });
}
export async function create(body: unknown, ctx?: Contexto) {
  autorizar('agendamento', false, ctx);
  const entrada = objetoEstrito(body, [...Object.keys(campos), 'cotacaoEsperada']); const dados = parseCriacao(campos, entrada);
  const esperada = entrada.cotacaoEsperada === undefined ? undefined : validarCotacao(entrada.cotacaoEsperada);
  return transacaoAgenda(async db => {
    const animal = await existeOu404(db.animal.findUnique({ where: { id: dados.animalId } }), 'Animal não encontrado.');
    if (ctx!.role === 'CLIENTE' && animal.usuarioId !== ctx!.id) throw forbidden('Animal não pertence à conta.');
    const contrato = await validarHorario(db, dados);
    const cotacao = await cotar(db, animal.usuarioId, dados.servicoId);
    if (esperada && JSON.stringify(esperada) !== JSON.stringify(cotacaoPublica(cotacao))) throw new HttpError(409, 'A cotação mudou. Confira o resumo e confirme novamente.', 'COTACAO_ALTERADA');
    const { fidelidadeId: _fidelidade, ...valores } = cotacao;
    const r = await db.agendamento.create({ data: { ...dados, ...contrato, ...valores, usuarioId: animal.usuarioId, status: 'AGENDADO' }, include: relacoesAgendamento });
    await reservar(db, r, cotacao, ctx!);
    await evento(db, r, ctx!, 'CRIACAO');
    return formatar(r);
  });
}
export async function update(id: number, body: unknown, ctx?: Contexto) {
  autorizar('agendamento', false, ctx);
  return transacaoAgenda(async db => {
    await bloquearAgendamento(db, id); const atual = await buscar(db, id, ctx);
    if (atual.status !== 'AGENDADO') throw conflict('Somente agendamentos em aberto podem ser alterados.');
    objetoEstrito(body, Object.keys(editaveis)); const dados = parseAtualizacao(editaveis, body);
    const reagendar = dados.dataHoraIni !== undefined || dados.funcionarioId !== undefined;
    let fim: Date | undefined;
    if (reagendar) {
      const config = await configuracao(db);
      const agora = new Date();
      if (atual.dataHoraIni <= agora || ctx!.role === 'CLIENTE' && atual.dataHoraIni.getTime() - agora.getTime() < config.antecedenciaReagendamentoHoras * 3600000) throw conflict('Prazo para reagendamento encerrado.');
      const validado = await validarHorario(db, { dataHoraIni: dados.dataHoraIni ?? atual.dataHoraIni, servicoId: atual.servicoId, funcionarioId: dados.funcionarioId ?? atual.funcionarioId, duracaoMin: atual.duracaoContratadaMin, ignorarId: id, antecedenciaHoras: ctx!.role === 'ADMIN' ? 0 : config.antecedenciaReagendamentoHoras });
      fim = validado.dataHoraFim;
    }
    const r = await db.agendamento.update({ where: { id }, data: { ...dados, ...(fim ? { dataHoraFim: fim } : {}) }, include: relacoesAgendamento });
    await evento(db, r, ctx!, reagendar ? 'REAGENDAMENTO' : 'OBSERVACOES', atual);
    return formatar(r);
  });
}
export async function status(id: number, body: unknown, ctx?: Contexto) {
  // Escopo permite ao profissional responsável executar apenas esta operação de escrita.
  escopo('agendamento', ctx);
  const b = objetoEstrito(body, ['status', 'motivo']);
  const novo = enumeracao(StatusAgendamento)(b.status, 'status');
  const motivo = textoCurto(b.motivo, 'motivo');
  if (novo === 'AGENDADO') throw conflict('Estados finais não podem ser reabertos.');
  return transacaoAgenda(async db => {
    await bloquearAgendamento(db, id); const atual = await buscar(db, id, ctx);
    if (ctx!.role === 'CLIENTE' && novo !== 'CANCELADO') throw forbidden();
    if (atual.status === novo) return formatar(atual);
    if (atual.status !== 'AGENDADO') throw conflict('Transição de estado incompatível.');
    const config = await configuracao(db), agora = new Date();
    if (ctx!.role === 'CLIENTE' && atual.dataHoraIni.getTime() - agora.getTime() < config.antecedenciaCancelamentoHoras * 3600000) throw conflict('Prazo para cancelamento encerrado.');
    if (novo !== 'CANCELADO' && agora < atual.dataHoraFim) throw conflict('Aguarde o término previsto do atendimento.');
    const r = await db.agendamento.update({ where: { id }, data: { status: novo }, include: relacoesAgendamento });
    await finalizar(db, r, ctx!);
    await evento(db, r, ctx!, novo, atual, motivo);
    return formatar(r);
  });
}
export async function disponibilidadeReagendamento(id: number, query: Record<string, unknown>, ctx?: Contexto) {
  autorizar('agendamento', false, ctx);
  const range = janela(query, 31);
  return prisma.$transaction(async db => {
    const atual = await buscar(db, id, ctx);
    if (atual.status !== 'AGENDADO') throw conflict('Agendamento encerrado.');
    const config = await configuracao(db);
    const r = await disponibilidade(db, { ...range, servicoId: atual.servicoId, duracaoMin: atual.duracaoContratadaMin, ignorarId: id, funcionarioId: query.funcionarioId === undefined ? undefined : idQuery(query.funcionarioId, 'funcionarioId'), antecedenciaHoras: ctx!.role === 'ADMIN' ? 0 : config.antecedenciaReagendamentoHoras });
    return { ...r, preco: atual.precoContratado === null ? null : Number(atual.precoContratado), slots: r.slots.map(s => ({ ...s, preco: atual.precoContratado === null ? null : Number(atual.precoContratado) })) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

function validarCotacao(body: unknown) {
  const b = objetoEstrito(body, ['precoBase', 'desconto', 'precoContratado', 'elegivelFidelidade', 'beneficioId']);
  return { precoBase: preco(b.precoBase, 'precoBase'), desconto: preco(b.desconto, 'desconto'), precoContratado: preco(b.precoContratado, 'precoContratado'), elegivelFidelidade: booleano(b.elegivelFidelidade, 'elegivelFidelidade'), beneficioId: b.beneficioId === null ? null : idReferencia(b.beneficioId, 'beneficioId') };
}
export async function previa(body: unknown, ctx?: Contexto) {
  autorizar('agendamento', false, ctx);
  objetoEstrito(body, Object.keys(campos)); const dados = parseCriacao(campos, body);
  return prisma.$transaction(async db => {
    const animal = await existeOu404(db.animal.findUnique({ where: { id: dados.animalId } }), 'Animal não encontrado.');
    if (ctx!.role === 'CLIENTE' && animal.usuarioId !== ctx!.id) throw forbidden('Animal não pertence à conta.');
    await validarHorario(db, dados);
    return cotacaoPublica(await cotar(db, animal.usuarioId, dados.servicoId));
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
