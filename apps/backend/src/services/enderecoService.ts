import { cep, perfilCompleto, endereco } from "../lib/identity";
import prisma from "../lib/prisma";
import { conflict } from "../lib/errors";
import { Contexto, autorizar, escopo, dono } from "../lib/authorization";
import { forbidden } from "../lib/errors";
import { existeOu404 } from "../lib/errors";
import {
  idReferencia,
  inteiro,
  obrigatorio,
  opcional,
  parseAtualizacao,
  parseCriacao,
  texto,
} from "../lib/parsers";
import * as enderecoRepository from "../repositories/enderecoRepository";
import * as usuarioRepository from "../repositories/usuarioRepository";

const campos = {
  cep: obrigatorio(cep),
  complemento: opcional(texto),
  bairro: obrigatorio(texto),
  numero: obrigatorio(inteiro(0)),
  rua: obrigatorio(texto),
  usuarioId: obrigatorio(idReferencia),
};

const NAO_ENCONTRADO = "Endereço não encontrado.";

const garantirUsuario = (usuarioId: number) =>
  existeOu404(usuarioRepository.findById(usuarioId), "Usuário não encontrado.");

export const list = (ctx?: Contexto) => enderecoRepository.findAll(escopo("endereco", ctx));

export const getById = async (id: number, ctx?: Contexto) => {
  const scoped = await enderecoRepository.findById(id, escopo("endereco", ctx));
  if (scoped) return scoped;
  await existeOu404(enderecoRepository.findById(id), NAO_ENCONTRADO);
  throw forbidden();
};

export const create = async (body: unknown, ctx?: Contexto) => {
  autorizar("endereco", false, ctx);
  body = dono(body, ctx);
  const dados = parseCriacao(campos, body);
  await garantirUsuario(dados.usuarioId);
  return enderecoRepository.create(dados);
};

export const update = async (id: number, body: unknown, ctx?: Contexto) => {
  autorizar("endereco", false, ctx);
  const dados = parseAtualizacao(campos, dono(body, ctx));
  const atual = await getById(id, ctx);
  if (dados.usuarioId !== undefined) await garantirUsuario(dados.usuarioId);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${atual.usuarioId} FOR UPDATE`;
    const user = await tx.usuario.findUniqueOrThrow({ where: { id: atual.usuarioId }, include: { enderecos: true } });
    const address = await tx.endereco.findFirstOrThrow({ where: { AND: [{ id }, escopo("endereco", ctx)] } });
    if (address.usuarioId !== atual.usuarioId) throw conflict('Endereço alterado por outra requisição. Tente novamente.');
    const completo = endereco({ cep: dados.cep ?? address.cep, rua: dados.rua ?? address.rua, bairro: dados.bairro ?? address.bairro, numero: dados.numero ?? address.numero, complemento: dados.complemento === undefined ? address.complemento : dados.complemento });
    if (dados.usuarioId !== undefined && dados.usuarioId !== atual.usuarioId && user.role === 'CLIENTE' && perfilCompleto(user) && !perfilCompleto({ ...user, enderecos: user.enderecos.filter(e => e.id !== id) })) throw conflict('Não é permitido transferir o último endereço completo.');
    return tx.endereco.update({ where: { id, usuarioId: atual.usuarioId }, data: { ...completo, ...(dados.usuarioId !== undefined ? { usuarioId: dados.usuarioId } : {}) } });
  });
};

export const remove = async (id: number, ctx?: Contexto) => {
  autorizar("endereco", false, ctx);
  await getById(id, ctx);
  await prisma.$transaction(async tx => {
    const address = await tx.endereco.findFirstOrThrow({ where: { AND: [{ id }, escopo("endereco", ctx)] } });
    await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${address.usuarioId} FOR UPDATE`;
    const user = await tx.usuario.findUniqueOrThrow({ where: { id: address.usuarioId }, include: { enderecos: true } });
    if (user.role === 'CLIENTE' && perfilCompleto(user) && !perfilCompleto({ ...user, enderecos: user.enderecos.filter(e => e.id !== id) })) throw conflict('Não é permitido remover o último endereço completo.');
    await tx.endereco.delete({ where: { id, usuarioId: address.usuarioId } });
  });
};
