import { Agendamento, Prisma, TipoMovimentoFidelidade } from '@prisma/client';
import { Contexto } from '../lib/authorization';
import { existeOu404 } from '../lib/errors';
import { AgendaDb } from '../repositories/agendaRepository';

export const META = 8;
export const REGRA = 'A cada 8 banhos elegíveis pagos e concluídos, ganhe um banho gratuito. O saldo reúne seus pets. Benefícios acumulam sem validade, são reservados no próximo novo agendamento elegível e usados do mais antigo ao mais recente. Cancelamento ou falta devolvem o benefício. Banhos gratuitos não contam para o próximo ciclo.';
export async function resumo(db: AgendaDb, id: number) {
  const f = await existeOu404(db.fidelidade.findUnique({ where: { id } }), 'Fidelidade não encontrada.');
  const grupos = await db.beneficioFidelidade.groupBy({ by: ['estado'], where: { fidelidadeId: id }, _count: true });
  const quantidade = (estado: string) => grupos.find(g => g.estado === estado)?._count ?? 0;
  return { id, meta: META, progresso: f.progresso, qntdServicos: f.progresso, beneficioAtivo: quantidade('DISPONIVEL') > 0,
    beneficios: { disponiveis: quantidade('DISPONIVEL'), reservados: quantidade('RESERVADO'), consumidos: quantidade('CONSUMIDO'), revogados: quantidade('REVOGADO') }, regra: REGRA };
}
export type Saldo = Awaited<ReturnType<typeof resumo>>;
export const retrato = (s: Saldo): Prisma.InputJsonObject => ({ progresso: s.progresso, ...s.beneficios });
export async function projetar(db: AgendaDb, id: number, progresso?: number) {
  const disponiveis = await db.beneficioFidelidade.count({ where: { fidelidadeId: id, estado: 'DISPONIVEL' } });
  await db.fidelidade.update({ where: { id }, data: { beneficioAtivo: disponiveis > 0, ...(progresso === undefined ? {} : { progresso, qntdServicos: progresso }) } });
  return resumo(db, id);
}
export async function movimento(db: AgendaDb, dados: { fidelidadeId: number; tipo: TipoMovimentoFidelidade; autorId: number; antes: Prisma.InputJsonObject; depois: Prisma.InputJsonObject; beneficioId?: number; agendamentoId?: number; motivo?: string | null }) {
  await db.movimentoFidelidade.create({ data: { ...dados, ...(dados.tipo === 'CONTAGEM' ? { contagemAgendamentoId: dados.agendamentoId } : {}) } });
}
export async function cotar(db: AgendaDb, usuarioId: number, servicoId: number) {
  const [usuario, servico] = await Promise.all([
    db.usuario.findUniqueOrThrow({ where: { id: usuarioId }, select: { fidelidadeId: true } }),
    db.servico.findUniqueOrThrow({ where: { id: servicoId } }),
  ]);
  const elegivelFidelidade = servico.elegivelFidelidade && servico.categoria === 'BANHO_TOSA';
  const beneficio = elegivelFidelidade ? await db.beneficioFidelidade.findFirst({ where: { fidelidadeId: usuario.fidelidadeId, estado: 'DISPONIVEL' }, orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }] }) : null;
  const precoBase = servico.preco, desconto = beneficio ? precoBase : new Prisma.Decimal(0);
  return { precoBase, desconto, precoContratado: precoBase.minus(desconto), elegivelFidelidade, beneficioId: beneficio?.id ?? null, fidelidadeId: usuario.fidelidadeId };
}
export type Cotacao = Awaited<ReturnType<typeof cotar>>;
export const cotacaoPublica = (c: Cotacao) => ({ precoBase: Number(c.precoBase), desconto: Number(c.desconto), precoContratado: Number(c.precoContratado), elegivelFidelidade: c.elegivelFidelidade, beneficioId: c.beneficioId });
export async function reservar(db: AgendaDb, agendamento: Agendamento, c: Cotacao, ctx: Contexto) {
  if (!c.beneficioId) return;
  const antes = await resumo(db, c.fidelidadeId);
  await db.beneficioFidelidade.update({ where: { id: c.beneficioId }, data: { estado: 'RESERVADO', agendamentoId: agendamento.id } });
  const depois = await projetar(db, c.fidelidadeId);
  await movimento(db, { fidelidadeId: c.fidelidadeId, autorId: ctx.id, tipo: 'RESERVA', beneficioId: c.beneficioId, agendamentoId: agendamento.id, antes: retrato(antes), depois: retrato(depois) });
}
export async function finalizar(db: AgendaDb, a: Agendamento, ctx: Contexto) {
  const { fidelidadeId } = await db.usuario.findUniqueOrThrow({ where: { id: a.usuarioId }, select: { fidelidadeId: true } });
  if (a.beneficioId) {
    const antes = await resumo(db, fidelidadeId);
    const consumir = a.status === 'CONCLUIDO';
    await db.beneficioFidelidade.update({ where: { id: a.beneficioId }, data: { estado: consumir ? 'CONSUMIDO' : 'DISPONIVEL', agendamentoId: consumir ? a.id : null } });
    const depois = await projetar(db, fidelidadeId);
    await movimento(db, { fidelidadeId, autorId: ctx.id, tipo: consumir ? 'CONSUMO' : 'LIBERACAO', beneficioId: a.beneficioId, agendamentoId: a.id, antes: retrato(antes), depois: retrato(depois) });
  } else if (a.status === 'CONCLUIDO' && a.elegivelFidelidade && a.precoContratado?.greaterThan(0)) {
    const antes = await resumo(db, fidelidadeId);
    const progresso = (antes.progresso + 1) % META;
    // Identidade única da contagem e do atendimento gerador protege também contra duplicação acidental.
    const depoisContagem = await projetar(db, fidelidadeId, progresso);
    await movimento(db, { fidelidadeId, autorId: ctx.id, tipo: 'CONTAGEM', agendamentoId: a.id, antes: retrato(antes), depois: retrato(depoisContagem) });
    if (progresso === 0) {
      const beneficio = await db.beneficioFidelidade.create({ data: { fidelidadeId, geradorId: a.id } });
      const depois = await projetar(db, fidelidadeId);
      await movimento(db, { fidelidadeId, autorId: ctx.id, tipo: 'EMISSAO', beneficioId: beneficio.id, agendamentoId: a.id, antes: retrato(depoisContagem), depois: retrato(depois) });
    }
  }
}
export const situacaoBeneficio = (a: Agendamento) => a.beneficioId === null ? null : a.status === 'CONCLUIDO' ? 'CONSUMIDO' : a.status === 'AGENDADO' ? 'RESERVADO' : 'DEVOLVIDO';
