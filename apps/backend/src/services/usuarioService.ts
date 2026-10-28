import { Prisma } from '@prisma/client';
import { Contexto, autorizar } from '../lib/authorization';
import { badRequest, conflict, existeOu404 } from '../lib/errors';
import { hashSenha } from '../lib/password';
import prisma from '../lib/prisma';
import { idReferencia, texto } from '../lib/parsers';
import * as v from '../lib/identity';
import { publico, usuarioSelect } from './authService';
import * as usuarioRepository from '../repositories/usuarioRepository';
import * as agendamentoRepository from '../repositories/agendamentoRepository';
import * as assinaturaRepository from '../repositories/assinaturaRepository';
const buscar = (id: number) => existeOu404(prisma.usuario.findUnique({ where: { id }, select: usuarioSelect }), 'Usuário não encontrado.');
export const list = async (ctx?: Contexto) => { autorizar('usuario', true, ctx); return (await prisma.usuario.findMany({ select: usuarioSelect, orderBy: { id: 'desc' } })).map(publico); };
export const getById = async (id: number, ctx?: Contexto) => { autorizar('usuario', true, ctx); return publico(await buscar(id)); };
const papel = (value: unknown): 'CLIENTE' | 'FUNCIONARIO' => { if (value !== 'CLIENTE' && value !== 'FUNCIONARIO') throw badRequest('A API só provisiona CLIENTE e FUNCIONARIO. Administradores são criados pelo comando local.'); return value; };
export const create = async (body: unknown, ctx?: Contexto) => {
  autorizar('usuario', false, ctx);
  const b = v.objeto(body);
  v.permitirCampos(b, ['nome', 'email', 'cpf', 'telefone', 'senha', 'role', 'funcionarioId', 'funcionario', 'endereco']);
  const role = papel(b.role);
  const senhaHash = await hashSenha(v.senha(b.senha));
  const dados = { nome: texto(b.nome, 'nome'), email: v.email(b.email), cpf: v.cpf(b.cpf), telefone: b.telefone == null && role === 'FUNCIONARIO' ? null : v.telefone(b.telefone), role, senhaHash };
  const address = role === 'CLIENTE' ? v.endereco(b.endereco) : undefined;
  return prisma.$transaction(async tx => {
    let funcionarioId: number | null = null;
    if (role === 'FUNCIONARIO') {
      if ((b.funcionarioId === undefined) === (b.funcionario === undefined)) throw badRequest('Informe funcionarioId ou um novo funcionario.');
      if (b.funcionario !== undefined) {
        const f = v.objeto(b.funcionario); v.permitirCampos(f, ['nome', 'cargo', 'telefone']);
        funcionarioId = (await tx.funcionario.create({ data: { nome: texto(f.nome, 'nome'), cargo: texto(f.cargo, 'cargo'), telefone: f.telefone == null ? null : v.telefone(f.telefone) } })).id;
      } else { funcionarioId = idReferencia(b.funcionarioId, 'funcionarioId'); await existeOu404(tx.funcionario.findUnique({ where: { id: funcionarioId } }), 'Funcionário não encontrado.'); }
    } else if (b.funcionarioId !== undefined || b.funcionario !== undefined) throw badRequest('Cliente não pode ter vínculo funcional.');
    return publico(await tx.usuario.create({ data: { ...dados, ...(funcionarioId ? { funcionario: { connect: { id: funcionarioId } } } : {}), fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } }, ...(address ? { enderecos: { create: address } } : {}) }, select: usuarioSelect }));
  });
};
export const update = async (id: number, body: unknown, ctx?: Contexto) => {
  autorizar('usuario', false, ctx);
  const b = v.objeto(body); v.permitirCampos(b, ['nome', 'email', 'cpf', 'telefone', 'senha', 'role', 'funcionarioId']);
  const atual = await buscar(id);
  const data: Prisma.UsuarioUncheckedUpdateInput = {};
  if (b.nome !== undefined) data.nome = texto(b.nome, 'nome');
  if (b.email !== undefined) data.email = v.email(b.email);
  if (b.cpf !== undefined) data.cpf = v.cpf(b.cpf);
  if (b.telefone !== undefined) data.telefone = v.telefone(b.telefone);
  if (b.senha !== undefined) data.senhaHash = await hashSenha(v.senha(b.senha));
  if (b.role !== undefined) data.role = papel(b.role);
  const role = b.role === undefined ? atual.role : papel(b.role);
  const funcionarioId = b.funcionarioId === undefined ? atual.funcionarioId : b.funcionarioId === null ? null : idReferencia(b.funcionarioId, 'funcionarioId');
  if ((role === 'FUNCIONARIO') !== (funcionarioId !== null)) throw badRequest('Papel e vínculo funcional inconsistentes.');
  if (funcionarioId) await existeOu404(prisma.funcionario.findUnique({ where: { id: funcionarioId } }), 'Funcionário não encontrado.');
  data.funcionarioId = funcionarioId;
  return publico(await prisma.usuario.update({ where: { id }, data, select: usuarioSelect }));
};
export const remove = async (id: number, ctx?: Contexto) => {
  autorizar('usuario', false, ctx);
  const user = await buscar(id);
  const counts = await Promise.all([agendamentoRepository.countByUsuario(id), agendamentoRepository.countByDonoDoAnimal(id), assinaturaRepository.countByUsuario(id)]);
  if (await prisma.movimentoFidelidade.count({ where: { OR: [{ fidelidadeId: user.fidelidadeId }, { autorId: id }] } }) || await prisma.beneficioFidelidade.count({ where: { fidelidadeId: user.fidelidadeId } })) throw conflict('Usuário com histórico de fidelidade não pode ser removido.');
  if (counts.some(Boolean)) throw conflict('Usuário com agendamentos ou assinaturas não pode ser removido.');
  await usuarioRepository.removerComFidelidade(id, user.fidelidadeId);
};
