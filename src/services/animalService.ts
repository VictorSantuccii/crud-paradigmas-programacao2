import { Porte } from "@prisma/client";
import { conflict, existeOu404 } from "../lib/errors";
import {
  enumeracao,
  idReferencia,
  inteiro,
  obrigatorio,
  parseAtualizacao,
  parseCriacao,
  texto,
} from "../lib/parsers";
import * as agendamentoRepository from "../repositories/agendamentoRepository";
import * as animalRepository from "../repositories/animalRepository";
import * as usuarioRepository from "../repositories/usuarioRepository";

const campos = {
  idade: obrigatorio(inteiro(0)),
  porte: obrigatorio(enumeracao(Porte)),
  especie: obrigatorio(texto),
  nome: obrigatorio(texto),
  usuarioId: obrigatorio(idReferencia),
};

const NAO_ENCONTRADO = "Animal não encontrado.";

const garantirUsuario = (usuarioId: number) =>
  existeOu404(usuarioRepository.findById(usuarioId), "Usuário não encontrado.");

export const list = () => animalRepository.findAll();

export const getById = (id: number) => existeOu404(animalRepository.findById(id), NAO_ENCONTRADO);

export const create = async (body: unknown) => {
  const dados = parseCriacao(campos, body);
  await garantirUsuario(dados.usuarioId);
  return animalRepository.create(dados);
};

export const update = async (id: number, body: unknown) => {
  const dados = parseAtualizacao(campos, body);
  const atual = await getById(id);

  if (dados.usuarioId !== undefined && dados.usuarioId !== atual.usuarioId) {
    await garantirUsuario(dados.usuarioId);
    if ((await agendamentoRepository.countByAnimal(id)) > 0) {
      throw conflict("Animal com agendamentos vinculados não pode trocar de dono.");
    }
  }

  return animalRepository.update(id, dados);
};

export const remove = async (id: number) => {
  await getById(id);
  if ((await agendamentoRepository.countByAnimal(id)) > 0) {
    throw conflict("Animal com agendamentos vinculados não pode ser removido.");
  }
  await animalRepository.remove(id);
};
