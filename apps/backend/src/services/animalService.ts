import { Contexto, autorizar, escopo, dono } from "../lib/authorization";
import { forbidden } from "../lib/errors";
import { Porte, Prisma } from "@prisma/client";
import { conflict, existeOu404 } from "../lib/errors";
import {
  enumeracao,
  idReferencia,
  inteiro,
  obrigatorio,
  opcional,
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
  raca: opcional(texto),
  usuarioId: obrigatorio(idReferencia),
};

const NAO_ENCONTRADO = "Animal não encontrado.";

const garantirUsuario = (usuarioId: number) =>
  existeOu404(usuarioRepository.findById(usuarioId), "Usuário não encontrado.");

export const list = (ctx?: Contexto) => animalRepository.findAll(escopo("animal", ctx));

export const getById = async (id: number, ctx?: Contexto) => {
  const scoped = await animalRepository.findById(id, escopo("animal", ctx));
  if (scoped) return scoped;
  await existeOu404(animalRepository.findById(id), NAO_ENCONTRADO);
  throw forbidden();
};

export const create = async (body: unknown, ctx?: Contexto) => {
  autorizar("animal", false, ctx);
  body = dono(body, ctx);
  const dados = parseCriacao(campos, body);
  await garantirUsuario(dados.usuarioId);
  return animalRepository.create(dados);
};

export const update = async (id: number, body: unknown, ctx?: Contexto) => {
  autorizar("animal", false, ctx);
  body = dono(body, ctx);
  const dados = parseAtualizacao(campos, body);
  const atual = await getById(id, ctx);

  if (dados.usuarioId !== undefined && dados.usuarioId !== atual.usuarioId) {
    await garantirUsuario(dados.usuarioId);
    if ((await agendamentoRepository.countByAnimal(id)) > 0) {
      throw conflict("Animal com agendamentos vinculados não pode trocar de dono.");
    }
  }

  return animalRepository.update(id, dados, escopo("animal", ctx));
};

export const remove = async (id: number, ctx?: Contexto) => {
  autorizar("animal", false, ctx);
  await getById(id, ctx);
  if ((await agendamentoRepository.countByAnimal(id)) > 0) {
    throw conflict("Animal com agendamentos vinculados não pode ser removido.");
  }
  try {
    await animalRepository.remove(id, escopo("animal", ctx));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw conflict("Animal com agendamentos vinculados não pode ser removido.");
    }
    throw error;
  }
};
