import { Servico } from "@prisma/client";
import { conflict, existeOu404 } from "../lib/errors";
import {
  inteiro,
  obrigatorio,
  opcional,
  parseAtualizacao,
  parseCriacao,
  preco,
  precoSaida,
  texto,
} from "../lib/parsers";
import * as agendamentoRepository from "../repositories/agendamentoRepository";
import * as servicoRepository from "../repositories/servicoRepository";

const campos = {
  descricao: opcional(texto),
  duracaoMin: obrigatorio(inteiro(1)),
  preco: obrigatorio(preco),
  nome: obrigatorio(texto),
};

const NAO_ENCONTRADO = "Serviço não encontrado.";

const formatar = (servico: Servico) => ({ ...servico, preco: precoSaida(servico.preco) });

const buscar = (id: number) => existeOu404(servicoRepository.findById(id), NAO_ENCONTRADO);

export const list = async () => (await servicoRepository.findAll()).map(formatar);

export const getById = async (id: number) => formatar(await buscar(id));

export const create = async (body: unknown) =>
  formatar(await servicoRepository.create(parseCriacao(campos, body)));

export const update = async (id: number, body: unknown) => {
  const dados = parseAtualizacao(campos, body);
  await buscar(id);
  return formatar(await servicoRepository.update(id, dados));
};

export const remove = async (id: number) => {
  await buscar(id);
  if ((await agendamentoRepository.countByServico(id)) > 0) {
    throw conflict("Serviço com agendamentos vinculados não pode ser removido.");
  }
  await servicoRepository.remove(id);
};
