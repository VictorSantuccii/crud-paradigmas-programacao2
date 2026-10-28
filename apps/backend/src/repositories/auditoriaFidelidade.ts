import prisma from '../lib/prisma';
import type { AgendaDb } from './agendaRepository';
// Funciona antes e depois da migração: nunca seleciona colunas novas.
export async function auditarFidelidade(db: AgendaDb = prisma) {
  const registros = await db.$queryRaw<{ id: number; qntdServicos: number; beneficioAtivo: boolean; usuarioId: number | null }[]>`
    SELECT f.id, f."qntdServicos", f."beneficioAtivo", u.id AS "usuarioId"
    FROM fidelidades f LEFT JOIN usuarios u ON u.id_fidelidade = f.id ORDER BY f.id`;
  return { total: registros.length, invalidos: registros.filter(r => r.qntdServicos < 0 || r.qntdServicos > 7), importacao: registros };
}
