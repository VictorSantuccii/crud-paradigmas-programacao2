import { Role, Usuario } from "@prisma/client";
import { badRequest, conflict, existeOu404 } from "../lib/errors";
import { hashSenha } from "../lib/password";
import {
  enumeracao,
  idReferencia,
  obrigatorio,
  opcional,
  parseAtualizacao,
  parseCriacao,
  texto,
} from "../lib/parsers";
import * as agendamentoRepository from "../repositories/agendamentoRepository";
import * as assinaturaRepository from "../repositories/assinaturaRepository";
import * as fidelidadeRepository from "../repositories/fidelidadeRepository";
import * as usuarioRepository from "../repositories/usuarioRepository";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const email = (valor: unknown, campo: string) => {
  const resultado = texto(valor, campo).toLowerCase();
  if (!EMAIL_REGEX.test(resultado)) {
    throw badRequest(`O campo ${campo} deve ser um e-mail válido.`);
  }
  return resultado;
};

const senha = (valor: unknown, campo: string) => {
  if (typeof valor !== "string" || valor.length === 0) {
    throw badRequest(`O campo ${campo} deve ser um texto não vazio.`);
  }
  return valor;
};

const camposAtualizacao = {
  email: opcional(email),
  senha: obrigatorio(senha),
  role: obrigatorio(enumeracao(Role)),
  cpf: obrigatorio(texto),
  nome: obrigatorio(texto),
};

const camposCriacao = {
  ...camposAtualizacao,
  fidelidadeId: opcional(idReferencia),
};

const NAO_ENCONTRADO = "Usuário não encontrado.";

const semSenha = ({ senhaHash: _senhaHash, ...usuario }: Usuario) => usuario;

const buscar = (id: number) => existeOu404(usuarioRepository.findById(id), NAO_ENCONTRADO);

export const list = async () => (await usuarioRepository.findAll()).map(semSenha);

export const getById = async (id: number) => semSenha(await buscar(id));

export const create = async (body: unknown) => {
  const { senha: senhaTexto, fidelidadeId, ...resto } = parseCriacao(camposCriacao, body);
  const dados = { ...resto, senhaHash: await hashSenha(senhaTexto) };

  if (fidelidadeId === null) {
    return semSenha(await usuarioRepository.createComNovaFidelidade(dados));
  }

  await existeOu404(fidelidadeRepository.findById(fidelidadeId), "Fidelidade não encontrada.");
  if (await usuarioRepository.findByFidelidadeId(fidelidadeId)) {
    throw conflict("Essa fidelidade já pertence a outro usuário.");
  }
  return semSenha(await usuarioRepository.createComFidelidadeExistente(dados, fidelidadeId));
};

export const update = async (id: number, body: unknown) => {
  const { senha: senhaTexto, ...resto } = parseAtualizacao(camposAtualizacao, body);
  await buscar(id);

  const dados =
    senhaTexto === undefined ? resto : { ...resto, senhaHash: await hashSenha(senhaTexto) };

  return semSenha(await usuarioRepository.update(id, dados));
};

export const remove = async (id: number) => {
  const usuario = await buscar(id);

  const [agendamentos, agendamentosDosAnimais, assinaturas] = await Promise.all([
    agendamentoRepository.countByUsuario(id),
    agendamentoRepository.countByDonoDoAnimal(id),
    assinaturaRepository.countByUsuario(id),
  ]);

  if (agendamentos + agendamentosDosAnimais + assinaturas > 0) {
    throw conflict("Usuário com agendamentos ou assinaturas vinculados não pode ser removido.");
  }

  await usuarioRepository.removerComFidelidade(id, usuario.fidelidadeId);
};
