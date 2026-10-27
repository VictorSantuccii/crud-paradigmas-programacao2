import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/errors';

export type AgendaDb = Prisma.TransactionClient;
// Toda mutação da operação usa a mesma ordem: lock global, depois lock da reserva.
// READ COMMITTED vê alterações confirmadas enquanto esperava pelo advisory lock.
export const transacaoAgenda = async <T>(operacao: (db: AgendaDb) => Promise<T>) => {
  try {
    return await prisma.$transaction(async db => {
      await db.$executeRaw`SELECT pg_advisory_xact_lock(30003)`;
      return operacao(db);
    }, { maxWait: 20000, timeout: 20000 });
  } catch (error) {
    if (/23P01|agendamento_sem_sobreposicao/.test(String(error))) throw horarioIndisponivel();
    throw error;
  }
};
export const horarioIndisponivel = () => new HttpError(409, 'Este horário não está disponível. Escolha outro horário.', 'HORARIO_INDISPONIVEL');
export const bloquearAgendamento = (db: AgendaDb, id: number) => db.$queryRaw`SELECT id FROM agendamentos WHERE id = ${id} FOR UPDATE`;

export const relacoesAgendamento = {
  animal: { select: { id: true, nome: true, especie: true } },
  servico: { select: { id: true, nome: true, categoria: true } },
  funcionario: { select: { id: true, nome: true, cargo: true } },
} satisfies Prisma.AgendamentoInclude;
