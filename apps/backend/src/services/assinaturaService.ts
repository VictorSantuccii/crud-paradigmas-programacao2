import { Assinatura, Prisma } from "@prisma/client";
import { existeOu404 } from "../lib/errors";
import {
  data,
  dataSaida,
  idReferencia,
  json,
  obrigatorio,
  opcional,
  parseAtualizacao,
  parseCriacao,
} from "../lib/parsers";
import * as assinaturaRepository from "../repositories/assinaturaRepository";
import * as planoRepository from "../repositories/planoRepository";
import * as usuarioRepository from "../repositories/usuarioRepository";

const campos = {
  servicosRest: opcional(json),
  dataAquisicao: obrigatorio(data),
  usuarioId: obrigatorio(idReferencia),
  planoId: obrigatorio(idReferencia),
};

const NAO_ENCONTRADA = "Assinatura não encontrada.";

const formatar = (assinatura: Assinatura) => ({
  ...assinatura,
  dataAquisicao: dataSaida(assinatura.dataAquisicao),
});

const paraBanco = (servicosRest: Prisma.InputJsonValue | null) =>
  servicosRest === null ? Prisma.DbNull : servicosRest;

const garantirVinculos = async (usuarioId?: number, planoId?: number) => {
  if (usuarioId !== undefined) {
    await existeOu404(usuarioRepository.findById(usuarioId), "Usuário não encontrado.");
  }
  if (planoId !== undefined) {
    await existeOu404(planoRepository.findById(planoId), "Plano não encontrado.");
  }
};

const buscar = (id: number) => existeOu404(assinaturaRepository.findById(id), NAO_ENCONTRADA);

export const list = async () => (await assinaturaRepository.findAll()).map(formatar);

export const getById = async (id: number) => formatar(await buscar(id));

export const create = async (body: unknown) => {
  const { servicosRest, ...dados } = parseCriacao(campos, body);
  await garantirVinculos(dados.usuarioId, dados.planoId);
  return formatar(
    await assinaturaRepository.create({ ...dados, servicosRest: paraBanco(servicosRest) }),
  );
};

export const update = async (id: number, body: unknown) => {
  const { servicosRest, ...dados } = parseAtualizacao(campos, body);
  await buscar(id);
  await garantirVinculos(dados.usuarioId, dados.planoId);
  return formatar(
    await assinaturaRepository.update(id, {
      ...dados,
      ...(servicosRest !== undefined && { servicosRest: paraBanco(servicosRest) }),
    }),
  );
};

export const remove = async (id: number) => {
  await buscar(id);
  await assinaturaRepository.remove(id);
};
