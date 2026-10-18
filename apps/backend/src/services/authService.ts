import { randomBytes } from "node:crypto";
import { Role } from "@prisma/client";
import { badRequest, conflict, unauthorized } from "../lib/errors";
import prisma from "../lib/prisma";
import { verificarSenha } from "../lib/password";
import redis from "../lib/redis";
import * as usuarioRepository from "../repositories/usuarioRepository";
import { create as criarUsuario } from "./usuarioService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 24 * 30;

export type UsuarioPublico = {
  id: number;
  nome: string;
  email: string | null;
  role: Role;
};

const publico = (usuario: { id: number; nome: string; email: string | null; role: Role }): UsuarioPublico => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  role: usuario.role,
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
  const usuario = await usuarioRepository.findByEmail(email);
  if (!usuario || !(await verificarSenha(body.senha, usuario.senhaHash))) {
    throw unauthorized("E-mail ou senha inválidos.");
  }
  return novaSessao(publico(usuario));
};

export const consultarSessao = async (token: string | undefined) => {
  if (!token) return null;
  const valor = await redis.get(`sessao:${token}`);
  if (!valor) return null;
  const usuario = JSON.parse(valor) as UsuarioPublico;
  const atual = await usuarioRepository.findById(usuario.id);
  if (!atual) {
    await redis.del(`sessao:${token}`);
    return null;
  }
  return publico(atual);
};

export const sair = async (token: string | undefined) => {
  if (token) {
    await redis.del(`sessao:${token}`);
  }
};
