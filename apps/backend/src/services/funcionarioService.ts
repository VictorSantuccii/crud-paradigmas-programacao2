import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { telefone } from '../lib/identity';
import { Contexto, autorizar, escopo } from '../lib/authorization';
import { conflict, existeOu404, forbidden, badRequest } from '../lib/errors';
import { booleano, idReferencia, obrigatorio, opcional, parseAtualizacao, parseCriacao, texto } from '../lib/parsers';
import { objetoEstrito } from '../lib/agenda';
import { AgendaDb, transacaoAgenda } from '../repositories/agendaRepository';
const ids = (v: unknown) => {
  if (!Array.isArray(v) || v.length > 1000) throw badRequest('Envie uma lista de serviços.', 'servicoIds');
  return [...new Set(v.map(id => idReferencia(id, 'servicoIds')))];
};
const campos = { nome: obrigatorio(texto), cargo: obrigatorio(texto), telefone: opcional(telefone), ativo: obrigatorio(booleano), servicoIds: obrigatorio(ids) };
const relacoes = { servicos: { select: { id: true } } } as const;
const formatar = <T extends { servicos: { id: number }[] }>(r: T) => { const { servicos, ...dados } = r; return { ...dados, servicoIds: servicos.map(s => s.id) }; };
export async function list(ctx?: Contexto) { return (await prisma.funcionario.findMany({ where: escopo('funcionario', ctx), include: relacoes, orderBy: { id: 'asc' } })).map(formatar); }
export async function getById(id: number, ctx?: Contexto) {
  const scope = escopo('funcionario', ctx);
  const r = await existeOu404(prisma.funcionario.findUnique({ where: { id }, include: relacoes }), 'Funcionário não encontrado.');
  if (scope.id && scope.id !== r.id) throw forbidden();
  return formatar(r);
}
async function validarServicos(db: AgendaDb, servicoIds: number[] = []) {
  for (const id of servicoIds) await existeOu404(db.servico.findUnique({ where: { id } }), `Serviço ${id} não encontrado.`);
}
export async function create(body: unknown, ctx?: Contexto) {
  autorizar('funcionario', false, ctx);
  const b = objetoEstrito(body, Object.keys(campos));
  const { servicoIds, ...dados } = parseCriacao(campos, { ...b, ativo: b.ativo === undefined ? false : b.ativo, servicoIds: b.servicoIds === undefined ? [] : b.servicoIds });
  return transacaoAgenda(async db => {
    await validarServicos(db, servicoIds);
    return formatar(await db.funcionario.create({ data: { ...dados, servicos: { connect: servicoIds.map(id => ({ id })) } }, include: relacoes }));
  });
}
export async function update(id: number, body: unknown, ctx?: Contexto) {
  autorizar('funcionario', false, ctx); objetoEstrito(body, Object.keys(campos));
  const { servicoIds, ...dados } = parseAtualizacao(campos, body);
  return transacaoAgenda(async db => {
    await existeOu404(db.funcionario.findUnique({ where: { id } }), 'Funcionário não encontrado.');
    await validarServicos(db, servicoIds);
    return formatar(await db.funcionario.update({ where: { id }, data: { ...dados, ...(servicoIds ? { servicos: { set: servicoIds.map(id => ({ id })) } } : {}) }, include: relacoes }));
  });
}
export async function remove(id: number, ctx?: Contexto) {
  autorizar('funcionario', false, ctx);
  return transacaoAgenda(async db => {
    await existeOu404(db.funcionario.findUnique({ where: { id } }), 'Funcionário não encontrado.');
    if (await db.agendamento.count({ where: { funcionarioId: id } }) || await db.usuario.count({ where: { funcionarioId: id } }) || await db.bloqueioAgenda.count({ where: { funcionarioId: id } })) throw conflict('Funcionário possui vínculos. Desative-o para suspender novos atendimentos.');
    try { await db.funcionario.delete({ where: { id } }); } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') throw conflict('Funcionário possui vínculos.');
      throw error;
    }
  });
}
