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
  cep: obrigatorio(texto),
  complemento: opcional(texto),
  bairro: obrigatorio(texto),
  numero: obrigatorio(inteiro(0)),
  rua: obrigatorio(texto),
  usuarioId: obrigatorio(idReferencia),
};

const NAO_ENCONTRADO = "Endereço não encontrado.";

const garantirUsuario = (usuarioId: number) =>
  existeOu404(usuarioRepository.findById(usuarioId), "Usuário não encontrado.");

export const list = () => enderecoRepository.findAll();

export const getById = (id: number) =>
  existeOu404(enderecoRepository.findById(id), NAO_ENCONTRADO);

export const create = async (body: unknown) => {
  const dados = parseCriacao(campos, body);
  await garantirUsuario(dados.usuarioId);
  return enderecoRepository.create(dados);
};

export const update = async (id: number, body: unknown) => {
  const dados = parseAtualizacao(campos, body);
  await getById(id);
  if (dados.usuarioId !== undefined) {
    await garantirUsuario(dados.usuarioId);
  }
  return enderecoRepository.update(id, dados);
};

export const remove = async (id: number) => {
  await getById(id);
  await enderecoRepository.remove(id);
};
