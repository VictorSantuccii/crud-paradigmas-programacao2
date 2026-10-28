import { Prisma } from '@prisma/client';
import { Contexto, escopo } from '../lib/authorization';
import { badRequest, conflict, existeOu404, forbidden } from '../lib/errors';
import { inteiro } from '../lib/parsers';
import { objetoEstrito } from '../lib/agenda';
import prisma from '../lib/prisma';
import { transacaoAgenda } from '../repositories/agendaRepository';
import { exigirAdmin, textoCurto } from './agendaService';
import { movimento, projetar, resumo, retrato } from './fidelidadePrograma';

export const list = async (ctx?: Contexto) => {
  const where = escopo('fidelidade', ctx);
  return prisma.$transaction(async db => {
    const registros = await db.fidelidade.findMany({ where, orderBy: { id: 'desc' } });
    return Promise.all(registros.map(f => resumo(db, f.id)));
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
};
export const getById = async (id: number, ctx?: Contexto) => {
  const scope = escopo('fidelidade', ctx);
  return prisma.$transaction(async db => {
    await existeOu404(db.fidelidade.findUnique({ where: { id } }), 'Fidelidade não encontrada.');
    if (scope.id && scope.id !== id) throw forbidden();
    return resumo(db, id);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
};
export const me = (ctx?: Contexto) => { escopo('fidelidade', ctx); return getById(ctx!.fidelidadeId, ctx); };
export async function ajustar(id: number, body: unknown, ctx?: Contexto) {
  exigirAdmin(ctx);
  const b = objetoEstrito(body, ['progresso', 'variacaoBeneficios', 'motivo']);
  const progresso = inteiro(0)(b.progresso, 'progresso');
  if (progresso > 7) throw badRequest('Progresso deve estar entre 0 e 7.', 'progresso');
  const variacao = inteiro(-2147483647)(b.variacaoBeneficios, 'variacaoBeneficios');
  const motivo = textoCurto(b.motivo, 'motivo');
  if (!motivo) throw badRequest('Informe um motivo para o ajuste.', 'motivo');
  return transacaoAgenda(async db => {
    const antes = await resumo(db, id);
    if (antes.beneficios.disponiveis + variacao < 0) throw conflict('O ajuste só pode retirar benefícios disponíveis.');
    const afetados: number[] = [];
    if (variacao > 0) {
      for (let i = 0; i < variacao; i++) afetados.push((await db.beneficioFidelidade.create({ data: { fidelidadeId: id } })).id);
    } else if (variacao < 0) {
      const recentes = await db.beneficioFidelidade.findMany({ where: { fidelidadeId: id, estado: 'DISPONIVEL' }, orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }], take: -variacao, select: { id: true } });
      afetados.push(...recentes.map(b => b.id));
      await db.beneficioFidelidade.updateMany({ where: { id: { in: afetados } }, data: { estado: 'REVOGADO' } });
    }
    const depois = await projetar(db, id, progresso);
    await movimento(db, { fidelidadeId: id, autorId: ctx!.id, tipo: 'AJUSTE', motivo, antes: retrato(antes), depois: { ...retrato(depois), variacaoBeneficios: variacao, beneficiosAfetados: afetados } });
    return depois;
  });
}
