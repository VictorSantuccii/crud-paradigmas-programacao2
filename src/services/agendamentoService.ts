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

const validar = async (agendamento: Vinculos) => {
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

  if (animal.usuarioId !== agendamento.usuarioId) {
    throw badRequest("O animal informado não pertence ao usuário do agendamento.");
  }
};

export const list = () => agendamentoRepository.findAll();

export const getById = (id: number) =>
  existeOu404(agendamentoRepository.findById(id), NAO_ENCONTRADO);

export const create = async (body: unknown) => {
  const dados = parseCriacao(campos, body);
  await validar(dados);
  return agendamentoRepository.create(dados);
};

export const update = async (id: number, body: unknown) => {
  const dados = parseAtualizacao(campos, body);
  const atual = await getById(id);
  await validar({ ...atual, ...dados });
  return agendamentoRepository.update(id, dados);
};

export const remove = async (id: number) => {
  await getById(id);
  await agendamentoRepository.remove(id);
};
