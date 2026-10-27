import { afterAll, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { auditarAgenda } from '../src/repositories/auditoriaAgenda';
const url = new URL(process.env.DATABASE_URL!);
if (!url.pathname.includes('petshop_test')) throw new Error('Use banco isolado.');
url.searchParams.set('schema', 'phase3_audit_test');
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
afterAll(async () => { await db.$executeRawUnsafe('DROP SCHEMA IF EXISTS phase3_audit_test CASCADE'); await db.$disconnect(); });
it('audita antes da migração e depois considera apenas os estados que ocupam intervalo', async () => {
  await db.$executeRawUnsafe('CREATE SCHEMA phase3_audit_test');
  await db.$executeRawUnsafe('CREATE TABLE agendamentos (id INT, id_funcionario INT, "dataHoraIni" TIMESTAMP, "dataHoraFim" TIMESTAMP)');
  await db.$executeRawUnsafe(`INSERT INTO agendamentos VALUES (1, 1, '2026-11-03 12:00', '2026-11-03 13:00'), (2, 1, '2026-11-03 12:30', '2026-11-03 13:30'), (3, 2, '2026-11-03 12:00', '2026-11-03 11:00')`);
  expect(await auditarAgenda(db)).toEqual({ invalidos: [{ id: 3 }], sobrepostos: [{ primeiroId: 1, segundoId: 2, funcionarioId: 1 }] });
  await db.$executeRawUnsafe(`ALTER TABLE agendamentos ADD COLUMN status TEXT DEFAULT 'AGENDADO'`);
  await db.$executeRawUnsafe(`UPDATE agendamentos SET status='CANCELADO' WHERE id=2`);
  expect((await auditarAgenda(db)).sobrepostos).toEqual([]);
  await db.$executeRawUnsafe(`UPDATE agendamentos SET status='CONCLUIDO' WHERE id=2`);
  expect((await auditarAgenda(db)).sobrepostos).toHaveLength(1);
});
