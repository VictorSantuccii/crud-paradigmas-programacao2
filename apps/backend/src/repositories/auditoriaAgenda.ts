import prisma from '../lib/prisma';
import type { AgendaDb } from './agendaRepository';
export async function auditarAgenda(db: AgendaDb = prisma) {
  const invalidos = await db.$queryRaw<{ id: number }[]>`SELECT id FROM agendamentos WHERE "dataHoraFim" <= "dataHoraIni" ORDER BY id`;
  const coluna = await db.$queryRaw<{ existe: boolean }[]>`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'agendamentos' AND column_name = 'status') AS existe`;
  // O predicado depende apenas da versão do schema, nunca de entrada do usuário.
  const estados = coluna[0].existe ? " AND a.status IN ('AGENDADO', 'CONCLUIDO') AND b.status IN ('AGENDADO', 'CONCLUIDO')" : '';
  const sobrepostos = await db.$queryRawUnsafe<{ primeiroId: number; segundoId: number; funcionarioId: number }[]>(`
    SELECT a.id AS "primeiroId", b.id AS "segundoId", a.id_funcionario AS "funcionarioId"
    FROM agendamentos a JOIN agendamentos b ON a.id < b.id AND a.id_funcionario = b.id_funcionario
      AND a."dataHoraIni" < b."dataHoraFim" AND b."dataHoraIni" < a."dataHoraFim"${estados}
    ORDER BY a.id, b.id`);
  return { invalidos, sobrepostos };
}
