import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.AgendamentoUncheckedCreateInput) =>
  prisma.agendamento.create({ data });

export const findAll = (where: Prisma.AgendamentoWhereInput = {}) => prisma.agendamento.findMany({ where, orderBy: { id: "desc" } });

export const findById = (id: number, scope: Prisma.AgendamentoWhereInput = {}) => prisma.agendamento.findFirst({ where: { AND: [{ id }, scope] } });

export const update = (id: number, data: Prisma.AgendamentoUncheckedUpdateInput, scope: Prisma.AgendamentoWhereInput = {}) =>
  prisma.agendamento.update({ where: { id, AND: [scope] }, data });

export const remove = (id: number, scope: Prisma.AgendamentoWhereInput = {}) => prisma.agendamento.delete({ where: { id, AND: [scope] } });

export const countByUsuario = (usuarioId: number) =>
  prisma.agendamento.count({ where: { usuarioId } });

export const countByDonoDoAnimal = (usuarioId: number) =>
  prisma.agendamento.count({ where: { animal: { usuarioId } } });

export const countByAnimal = (animalId: number) =>
  prisma.agendamento.count({ where: { animalId } });

export const countByServico = (servicoId: number) =>
  prisma.agendamento.count({ where: { servicoId } });

export const countByFuncionario = (funcionarioId: number) =>
  prisma.agendamento.count({ where: { funcionarioId } });
