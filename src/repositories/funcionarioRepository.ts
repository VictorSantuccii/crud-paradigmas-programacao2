import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.FuncionarioUncheckedCreateInput) =>
  prisma.funcionario.create({ data });

export const findAll = () => prisma.funcionario.findMany({ orderBy: { id: "desc" } });

export const findById = (id: number) => prisma.funcionario.findUnique({ where: { id } });

export const update = (id: number, data: Prisma.FuncionarioUncheckedUpdateInput) =>
  prisma.funcionario.update({ where: { id }, data });

export const remove = (id: number) => prisma.funcionario.delete({ where: { id } });
