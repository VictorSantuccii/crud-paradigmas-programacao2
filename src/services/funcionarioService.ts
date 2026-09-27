import { conflict, existeOu404 } from "../lib/errors";
import { obrigatorio, opcional, parseAtualizacao, parseCriacao, texto } from "../lib/parsers";
import * as agendamentoRepository from "../repositories/agendamentoRepository";
import * as funcionarioRepository from "../repositories/funcionarioRepository";

const campos = {
  nome: obrigatorio(texto),
  cargo: obrigatorio(texto),
  telefone: opcional(texto),
};

const NAO_ENCONTRADO = "Funcionário não encontrado.";

export const list = () => funcionarioRepository.findAll();

export const getById = (id: number) =>
  existeOu404(funcionarioRepository.findById(id), NAO_ENCONTRADO);

export const create = (body: unknown) =>
  funcionarioRepository.create(parseCriacao(campos, body));

export const update = async (id: number, body: unknown) => {
  const dados = parseAtualizacao(campos, body);
  await getById(id);
  return funcionarioRepository.update(id, dados);
};

export const remove = async (id: number) => {
  await getById(id);
  if ((await agendamentoRepository.countByFuncionario(id)) > 0) {
    throw conflict("Funcionário com agendamentos vinculados não pode ser removido.");
  }
  await funcionarioRepository.remove(id);
};
