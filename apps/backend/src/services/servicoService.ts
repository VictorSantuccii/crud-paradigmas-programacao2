import { CategoriaServico, Prisma, Servico } from '@prisma/client';
import prisma from '../lib/prisma';
import { Contexto, autorizar } from '../lib/authorization';
import { badRequest, conflict, existeOu404 } from '../lib/errors';
import { booleano, enumeracao, inteiro, obrigatorio, opcional, parseAtualizacao, parseCriacao, preco, texto } from '../lib/parsers';
import { objetoEstrito } from '../lib/agenda';
import { transacaoAgenda } from '../repositories/agendaRepository';
const campos = { descricao: opcional(texto), duracaoMin: obrigatorio(inteiro(1)), preco: obrigatorio(preco), nome: obrigatorio(texto), categoria: obrigatorio(enumeracao(CategoriaServico)), ativo: obrigatorio(booleano) };
const formatar = (r: Servico) => ({ ...r, preco: Number(r.preco) });
export async function list(_ctx?: Contexto, query: Record<string, unknown> = {}) {
  const categoria = query.categoria === undefined ? undefined : enumeracao(CategoriaServico)(query.categoria, 'categoria');
  return (await prisma.servico.findMany({ where: { ativo: true, categoria: categoria ?? { not: null } }, orderBy: { nome: 'asc' } })).map(formatar);
}
export async function getById(id: number) {
  return formatar(await existeOu404(prisma.servico.findFirst({ where: { id, ativo: true, categoria: { not: null } } }), 'Serviço não encontrado.'));
}
export async function profissionais(id: number) {
  await getById(id);
  return prisma.funcionario.findMany({ where: { ativo: true, servicos: { some: { id } } }, select: { id: true, nome: true, cargo: true }, orderBy: { nome: 'asc' } });
}
// ADMIN precisa enxergar também os registros legados inativos, sem torná-los públicos.
export async function listAdmin(ctx?: Contexto) {
  autorizar('servico', false, ctx);
  return (await prisma.servico.findMany({ orderBy: { id: 'asc' } })).map(formatar);
}
export async function create(body: unknown, ctx?: Contexto) {
  autorizar('servico', false, ctx);
  const b = objetoEstrito(body, Object.keys(campos));
  const dados = parseCriacao(campos, { ...b, ativo: b.ativo === undefined ? false : b.ativo });
  return transacaoAgenda(async db => formatar(await db.servico.create({ data: dados })));
}
export async function update(id: number, body: unknown, ctx?: Contexto) {
  autorizar('servico', false, ctx); objetoEstrito(body, Object.keys(campos));
  const dados = parseAtualizacao(campos, body);
  return transacaoAgenda(async db => {
    const atual = await existeOu404(db.servico.findUnique({ where: { id } }), 'Serviço não encontrado.');
    if ((dados.ativo ?? atual.ativo) && !(dados.categoria ?? atual.categoria)) throw badRequest('Classifique o serviço antes de ativá-lo.', 'categoria');
    return formatar(await db.servico.update({ where: { id }, data: dados }));
  });
}
export async function remove(id: number, ctx?: Contexto) {
  autorizar('servico', false, ctx);
  return transacaoAgenda(async db => {
    await existeOu404(db.servico.findUnique({ where: { id } }), 'Serviço não encontrado.');
    if (await db.agendamento.count({ where: { servicoId: id } })) throw conflict('Serviço com agendamentos vinculados não pode ser removido.');
    try { await db.servico.delete({ where: { id } }); } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') throw conflict('Serviço com vínculos não pode ser removido.');
      throw error;
    }
  });
}
