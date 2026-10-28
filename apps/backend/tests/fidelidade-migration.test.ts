import { afterAll, expect, it } from 'vitest';
import { Prisma, PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'node:fs';
import { auditarFidelidade } from '../src/repositories/auditoriaFidelidade';
const url = new URL(process.env.DATABASE_URL!);
if (!url.pathname.includes('petshop_test')) throw Error('Use banco isolado.');
const schema = 'phase4_migration_test'; url.searchParams.set('schema', schema);
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const migrations = readdirSync('prisma/migrations').filter(n => /^\d/.test(n)).sort();
const sql = (n: string) => readFileSync(`prisma/migrations/${n}/migration.sql`, 'utf8');
async function execute(tx: Prisma.TransactionClient, source: string) {
  const clean = source.split('\n').filter(l => !l.trimStart().startsWith('--')).join('\n');
  let dollar = false, start = 0;
  for (let i = 0; i < clean.length; i++) {
    if (clean.slice(i, i + 2) === '$$') { dollar = !dollar; i++; }
    else if (clean[i] === ';' && !dollar) { const chunk = clean.slice(start, i + 1); if (chunk.trim()) await tx.$executeRawUnsafe(chunk); start = i + 1; }
  }
}
async function base() {
  await db.$executeRawUnsafe(`CREATE SCHEMA ${schema}`);
  for (const n of migrations.slice(0, -1)) await execute(db, sql(n));
}
const migrar = () => db.$transaction(tx => execute(tx, sql(migrations.at(-1)!)));
async function limpar() { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); }
afterAll(async () => { await limpar(); await db.$disconnect(); });
it('migra base vazia e impede saldos negativos e elegibilidade inválida diretamente no PostgreSQL', async () => {
  await base(); await migrar();
  expect(await db.fidelidade.count()).toBe(0); expect(await db.movimentoFidelidade.count()).toBe(0);
  await expect(db.fidelidade.create({ data: { progresso: -1, qntdServicos: -1, beneficioAtivo: false } })).rejects.toThrow();
  await expect(db.servico.create({ data: { nome: 'Consulta', preco: 10, duracaoMin: 30, categoria: 'CONSULTA', elegivelFidelidade: true } })).rejects.toThrow();
  await limpar();
});
it('audita antes, aborta contador inválido e importa estado original sem recontar ou alterar relações e contratos', async () => {
  await base();
  await db.$executeRawUnsafe(`INSERT INTO fidelidades (id, "beneficioAtivo", "qntdServicos") VALUES (1, true, 7), (2, false, 8)`);
  await db.$executeRawUnsafe(`INSERT INTO usuarios (id, nome, cpf, senha_hash, role, id_fidelidade) VALUES (1, 'Tutor', '52998224725', 'hash', 'CLIENTE', 1)`);
  await db.$executeRawUnsafe(`INSERT INTO animais (id, idade, porte, especie, nome, id_usuario) VALUES (7, 3, 'MEDIO', 'Cão', 'Lua', 1)`);
  await db.$executeRawUnsafe(`INSERT INTO funcionarios (id, nome, cargo) VALUES (1, 'Tosador', 'Tosador')`);
  await db.$executeRawUnsafe(`INSERT INTO servicos (id, nome, preco, "duracaoMin", categoria, ativo) VALUES (1, 'Banho', 999, 30, 'BANHO_TOSA', true)`);
  await db.$executeRawUnsafe(`INSERT INTO agendamentos (id, "dataHoraIni", "dataHoraFim", id_usuario, id_animal, id_servico, id_funcionario, "duracaoContratadaMin", "precoContratado", status) VALUES (9, '2026-10-01T12:00:00', '2026-10-01T12:30:00', 1, 7, 1, 1, 30, 19.95, 'CONCLUIDO'), (10, '2026-10-02T12:00:00', '2026-10-02T12:30:00', 1, 7, 1, 1, 30, NULL, 'AGENDADO')`);
  expect((await auditarFidelidade(db)).invalidos).toMatchObject([{ id: 2, qntdServicos: 8 }]);
  await expect(migrar()).rejects.toThrow(/2=8.*Saneie/);
  expect(await db.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_schema='${schema}' AND table_name='fidelidades' AND column_name='progresso'`)).toEqual([]);
  await db.$executeRawUnsafe('UPDATE fidelidades SET "qntdServicos" = 3 WHERE id=2');
  await migrar();
  expect(await db.fidelidade.findUnique({ where: { id: 1 } })).toMatchObject({ progresso: 7, qntdServicos: 7, beneficioAtivo: true });
  expect(await db.beneficioFidelidade.findMany()).toMatchObject([{ fidelidadeId: 1, estado: 'DISPONIVEL', geradorId: null, agendamentoId: null }]);
  expect(await db.movimentoFidelidade.findMany({ orderBy: { id: 'asc' } })).toMatchObject([{ tipo: 'IMPORTACAO', autorId: null, antes: { qntdServicos: 7, beneficioAtivo: true }, depois: { progresso: 7, disponiveis: 1 } }, { tipo: 'IMPORTACAO', antes: { qntdServicos: 3, beneficioAtivo: false } }]);
  expect(await db.agendamento.findUnique({ where: { id: 9 } })).toMatchObject({ id: 9, animalId: 7, usuarioId: 1, servicoId: 1, funcionarioId: 1, precoBase: new Prisma.Decimal('19.95'), precoContratado: new Prisma.Decimal('19.95'), desconto: new Prisma.Decimal(0), elegivelFidelidade: false, beneficioId: null });
  expect(await db.agendamento.findUnique({ where: { id: 10 } })).toMatchObject({ precoBase: null, precoContratado: null, elegivelFidelidade: false });
  expect(await db.servico.findUnique({ where: { id: 1 } })).toMatchObject({ elegivelFidelidade: false });
  expect((await auditarFidelidade(db)).invalidos).toEqual([]);
  await expect(db.beneficioFidelidade.create({ data: { fidelidadeId: 1, geradorId: 9 } })).rejects.toThrow();
  const beneficio = await db.beneficioFidelidade.findFirstOrThrow();
  await expect(db.movimentoFidelidade.create({ data: { fidelidadeId: 2, tipo: 'RESERVA', beneficioId: beneficio.id, antes: {}, depois: {} } })).rejects.toThrow();
});
