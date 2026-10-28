import '../config/env';
import prisma from '../lib/prisma';
import { auditarFidelidade } from '../repositories/auditoriaFidelidade';
async function main() {
  const resultado = await prisma.$transaction(tx => auditarFidelidade(tx), { isolationLevel: 'RepeatableRead' });
  console.log(JSON.stringify(resultado, null, 2));
  if (resultado.invalidos.length) process.exitCode = 1;
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
