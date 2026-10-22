import { Contexto, autorizar } from "../lib/authorization";
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

const listInterno = async () => (await assinaturaRepository.findAll()).map(formatar);

const getByIdInterno = async (id: number) => formatar(await buscar(id));

const createInterno = async (body: unknown) => {
  const { servicosRest, ...dados } = parseCriacao(campos, body);
  await garantirVinculos(dados.usuarioId, dados.planoId);
  return formatar(
    await assinaturaRepository.create({ ...dados, servicosRest: paraBanco(servicosRest) }),
  );
};

const updateInterno = async (id: number, body: unknown) => {
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

const removeInterno = async (id: number) => {
  await buscar(id);
  await assinaturaRepository.remove(id);
};

export const list = (ctx?: Contexto) => { autorizar("assinatura", true, ctx); return listInterno(); };

export const getById = (id: number, ctx?: Contexto) => { autorizar("assinatura", true, ctx); return getByIdInterno(id); };

export const create = (body: unknown, ctx?: Contexto) => { autorizar("assinatura", false, ctx); return createInterno(body); };

export const update = (id: number, body: unknown, ctx?: Contexto) => { autorizar("assinatura", false, ctx); return updateInterno(id, body); };

export const remove = (id: number, ctx?: Contexto) => { autorizar("assinatura", false, ctx); return removeInterno(id); };
