import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.AnimalUncheckedCreateInput) => prisma.animal.create({ data });

export const findAll = () => prisma.animal.findMany({ orderBy: { id: "desc" } });

export const findById = (id: number) => prisma.animal.findUnique({ where: { id } });

export const update = (id: number, data: Prisma.AnimalUncheckedUpdateInput) =>
  prisma.animal.update({ where: { id }, data });

export const remove = (id: number) => prisma.animal.delete({ where: { id } });
