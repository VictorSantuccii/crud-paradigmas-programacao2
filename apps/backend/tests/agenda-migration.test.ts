import { afterAll, expect, it } from 'vitest';
import { Prisma, PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
const url = new URL(process.env.DATABASE_URL!);
if (!url.pathname.includes('petshop_test')) throw new Error('Use banco isolado.');
url.searchParams.set('schema', 'phase3_migration_test');
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const migration = readFileSync('prisma/migrations/20261027000000_agenda_real/migration.sql', 'utf8');
async function execute(conn: Prisma.TransactionClient, sql: string) {
  const clean = sql.split('\n').filter(l => !l.trimStart().startsWith('--')).join('\n');
  const chunks = clean.match(/DO \$\$[\s\S]*?\$\$;|[^;]+;/g) || [];
  for (const chunk of chunks) if (chunk.trim()) await conn.$executeRawUnsafe(chunk);
}
afterAll(async () => { await db.$executeRawUnsafe('DROP SCHEMA IF EXISTS phase3_migration_test CASCADE'); await db.$disconnect(); });
it('audita legado, aborta intervalos inválidos/sobrepostos e preserva IDs, vínculos e preço desconhecido', async () => {
  await db.$executeRawUnsafe('CREATE SCHEMA phase3_migration_test');
  for (const name of ['20260927231723_dominio_petshop', '20261022000000_identidade_autorizacao', '20261022010000_animal_raca']) await execute(db, readFileSync(`prisma/migrations/${name}/migration.sql`, 'utf8'));
  await db.$executeRawUnsafe('INSERT INTO fidelidades (id, "beneficioAtivo", "qntdServicos") VALUES (1, false, 0)');
  await db.$executeRawUnsafe(`INSERT INTO usuarios (id, nome, cpf, senha_hash, role, id_fidelidade) VALUES (1, 'Tutor', '52998224725', 'hash', 'CLIENTE', 1)`);
  await db.$executeRawUnsafe(`INSERT INTO animais (id, idade, porte, especie, nome, id_usuario) VALUES (7, 3, 'MEDIO', 'Cão', 'Lua', 1)`);
  await db.$executeRawUnsafe(`INSERT INTO funcionarios (id, nome, cargo) VALUES (1, 'Vet', 'Vet')`);
  await db.$executeRawUnsafe(`INSERT INTO servicos (id, nome, preco, "duracaoMin") VALUES (1, 'Consulta', 150, 30)`);
  await db.$executeRawUnsafe(`INSERT INTO agendamentos (id, "dataHoraIni", "dataHoraFim", id_usuario, id_animal, id_servico, id_funcionario) VALUES (9, '2026-12-01T12:00:00', '2026-12-01T12:45:00', 1, 7, 1, 1), (10, '2026-12-01T12:30:00', '2026-12-01T12:50:00', 1, 7, 1, 1), (11, '2026-12-02T12:30:00', '2026-12-02T12:00:00', 1, 7, 1, 1)`);
  await expect(db.$transaction(tx => execute(tx, migration))).rejects.toThrow(/IDs inválidos: 11.*9\/10/);
  expect(await db.$queryRawUnsafe('SELECT id FROM agendamentos ORDER BY id')).toEqual([{ id: 9 }, { id: 10 }, { id: 11 }]);
  expect(await db.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_schema='phase3_migration_test' AND table_name='servicos' AND column_name='ativo'`)).toEqual([]);
  await db.$executeRawUnsafe(`UPDATE agendamentos SET "dataHoraIni" = '2026-12-01T12:45:00', "dataHoraFim" = '2026-12-01T13:00:00' WHERE id=10`);
  await db.$executeRawUnsafe(`UPDATE agendamentos SET "dataHoraFim" = '2026-12-02T13:00:00' WHERE id=11`);
  await db.$transaction(tx => execute(tx, migration));
  expect(await db.agendamento.findUnique({ where: { id: 9 }, select: { id: true, animalId: true, usuarioId: true, servicoId: true, funcionarioId: true, status: true, precoContratado: true, duracaoContratadaMin: true } })).toMatchObject({ id: 9, animalId: 7, usuarioId: 1, servicoId: 1, funcionarioId: 1, status: 'AGENDADO', precoContratado: null, duracaoContratadaMin: 45 });
  expect(await db.servico.findUnique({ where: { id: 1 }, select: { categoria: true, ativo: true } })).toMatchObject({ categoria: null, ativo: false });
  expect(await db.funcionario.findUnique({ where: { id: 1 } })).toMatchObject({ ativo: false });
  expect(await db.configuracaoAgenda.count()).toBe(1); expect(await db.eventoAgendamento.count()).toBe(0);
});
