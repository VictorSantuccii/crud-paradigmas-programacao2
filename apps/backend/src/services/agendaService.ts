import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { Contexto } from '../lib/authorization';
import { badRequest, existeOu404, forbidden, unauthorized } from '../lib/errors';
import { data, dataHora, idReferencia, parseIdParam } from '../lib/parsers';
import { calcularSlots, Configuracao, dataLocal, instanteLocal, objetoEstrito, somaDias, validarConfiguracao } from '../lib/agenda';
import { AgendaDb, horarioIndisponivel, transacaoAgenda } from '../repositories/agendaRepository';

export function exigirAdmin(ctx?: Contexto) {
  if (!ctx) throw unauthorized('Sessão necessária.');
  if (ctx.role !== 'ADMIN') throw forbidden();
}
export const textoCurto = (value: unknown, field: string): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > 300) throw badRequest(`${field} deve ter até 300 caracteres.`, field);
  return value.trim() || null;
};
export async function configuracao(db: AgendaDb = prisma): Promise<Configuracao> {
  const { id: _id, ...config } = await db.configuracaoAgenda.findUniqueOrThrow({ where: { id: 1 } });
  return { ...config, intervalos: config.intervalos as Configuracao['intervalos'] };
}
export const getConfiguracao = (ctx?: Contexto) => { exigirAdmin(ctx); return configuracao(); };
export const putConfiguracao = (body: unknown, ctx?: Contexto) => {
  exigirAdmin(ctx); const dados = validarConfiguracao(body);
  return transacaoAgenda(async db => {
    await db.configuracaoAgenda.update({ where: { id: 1 }, data: dados });
    return configuracao(db);
  });
};
export const listBloqueios = (ctx?: Contexto) => {
  exigirAdmin(ctx); return prisma.bloqueioAgenda.findMany({ orderBy: { inicio: 'asc' } });
};
export const createBloqueio = (body: unknown, ctx?: Contexto) => {
  exigirAdmin(ctx);
  const b = objetoEstrito(body, ['inicio', 'fim', 'funcionarioId', 'motivo']);
  const inicio = dataHora(b.inicio, 'inicio'), fim = dataHora(b.fim, 'fim');
  if (fim <= inicio) throw badRequest('O fim deve ser posterior ao início.', 'fim');
  const funcionarioId = b.funcionarioId == null ? null : idReferencia(b.funcionarioId, 'funcionarioId');
  const motivo = textoCurto(b.motivo, 'motivo');
  return transacaoAgenda(async db => {
    if (funcionarioId) await existeOu404(db.funcionario.findUnique({ where: { id: funcionarioId } }), 'Funcionário não encontrado.');
    return db.bloqueioAgenda.create({ data: { inicio, fim, funcionarioId, motivo } });
  });
};
export const removeBloqueio = (id: number, ctx?: Contexto) => {
  exigirAdmin(ctx); return transacaoAgenda(async db => {
    await existeOu404(db.bloqueioAgenda.findUnique({ where: { id } }), 'Bloqueio não encontrado.');
    await db.bloqueioAgenda.delete({ where: { id } });
  });
};
export const idQuery = (valor: unknown, campo: string) => {
  if (typeof valor !== 'string') throw badRequest(`Informe ${campo}.`, campo);
  return parseIdParam(valor);
};
export function janela(query: Record<string, unknown>, maxDias?: number) {
  data(query.dataInicio, 'dataInicio'); data(query.dataFim, 'dataFim');
  const dataInicio = query.dataInicio as string, dataFim = query.dataFim as string;
  const dias = (new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / 86400000 + 1;
  if (dias < 1 || (maxDias && dias > maxDias)) throw badRequest(`Janela inválida${maxDias ? `: máximo de ${maxDias} dias` : ''}.`);
  return { dataInicio, dataFim };
}
export async function disponibilidade(db: AgendaDb, { servicoId, dataInicio, dataFim, funcionarioId, duracaoMin, ignorarId, antecedenciaHoras, agora = new Date() }: {
  servicoId: number; dataInicio: string; dataFim: string; funcionarioId?: number;
  duracaoMin?: number; ignorarId?: number; antecedenciaHoras?: number; agora?: Date;
}) {
  const [config, servico] = await Promise.all([
    configuracao(db), existeOu404(db.servico.findUnique({ where: { id: servicoId } }), 'Serviço não encontrado.'),
  ]);
  const duracao = duracaoMin ?? servico.duracaoMin;
  if (!servico.ativo || !servico.categoria) return { fuso: config.fuso, preco: Number(servico.preco), duracaoMin: duracao, slots: [] };
  const de = instanteLocal(dataInicio, '00:00'), ate = instanteLocal(somaDias(dataFim, 1), '00:00');
  const profissionais = await db.funcionario.findMany({ where: { ativo: true, ...(funcionarioId ? { id: funcionarioId } : {}), servicos: { some: { id: servicoId } } }, select: { id: true, nome: true, cargo: true }, orderBy: { id: 'asc' } });
  const ids = profissionais.map(p => p.id);
  const [reservas, bloqueios] = await Promise.all([
    db.agendamento.findMany({ where: { funcionarioId: { in: ids }, status: { in: ['AGENDADO', 'CONCLUIDO'] }, ...(ignorarId ? { id: { not: ignorarId } } : {}), dataHoraIni: { lt: ate }, dataHoraFim: { gt: de } }, select: { funcionarioId: true, dataHoraIni: true, dataHoraFim: true } }),
    db.bloqueioAgenda.findMany({ where: { OR: [{ funcionarioId: null }, { funcionarioId: { in: ids } }], inicio: { lt: ate }, fim: { gt: de } }, select: { inicio: true, fim: true, funcionarioId: true } }),
  ]);
  const slots = calcularSlots({ configuracao: config, dataInicio, dataFim, duracaoMin: duracao, profissionais, ocupados: reservas.map(r => ({ funcionarioId: r.funcionarioId, inicio: r.dataHoraIni, fim: r.dataHoraFim })), bloqueios, agora, antecedenciaHoras: antecedenciaHoras ?? config.antecedenciaCriacaoHoras });
  return { fuso: config.fuso, preco: Number(servico.preco), duracaoMin: duracao, slots: slots.map(s => ({ ...s, preco: Number(servico.preco), duracaoMin: duracao })) };
}
export async function getDisponibilidade(query: Record<string, unknown>) {
  const range = janela(query, 31), servicoId = idQuery(query.servicoId, 'servicoId');
  const funcionarioId = query.funcionarioId === undefined ? undefined : idQuery(query.funcionarioId, 'funcionarioId');
  // Snapshot coerente inclusive durante edições da configuração.
  return prisma.$transaction(db => disponibilidade(db, { ...range, servicoId, funcionarioId }), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
export async function validarHorario(db: AgendaDb, dados: { dataHoraIni: Date; servicoId: number; funcionarioId: number; duracaoMin?: number; ignorarId?: number; antecedenciaHoras?: number }) {
  const dia = dataLocal(dados.dataHoraIni);
  const resultado = await disponibilidade(db, { ...dados, dataInicio: dia, dataFim: dia });
  const slot = resultado.slots.find(s => new Date(s.inicio).getTime() === dados.dataHoraIni.getTime());
  if (!slot) throw horarioIndisponivel();
  return { dataHoraFim: new Date(slot.fim), precoContratado: slot.preco, duracaoContratadaMin: slot.duracaoMin };
}
