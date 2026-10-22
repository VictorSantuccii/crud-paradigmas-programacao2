import '../config/env';
import prisma from '../lib/prisma';
import { camposPendentes, cpf, valido } from '../lib/identity';
async function main() {
  const users = await prisma.usuario.findMany({ select: { id: true, nome: true, cpf: true, email: true } });
  const collision = (key: 'cpf' | 'email') => {
    const groups = new Map<string, number[]>();
    for (const user of users) {
      if (user[key] === null) continue;
      const value = key === 'cpf' ? user.cpf.replace(/\D/g, '') : user.email!.trim().toLowerCase();
      groups.set(value, [...groups.get(value) || [], user.id]);
    }
    return [...groups.values()].filter(ids => ids.length > 1);
  };
  // Funciona antes da migration: os novos campos ainda não existem.
  const enderecos = await prisma.endereco.findMany();
  const incompletos = users.map(user => ({ id: user.id, camposPendentes: camposPendentes({ ...user, telefone: null, enderecos: enderecos.filter(e => e.usuarioId === user.id) }) })).filter(user => user.camposPendentes.length);
  const report = { cpfsInvalidos: users.filter(user => !valido(cpf, user.cpf)).map(user => user.id), incompletos, colisoesCpf: collision('cpf'), colisoesEmail: collision('email') };
  console.log(JSON.stringify(report, null, 2));
  if (report.colisoesCpf.length || report.colisoesEmail.length) process.exitCode = 1;
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
