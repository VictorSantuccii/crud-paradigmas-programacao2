import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export const create = (data: Prisma.AgendamentoUncheckedCreateInput) =>
  prisma.agendamento.create({ data });

export const findAll = () => prisma.agendamento.findMany({ orderBy: { id: "desc" } });

export const findById = (id: number) => prisma.agendamento.findUnique({ where: { id } });

export const update = (id: number, data: Prisma.AgendamentoUncheckedUpdateInput) =>
  prisma.agendamento.update({ where: { id }, data });

export const remove = (id: number) => prisma.agendamento.delete({ where: { id } });

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
