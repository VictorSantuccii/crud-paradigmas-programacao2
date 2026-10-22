import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
const url = new URL(process.env.DATABASE_URL!);
if (!url.pathname.includes('petshop_test')) throw new Error('Use banco isolado.');
url.searchParams.set('schema', 'phase1_migration_test');
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const base = readFileSync('prisma/migrations/20260927231723_dominio_petshop/migration.sql', 'utf8');
const migration = readFileSync('prisma/migrations/20261022000000_identidade_autorizacao/migration.sql', 'utf8');
const execute = async (sql: string) => {
  const clean = sql.split('\n').filter(line => !line.trimStart().startsWith('--')).join('\n');
  const chunks = clean.includes('DO $$') ? [clean.slice(clean.indexOf('DO $$'), clean.indexOf('$$;', clean.indexOf('DO $$') + 4) + 3), ...clean.slice(clean.indexOf('$$;', clean.indexOf('DO $$') + 4) + 3).split(';')] : clean.split(';');
  for (const chunk of chunks) if (chunk.trim()) await db.$executeRawUnsafe(chunk);
};
afterAll(async () => { await db.$executeRawUnsafe('DROP SCHEMA IF EXISTS phase1_migration_test CASCADE'); await db.$disconnect(); });
describe('migração de identidade', () => {
  it('aborta colisões sem alterar contas; preserva ids e vínculos após correção', async () => {
    await db.$executeRawUnsafe('CREATE SCHEMA phase1_migration_test');
    await execute(base);
    await db.$executeRawUnsafe('INSERT INTO fidelidades (id, "beneficioAtivo", "qntdServicos") VALUES (1, false, 0), (2, false, 0)');
    await db.$executeRawUnsafe(`INSERT INTO usuarios (id, nome, email, cpf, senha_hash, role, id_fidelidade) VALUES (1, 'Ana', ' ANA@example.com ', '529.982.247-25', 'hash', 'CLIENTE', 1), (2, 'B', 'ana@example.com', '11144477735', 'hash', 'CLIENTE', 2)`);
    await db.$executeRawUnsafe(`INSERT INTO enderecos (id, cep, bairro, numero, rua, id_usuario) VALUES (1, '12345678', 'Centro', 1, 'Rua', 1)`);
    await expect(execute(migration)).rejects.toThrow(/Colisão/);
    expect(await db.$queryRawUnsafe('SELECT id FROM usuarios ORDER BY id')).toEqual([{ id: 1 }, { id: 2 }]);
    await db.$executeRawUnsafe(`UPDATE usuarios SET email = 'b@example.com', cpf = '52998224725' WHERE id = 2`);
    await expect(execute(migration)).rejects.toThrow(/Colisão/);
    await db.$executeRawUnsafe(`UPDATE usuarios SET cpf = '11144477735' WHERE id = 2`);
    await execute(migration);
    expect(await db.usuario.findUnique({ where: { id: 1 }, select: { cpf: true, email: true, telefone: true, fidelidadeId: true, enderecos: { select: { id: true } } } })).toEqual({ cpf: '52998224725', email: 'ana@example.com', telefone: null, fidelidadeId: 1, enderecos: [{ id: 1 }] });
  });
});
