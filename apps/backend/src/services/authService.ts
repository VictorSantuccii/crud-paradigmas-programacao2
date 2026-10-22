import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { badRequest, forbidden, unauthorized } from '../lib/errors';
import prisma from '../lib/prisma';
import { hashSenha, verificarSenha } from '../lib/password';
import { verificarTokenFirebase } from '../lib/firebaseAdmin';
import redis from '../lib/redis';
import * as v from '../lib/identity';
import { idReferencia, texto } from '../lib/parsers';

export const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 24 * 30;
export const DURACAO_ONBOARDING = 30 * 60;
export const usuarioSelect = { id: true, nome: true, email: true, cpf: true, telefone: true, role: true, funcionarioId: true, fidelidadeId: true, enderecos: { select: { id: true, rua: true, numero: true, complemento: true, bairro: true, cep: true } } } satisfies Prisma.UsuarioSelect;
type UsuarioDados = Prisma.UsuarioGetPayload<{ select: typeof usuarioSelect }>;
export const publico = (usuario: UsuarioDados) => ({ id: usuario.id, nome: usuario.nome, email: usuario.email, cpf: usuario.cpf, telefone: usuario.telefone, role: usuario.role, funcionarioId: usuario.funcionarioId, fidelidadeId: usuario.fidelidadeId, enderecos: usuario.enderecos, perfilCompleto: v.perfilCompleto(usuario), camposPendentes: v.camposPendentes(usuario), fotoURL: null as string | null });
export type UsuarioPublico = ReturnType<typeof publico>;
const novaSessao = async (usuario: UsuarioPublico) => {
  const token = randomBytes(32).toString('base64url');
  await redis.set(`sessao:${token}`, JSON.stringify({ id: usuario.id }), { EX: DURACAO_SESSAO_SEGUNDOS });
  return { token, usuario };
};
const criarCliente = async (dados: { nome: string; email: string; cpf: string; telefone: string; senha: string; endereco: ReturnType<typeof v.endereco> }) => {
  const senhaHash = await hashSenha(dados.senha);
  return prisma.usuario.create({ data: { nome: dados.nome, email: dados.email, cpf: dados.cpf, telefone: dados.telefone, senhaHash, role: 'CLIENTE', fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } }, enderecos: { create: dados.endereco } }, select: usuarioSelect });
};
export const cadastrar = async (entrada: unknown) => {
  const b = v.objeto(entrada);
  v.permitirCampos(b, ['nome', 'email', 'cpf', 'telefone', 'senha', 'confirmarSenha', 'endereco']);
  const senha = v.senha(b.senha);
  if (b.confirmarSenha !== undefined && b.confirmarSenha !== senha) throw badRequest('A confirmação da senha não confere.');
  const user = await criarCliente({ nome: texto(b.nome, 'nome'), email: v.email(b.email), cpf: v.cpf(b.cpf), telefone: v.telefone(b.telefone), senha, endereco: v.endereco(b.endereco) });
  return novaSessao(publico(user));
};
export const entrar = async (entrada: unknown) => {
  const b = v.objeto(entrada);
  const user = await prisma.usuario.findUnique({ where: { email: v.email(b.email) }, select: { ...usuarioSelect, senhaHash: true } });
  if (!user || typeof b.senha !== 'string' || !await verificarSenha(b.senha, user.senhaHash)) throw unauthorized('E-mail ou senha inválidos.');
  const { senhaHash: _hash, ...dados } = user;
  return novaSessao(publico(dados));
};
type GoogleIdentidade = { nome: string; email: string };
export const entrarComGoogle = async (entrada: unknown) => {
  const b = v.objeto(entrada);
  if (typeof b.idToken !== 'string' || !b.idToken) throw badRequest('O token do Google é obrigatório.');
  let identidade: Awaited<ReturnType<typeof verificarTokenFirebase>>;
  try { identidade = await verificarTokenFirebase(b.idToken); } catch { throw unauthorized('Não foi possível validar sua conta Google.'); }
  if (!identidade.email_verified || !identidade.email) throw unauthorized('A conta Google precisa ter e-mail verificado.');
  const email = v.email(identidade.email);
  const user = await prisma.usuario.findUnique({ where: { email }, select: usuarioSelect });
  if (user) return novaSessao(publico(user));
  const token = randomBytes(32).toString('base64url');
  const dados = { email, nome: identidade.name?.trim() || email.split('@')[0] };
  await redis.set(`onboarding:${token}`, JSON.stringify(dados), { EX: DURACAO_ONBOARDING });
  return { requiresOnboarding: true as const, token, camposPendentes: ['cpf', 'telefone', 'endereco'] };
};
export const consultarOnboarding = async (token?: string): Promise<GoogleIdentidade> => {
  const value = token ? await redis.get(`onboarding:${token}`) : null;
  if (!value) throw unauthorized('Cadastro Google expirado. Entre com Google novamente.');
  try { const b = v.objeto(JSON.parse(value)); return { nome: texto(b.nome, 'nome'), email: v.email(b.email) }; } catch { throw unauthorized('Cadastro Google inválido.'); }
};
export const concluirOnboarding = async (token: string | undefined, entrada: unknown) => {
  const identidade = await consultarOnboarding(token);
  const b = v.objeto(entrada);
  v.permitirCampos(b, ['cpf', 'telefone', 'endereco']);
  const user = await criarCliente({ ...identidade, cpf: v.cpf(b.cpf), telefone: v.telefone(b.telefone), endereco: v.endereco(b.endereco), senha: randomBytes(48).toString('base64url') });
  const result = await novaSessao(publico(user));
  await redis.del(`onboarding:${token}`);
  return result;
};
export const consultarSessao = async (token?: string) => {
  if (!token) return null;
  const value = await redis.get(`sessao:${token}`);
  if (!value) return null;
  let id: number;
  try { id = idReferencia(v.objeto(JSON.parse(value)).id, 'id'); } catch { await redis.del(`sessao:${token}`); return null; }
  const user = await prisma.usuario.findUnique({ where: { id }, select: usuarioSelect });
  if (!user) { await redis.del(`sessao:${token}`); return null; }
  return publico(user);
};
export const atualizarPerfil = async (id: number, entrada: unknown) => {
  const b = v.objeto(entrada);
  v.permitirCampos(b, ['nome', 'email', 'cpf', 'telefone', 'endereco']);
  if (!Object.keys(b).length) throw badRequest('Informe dados para atualizar.');
  return prisma.$transaction(async tx => {
    // Serializa alterações de endereço/perfil da mesma conta.
    await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${id} FOR UPDATE`;
    const atual = await tx.usuario.findUniqueOrThrow({ where: { id }, select: usuarioSelect });
    const data: Prisma.UsuarioUpdateInput = {};
    if (b.nome !== undefined) data.nome = texto(b.nome, 'nome');
    if (b.email !== undefined) data.email = v.email(b.email);
    if (b.telefone !== undefined) data.telefone = v.telefone(b.telefone);
    if (b.cpf !== undefined) {
      if (v.valido(v.cpf, atual.cpf) && v.cpf(b.cpf) !== v.cpf(atual.cpf)) throw badRequest('CPF válido não pode ser alterado pelo cliente.');
      data.cpf = v.cpf(b.cpf);
    }
    if (b.endereco !== undefined) {
      const address = v.endereco(b.endereco);
      const addressId = v.objeto(b.endereco).id;
      if (addressId !== undefined) {
        const eid = idReferencia(addressId, 'endereco.id');
        const owned = await tx.endereco.findFirst({ where: { id: eid, usuarioId: id } });
        if (!owned) throw forbidden('Endereço não pertence à conta.');
        await tx.endereco.update({ where: { id: eid, usuarioId: id }, data: address });
      } else await tx.endereco.create({ data: { ...address, usuarioId: id } });
    }
    const atualizado = await tx.usuario.update({ where: { id }, data, select: usuarioSelect });
    if (v.perfilCompleto(atual) && !v.perfilCompleto(atualizado)) throw badRequest('A atualização deve manter o perfil completo.');
    return publico(atualizado);
  });
};
export const sair = async (token?: string) => { if (token) await redis.del(`sessao:${token}`); };
