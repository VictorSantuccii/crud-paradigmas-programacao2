import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.FidelidadeUncheckedCreateInput) =>
  prisma.fidelidade.create({ data });

export const findAll = () => prisma.fidelidade.findMany({ orderBy: { id: "desc" } });

export const findById = (id: number) => prisma.fidelidade.findUnique({ where: { id } });

export const update = (id: number, data: Prisma.FidelidadeUncheckedUpdateInput) =>
  prisma.fidelidade.update({ where: { id }, data });

export const remove = (id: number) => prisma.fidelidade.delete({ where: { id } });
