import { randomBytes } from "node:crypto";
import { Role } from "@prisma/client";
import { badRequest, conflict, unauthorized } from "../lib/errors";
import prisma from "../lib/prisma";
import { verificarSenha } from "../lib/password";
import { verificarTokenFirebase } from "../lib/firebaseAdmin";
import redis from "../lib/redis";
import * as usuarioRepository from "../repositories/usuarioRepository";
import { create as criarUsuario } from "./usuarioService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 24 * 30;

export type UsuarioPublico = {
  id: number;
  nome: string;
  email: string | null;
  cpf: string;
  role: Role;
  fotoURL: string | null;
  enderecos: Array<{
    id: number;
    rua: string;
    numero: number;
    complemento: string | null;
    bairro: string;
    cep: string;
  }>;
};

const publico = (usuario: {
  id: number;
  nome: string;
  email: string | null;
  cpf: string;
  role: Role;
  fotoURL?: string | null;
  enderecos?: UsuarioPublico["enderecos"];
}): UsuarioPublico => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  cpf: usuario.cpf,
  role: usuario.role,
  fotoURL: usuario.fotoURL ?? null,
  enderecos: usuario.enderecos ?? [],
});

const validarEmail = (value: unknown) => {
  if (typeof value !== "string" || !EMAIL_REGEX.test(value.trim())) {
    throw badRequest("Informe um e-mail válido.");
  }
  return value.trim().toLowerCase();
};

const validarSenha = (value: unknown) => {
  if (typeof value !== "string" || value.length < 8) {
    throw badRequest("A senha deve ter pelo menos 8 caracteres.");
  }
  return value;
};

const novaSessao = async (usuario: UsuarioPublico) => {
  const token = randomBytes(32).toString("base64url");
  await redis.set(`sessao:${token}`, JSON.stringify(usuario), { EX: DURACAO_SESSAO_SEGUNDOS });
  return { token, usuario };
};

export const cadastrar = async (entrada: unknown) => {
  if (typeof entrada !== "object" || entrada === null || Array.isArray(entrada)) {
    throw badRequest("O corpo da requisição deve ser um objeto JSON.");
  }
  const body = entrada as Record<string, unknown>;
  const email = validarEmail(body.email);
  const senha = validarSenha(body.senha);
  if (typeof body.nome !== "string" || !body.nome.trim()) throw badRequest("Informe seu nome.");
  if (typeof body.cpf !== "string" || !body.cpf.trim()) throw badRequest("Informe seu CPF.");
  if (body.confirmarSenha !== undefined && body.confirmarSenha !== senha) {
    throw badRequest("A confirmação da senha não confere.");
  }
  if (await usuarioRepository.findByEmail(email)) throw conflict("Já existe uma conta com esse e-mail.");

  const cpf = body.cpf.trim();
  const usuarioExistente = await prisma.usuario.findUnique({ where: { cpf } });
  if (usuarioExistente) throw conflict("Já existe uma conta com esse CPF.");

  const criado = await criarUsuario({ nome: body.nome, email, senha, cpf, role: Role.CLIENTE });
  return novaSessao(publico(criado));
};

export const entrar = async (entrada: unknown) => {
  if (typeof entrada !== "object" || entrada === null || Array.isArray(entrada)) {
    throw badRequest("O corpo da requisição deve ser um objeto JSON.");
  }
  const body = entrada as Record<string, unknown>;
  const email = validarEmail(body.email);
  if (typeof body.senha !== "string" || !body.senha) throw badRequest("Informe sua senha.");
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { enderecos: true },
  });
  if (!usuario || !(await verificarSenha(body.senha, usuario.senhaHash))) {
    throw unauthorized("E-mail ou senha inválidos.");
  }
  return novaSessao(publico(usuario));
};

export const entrarComGoogle = async (entrada: unknown) => {
  if (typeof entrada !== "object" || entrada === null || Array.isArray(entrada)) {
    throw badRequest("O corpo da requisição deve ser um objeto JSON.");
  }

  const body = entrada as Record<string, unknown>;
  if (typeof body.idToken !== "string" || !body.idToken) {
    throw badRequest("O token do Google é obrigatório.");
  }

  let identidade: Awaited<ReturnType<typeof verificarTokenFirebase>>;
  try {
    identidade = await verificarTokenFirebase(body.idToken);
  } catch {
    throw unauthorized("Não foi possível validar sua conta Google. Tente novamente.");
  }

  if (identidade.email_verified !== true || typeof identidade.email !== "string") {
    throw unauthorized("A conta Google precisa ter um e-mail verificado.");
  }

  const email = validarEmail(identidade.email);
  const existente = await prisma.usuario.findUnique({
    where: { email },
    include: { enderecos: true },
  });
  if (existente) return novaSessao({ ...publico(existente), fotoURL: identidade.picture ?? null });

  if (typeof body.cpf !== "string" || !body.cpf.trim()) {
    return { requiresCpf: true as const };
  }

  const cpf = body.cpf.trim();
  if (await prisma.usuario.findUnique({ where: { cpf } })) {
    throw conflict("Já existe uma conta com esse CPF.");
  }

  const nome = typeof identidade.name === "string" && identidade.name.trim()
    ? identidade.name.trim()
    : email.split("@")[0];
  const senhaAleatoria = randomBytes(48).toString("base64url");
  const criado = await criarUsuario({ nome, email, cpf, senha: senhaAleatoria, role: Role.CLIENTE });
  return novaSessao({ ...publico(criado), fotoURL: identidade.picture ?? null });
};

export const consultarSessao = async (token: string | undefined) => {
  if (!token) return null;
  const valor = await redis.get(`sessao:${token}`);
  if (!valor) return null;
  const usuario = JSON.parse(valor) as UsuarioPublico;
  const atual = await prisma.usuario.findUnique({
    where: { id: usuario.id },
    include: { enderecos: true },
  });
  if (!atual) {
    await redis.del(`sessao:${token}`);
    return null;
  }
  return { ...publico(atual), fotoURL: usuario.fotoURL ?? null };
};

export const sair = async (token: string | undefined) => {
  if (token) {
    await redis.del(`sessao:${token}`);
  }
};
