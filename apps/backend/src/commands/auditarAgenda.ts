import '../config/env';
import prisma from '../lib/prisma';
import { auditarAgenda } from '../repositories/auditoriaAgenda';
async function main() {
  const resultado = await prisma.$transaction(tx => auditarAgenda(tx), { isolationLevel: 'RepeatableRead' });
  console.log(JSON.stringify(resultado, null, 2));
  if (resultado.invalidos.length || resultado.sobrepostos.length) process.exitCode = 1;
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
