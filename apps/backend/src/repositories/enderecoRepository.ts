import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.EnderecoUncheckedCreateInput) =>
  prisma.endereco.create({ data });

export const findAll = (where: Prisma.EnderecoWhereInput = {}) => prisma.endereco.findMany({ where, orderBy: { id: "desc" } });

export const findById = (id: number, scope: Prisma.EnderecoWhereInput = {}) => prisma.endereco.findFirst({ where: { AND: [{ id }, scope] } });

export const update = (id: number, data: Prisma.EnderecoUncheckedUpdateInput) =>
  prisma.endereco.update({ where: { id }, data });

export const remove = (id: number) => prisma.endereco.delete({ where: { id } });
