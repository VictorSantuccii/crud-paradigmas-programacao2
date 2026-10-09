import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.PlanoUncheckedCreateInput) => prisma.plano.create({ data });

export const findAll = () => prisma.plano.findMany({ orderBy: { id: "desc" } });

export const findById = (id: number) => prisma.plano.findUnique({ where: { id } });

export const update = (id: number, data: Prisma.PlanoUncheckedUpdateInput) =>
  prisma.plano.update({ where: { id }, data });

export const remove = (id: number) => prisma.plano.delete({ where: { id } });
