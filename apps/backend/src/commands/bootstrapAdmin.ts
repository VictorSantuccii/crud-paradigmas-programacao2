import '../config/env';
import prisma from '../lib/prisma';
import { hashSenha } from '../lib/password';
import * as v from '../lib/identity';
import { texto } from '../lib/parsers';

// Credenciais vêm do ambiente para não expor senha no histórico/argumentos do processo.
async function main() {
  const nome = texto(process.env.ADMIN_NOME, 'ADMIN_NOME');
  const email = v.email(process.env.ADMIN_EMAIL);
  const cpf = v.cpf(process.env.ADMIN_CPF);
  const senhaHash = await hashSenha(v.senha(process.env.ADMIN_SENHA));
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`LOCK TABLE usuarios IN SHARE ROW EXCLUSIVE MODE`;
    if (await tx.usuario.count({ where: { role: 'ADMIN' } }) && !process.argv.includes('--adicional')) throw new Error('Já existe ADMIN. Use --adicional explicitamente para criar outro.');
    await tx.usuario.create({ data: { nome, email, cpf, senhaHash, role: 'ADMIN', fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } } } });
  });
  console.log('Administrador provisionado.');
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Falha no provisionamento.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
