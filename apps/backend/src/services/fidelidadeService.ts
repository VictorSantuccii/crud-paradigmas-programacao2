import { conflict, existeOu404 } from "../lib/errors";
import { booleano, inteiro, obrigatorio, parseAtualizacao, parseCriacao } from "../lib/parsers";
import * as fidelidadeRepository from "../repositories/fidelidadeRepository";
import * as usuarioRepository from "../repositories/usuarioRepository";

const campos = {
  beneficioAtivo: obrigatorio(booleano),
  qntdServicos: obrigatorio(inteiro(0)),
};

const NAO_ENCONTRADA = "Fidelidade não encontrada.";

export const list = () => fidelidadeRepository.findAll();

export const getById = (id: number) =>
  existeOu404(fidelidadeRepository.findById(id), NAO_ENCONTRADA);

export const create = (body: unknown) =>
  fidelidadeRepository.create(parseCriacao(campos, body));

export const update = async (id: number, body: unknown) => {
  const dados = parseAtualizacao(campos, body);
  await getById(id);
  return fidelidadeRepository.update(id, dados);
};

export const remove = async (id: number) => {
  await getById(id);
  if (await usuarioRepository.findByFidelidadeId(id)) {
    throw conflict("Fidelidade vinculada a um usuário não pode ser removida.");
  }
  await fidelidadeRepository.remove(id);
};
