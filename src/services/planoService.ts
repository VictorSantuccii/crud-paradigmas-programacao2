import { Plano, TipoPlano } from "@prisma/client";
import { conflict, existeOu404 } from "../lib/errors";
import {
  enumeracao,
  obrigatorio,
  parseAtualizacao,
  parseCriacao,
  preco,
  precoSaida,
} from "../lib/parsers";
import * as assinaturaRepository from "../repositories/assinaturaRepository";
import * as planoRepository from "../repositories/planoRepository";

const campos = {
  preco: obrigatorio(preco),
  tipo: obrigatorio(enumeracao(TipoPlano)),
};

const NAO_ENCONTRADO = "Plano não encontrado.";

const formatar = (plano: Plano) => ({ ...plano, preco: precoSaida(plano.preco) });

const buscar = (id: number) => existeOu404(planoRepository.findById(id), NAO_ENCONTRADO);

export const list = async () => (await planoRepository.findAll()).map(formatar);

export const getById = async (id: number) => formatar(await buscar(id));

export const create = async (body: unknown) =>
  formatar(await planoRepository.create(parseCriacao(campos, body)));

export const update = async (id: number, body: unknown) => {
  const dados = parseAtualizacao(campos, body);
  await buscar(id);
  return formatar(await planoRepository.update(id, dados));
};

export const remove = async (id: number) => {
  await buscar(id);
  if ((await assinaturaRepository.countByPlano(id)) > 0) {
    throw conflict("Plano com assinaturas vinculadas não pode ser removido.");
  }
  await planoRepository.remove(id);
};
