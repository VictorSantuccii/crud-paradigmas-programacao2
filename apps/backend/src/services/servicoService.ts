import { Contexto, autorizar } from "../lib/authorization";
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

const listInterno = async () => (await servicoRepository.findAll()).map(formatar);

const getByIdInterno = async (id: number) => formatar(await buscar(id));

const createInterno = async (body: unknown) =>
  formatar(await servicoRepository.create(parseCriacao(campos, body)));

const updateInterno = async (id: number, body: unknown) => {
  const dados = parseAtualizacao(campos, body);
  await buscar(id);
  return formatar(await servicoRepository.update(id, dados));
};

const removeInterno = async (id: number) => {
  await buscar(id);
  if ((await agendamentoRepository.countByServico(id)) > 0) {
    throw conflict("Serviço com agendamentos vinculados não pode ser removido.");
  }
  await servicoRepository.remove(id);
};

export const list = (ctx?: Contexto) => { autorizar("servico", true, ctx); return listInterno(); };

export const getById = (id: number, ctx?: Contexto) => { autorizar("servico", true, ctx); return getByIdInterno(id); };

export const create = (body: unknown, ctx?: Contexto) => { autorizar("servico", false, ctx); return createInterno(body); };

export const update = (id: number, body: unknown, ctx?: Contexto) => { autorizar("servico", false, ctx); return updateInterno(id, body); };

export const remove = (id: number, ctx?: Contexto) => { autorizar("servico", false, ctx); return removeInterno(id); };
