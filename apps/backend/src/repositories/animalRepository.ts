import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.AnimalUncheckedCreateInput) => prisma.animal.create({ data });

export const findAll = (where: Prisma.AnimalWhereInput = {}) => prisma.animal.findMany({ where, orderBy: { id: "desc" } });

export const findById = (id: number, scope: Prisma.AnimalWhereInput = {}) => prisma.animal.findFirst({ where: { AND: [{ id }, scope] } });

export const update = (id: number, data: Prisma.AnimalUncheckedUpdateInput, scope: Prisma.AnimalWhereInput = {}) =>
  prisma.animal.update({ where: { id, AND: [scope] }, data });

export const remove = (id: number, scope: Prisma.AnimalWhereInput = {}) => prisma.animal.delete({ where: { id, AND: [scope] } });
