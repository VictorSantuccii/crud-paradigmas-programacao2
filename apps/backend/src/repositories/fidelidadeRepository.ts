import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const findAll = (where: Prisma.FidelidadeWhereInput = {}) => prisma.fidelidade.findMany({ where, orderBy: { id: "desc" } });

export const findById = (id: number, scope: Prisma.FidelidadeWhereInput = {}) => prisma.fidelidade.findFirst({ where: { AND: [{ id }, scope] } });
