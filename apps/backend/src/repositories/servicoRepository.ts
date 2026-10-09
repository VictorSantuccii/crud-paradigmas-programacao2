import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.ServicoUncheckedCreateInput) =>
  prisma.servico.create({ data });

export const findAll = () => prisma.servico.findMany({ orderBy: { id: "desc" } });

export const findById = (id: number) => prisma.servico.findUnique({ where: { id } });

export const update = (id: number, data: Prisma.ServicoUncheckedUpdateInput) =>
  prisma.servico.update({ where: { id }, data });

export const remove = (id: number) => prisma.servico.delete({ where: { id } });
