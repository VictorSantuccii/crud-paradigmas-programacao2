import { Contexto, autorizar, escopo, dono } from "../lib/authorization";
import { forbidden } from "../lib/errors";
import { badRequest, existeOu404 } from "../lib/errors";
import {
  dataHora,
  idReferencia,
  obrigatorio,
  parseAtualizacao,
  parseCriacao,
} from "../lib/parsers";
import * as agendamentoRepository from "../repositories/agendamentoRepository";
import * as animalRepository from "../repositories/animalRepository";
import * as funcionarioRepository from "../repositories/funcionarioRepository";
import * as servicoRepository from "../repositories/servicoRepository";
import * as usuarioRepository from "../repositories/usuarioRepository";

const campos = {
  dataHoraIni: obrigatorio(dataHora),
  dataHoraFim: obrigatorio(dataHora),
  usuarioId: obrigatorio(idReferencia),
  animalId: obrigatorio(idReferencia),
  servicoId: obrigatorio(idReferencia),
  funcionarioId: obrigatorio(idReferencia),
};

type Vinculos = {
  dataHoraIni: Date;
  dataHoraFim: Date;
  usuarioId: number;
  animalId: number;
  servicoId: number;
  funcionarioId: number;
};

const NAO_ENCONTRADO = "Agendamento não encontrado.";

const validar = async (agendamento: Vinculos, ctx?: Contexto) => {
  if (agendamento.dataHoraFim <= agendamento.dataHoraIni) {
    throw badRequest("dataHoraFim deve ser posterior a dataHoraIni.");
  }

  const [, animal] = await Promise.all([
    existeOu404(usuarioRepository.findById(agendamento.usuarioId), "Usuário não encontrado."),
    existeOu404(animalRepository.findById(agendamento.animalId), "Animal não encontrado."),
    existeOu404(servicoRepository.findById(agendamento.servicoId), "Serviço não encontrado."),
    existeOu404(
      funcionarioRepository.findById(agendamento.funcionarioId),
      "Funcionário não encontrado.",
    ),
  ]);

  if (ctx?.role === "CLIENTE" && animal.usuarioId !== ctx.id) throw forbidden("Animal não pertence à conta.");
  if (animal.usuarioId !== agendamento.usuarioId) {
    throw badRequest("O animal informado não pertence ao usuário do agendamento.");
  }
};

export const list = (ctx?: Contexto) => agendamentoRepository.findAll(escopo("agendamento", ctx));

export const getById = async (id: number, ctx?: Contexto) => {
  const scoped = await agendamentoRepository.findById(id, escopo("agendamento", ctx));
  if (scoped) return scoped;
  await existeOu404(agendamentoRepository.findById(id), NAO_ENCONTRADO);
  throw forbidden();
};

export const create = async (body: unknown, ctx?: Contexto) => {
  autorizar("agendamento", false, ctx);
  body = dono(body, ctx);
  const dados = parseCriacao(campos, body);
  await validar(dados, ctx);
  return agendamentoRepository.create(dados);
};

export const update = async (id: number, body: unknown, ctx?: Contexto) => {
  autorizar("agendamento", false, ctx);
  body = dono(body, ctx);
  const dados = parseAtualizacao(campos, body);
  const atual = await getById(id, ctx);
  await validar({ ...atual, ...dados }, ctx);
  return agendamentoRepository.update(id, dados, escopo("agendamento", ctx));
};

export const remove = async (id: number, ctx?: Contexto) => {
  autorizar("agendamento", false, ctx);
  await getById(id, ctx);
  await agendamentoRepository.remove(id, escopo("agendamento", ctx));
};
