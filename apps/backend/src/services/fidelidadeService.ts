import { Contexto, autorizar, escopo, dono } from "../lib/authorization";
import { forbidden } from "../lib/errors";
import { conflict, existeOu404 } from "../lib/errors";
import { booleano, inteiro, obrigatorio, parseAtualizacao, parseCriacao } from "../lib/parsers";
import * as fidelidadeRepository from "../repositories/fidelidadeRepository";
import * as usuarioRepository from "../repositories/usuarioRepository";

const campos = {
  beneficioAtivo: obrigatorio(booleano),
  qntdServicos: obrigatorio(inteiro(0)),
};

const NAO_ENCONTRADA = "Fidelidade não encontrada.";

export const list = (ctx?: Contexto) => fidelidadeRepository.findAll(escopo("fidelidade", ctx));

export const getById = async (id: number, ctx?: Contexto) => {
  const scoped = await fidelidadeRepository.findById(id, escopo("fidelidade", ctx));
  if (scoped) return scoped;
  await existeOu404(fidelidadeRepository.findById(id), NAO_ENCONTRADA);
  throw forbidden();
};

export const create = (body: unknown, ctx?: Contexto) => {
  autorizar("fidelidade", false, ctx);
  return fidelidadeRepository.create(parseCriacao(campos, body));
};

export const update = async (id: number, body: unknown, ctx?: Contexto) => {
  autorizar("fidelidade", false, ctx);
  body = dono(body, ctx);
  await getById(id, ctx);
  const dados = parseAtualizacao(campos, body);
  await getById(id, ctx);
  return fidelidadeRepository.update(id, dados);
};

export const remove = async (id: number, ctx?: Contexto) => {
  autorizar("fidelidade", false, ctx);
  await getById(id, ctx);
  if (await usuarioRepository.findByFidelidadeId(id)) {
    throw conflict("Fidelidade vinculada a um usuário não pode ser removida.");
  }
  await fidelidadeRepository.remove(id);
};
