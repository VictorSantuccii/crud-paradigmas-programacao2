import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

type DadosUsuario = Omit<Prisma.UsuarioUncheckedCreateInput, "fidelidadeId">;

export const createComNovaFidelidade = (data: DadosUsuario) =>
  prisma.$transaction(async (tx) => {
    const fidelidade = await tx.fidelidade.create({
      data: { beneficioAtivo: false, qntdServicos: 0 },
    });
    return tx.usuario.create({ data: { ...data, fidelidadeId: fidelidade.id } });
  });

export const createComFidelidadeExistente = (data: DadosUsuario, fidelidadeId: number) =>
  prisma.usuario.create({ data: { ...data, fidelidadeId } });

export const findAll = () => prisma.usuario.findMany({ orderBy: { id: "desc" } });

export const findById = (id: number) => prisma.usuario.findUnique({ where: { id } });

export const findByFidelidadeId = (fidelidadeId: number) =>
  prisma.usuario.findUnique({ where: { fidelidadeId } });

export const update = (id: number, data: Prisma.UsuarioUncheckedUpdateInput) =>
  prisma.usuario.update({ where: { id }, data });

export const removerComFidelidade = (id: number, fidelidadeId: number) =>
  prisma.$transaction([
    prisma.usuario.delete({ where: { id } }),
    prisma.fidelidade.delete({ where: { id: fidelidadeId } }),
  ]);
