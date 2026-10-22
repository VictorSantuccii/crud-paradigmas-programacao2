import { telefone } from "../lib/identity";
import { Contexto, autorizar, escopo, dono } from "../lib/authorization";
import { forbidden } from "../lib/errors";
import { conflict, existeOu404 } from "../lib/errors";
import { obrigatorio, opcional, parseAtualizacao, parseCriacao, texto } from "../lib/parsers";
import * as agendamentoRepository from "../repositories/agendamentoRepository";
import * as funcionarioRepository from "../repositories/funcionarioRepository";

const campos = {
  nome: obrigatorio(texto),
  cargo: obrigatorio(texto),
  telefone: opcional(telefone),
};

const NAO_ENCONTRADO = "Funcionário não encontrado.";

export const list = (ctx?: Contexto) => funcionarioRepository.findAll(escopo("funcionario", ctx));

export const getById = async (id: number, ctx?: Contexto) => {
  const scoped = await funcionarioRepository.findById(id, escopo("funcionario", ctx));
  if (scoped) return scoped;
  await existeOu404(funcionarioRepository.findById(id), NAO_ENCONTRADO);
  throw forbidden();
};

export const create = (body: unknown, ctx?: Contexto) => {
  autorizar("funcionario", false, ctx);
  return funcionarioRepository.create(parseCriacao(campos, body));
};

export const update = async (id: number, body: unknown, ctx?: Contexto) => {
  autorizar("funcionario", false, ctx);
  body = dono(body, ctx);
  await getById(id, ctx);
  const dados = parseAtualizacao(campos, body);
  await getById(id, ctx);
  return funcionarioRepository.update(id, dados);
};

export const remove = async (id: number, ctx?: Contexto) => {
  autorizar("funcionario", false, ctx);
  await getById(id, ctx);
  if ((await agendamentoRepository.countByFuncionario(id)) > 0) {
    throw conflict("Funcionário com agendamentos vinculados não pode ser removido.");
  }
  await funcionarioRepository.remove(id);
};
