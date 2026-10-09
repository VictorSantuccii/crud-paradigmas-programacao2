import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.AssinaturaUncheckedCreateInput) =>
  prisma.assinatura.create({ data });

export const findAll = () => prisma.assinatura.findMany({ orderBy: { id: "desc" } });

export const findById = (id: number) => prisma.assinatura.findUnique({ where: { id } });

export const update = (id: number, data: Prisma.AssinaturaUncheckedUpdateInput) =>
  prisma.assinatura.update({ where: { id }, data });

export const remove = (id: number) => prisma.assinatura.delete({ where: { id } });

export const countByUsuario = (usuarioId: number) =>
  prisma.assinatura.count({ where: { usuarioId } });

export const countByPlano = (planoId: number) => prisma.assinatura.count({ where: { planoId } });
