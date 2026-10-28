import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { configuracaoPadrao } from '../../src/lib/agenda';
// Fixture manual de QA. Nenhuma conclusão, contagem ou benefício é gravado aqui.
async function main() {
  if (!process.env.DATABASE_URL?.includes('petshop_test') || !process.env.REDIS_URL?.endsWith('/15')) throw new Error('Use banco isolado.');
  const db = new PrismaClient(), redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();
    const admin = await db.usuario.create({ data: { role: 'ADMIN', nome: 'Admin Fidelidade', email: 'fase4-admin@example.com', cpf: '90000000175', senhaHash: 'fixture-sem-login', fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } } } });
    const tutor = await db.usuario.create({ data: { role: 'CLIENTE', nome: 'Tutor da Fidelidade', email: 'fase4-ui@example.com', cpf: '90000000256', telefone: '11999991234', senhaHash: 'fixture-sem-login', fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } }, enderecos: { create: { rua: 'Rua Teste', bairro: 'Centro', cep: '12345678', numero: 1 } } } });
    const profissional = await db.funcionario.create({ data: { nome: 'Profissional de Fidelidade', cargo: 'Tosador', ativo: true } });
    const banho = await db.servico.create({ data: { nome: 'Banho Elegível', categoria: 'BANHO_TOSA', ativo: true, elegivelFidelidade: true, duracaoMin: 30, preco: 89.90, profissionais: { connect: { id: profissional.id } } } });
    await db.servico.create({ data: { nome: 'Consulta de Teste', categoria: 'CONSULTA', ativo: true, duracaoMin: 30, preco: 150, profissionais: { connect: { id: profissional.id } } } });
    const pets = await Promise.all(['Lua', 'Sol'].map(nome => db.animal.create({ data: { nome, especie: 'Cão', idade: 2, porte: 'PEQUENO', usuarioId: tutor.id } })));
    const atendimentos: number[] = [];
    for (let i = 0; i < 8; i++) {
      const dataHoraIni = new Date(Date.UTC(2026, 9, 1 + i, 12));
      const r = await db.agendamento.create({ data: { usuarioId: tutor.id, animalId: pets[i % 2].id, servicoId: banho.id, funcionarioId: profissional.id, dataHoraIni, dataHoraFim: new Date(dataHoraIni.getTime() + 1800000), duracaoContratadaMin: 30, precoBase: 89.9, desconto: 0, precoContratado: 89.9, elegivelFidelidade: true } });
      atendimentos.push(r.id);
    }
    await db.configuracaoAgenda.upsert({ where: { id: 1 }, create: { id: 1, ...configuracaoPadrao }, update: configuracaoPadrao });
    await db.bloqueioAgenda.deleteMany();
    await redis.set('sessao:fase4-ui', JSON.stringify({ id: tutor.id }), { EX: 14400 });
    await redis.set('sessao:fase4-admin', JSON.stringify({ id: admin.id }), { EX: 14400 });
    console.log(JSON.stringify({ usuarioId: tutor.id, fidelidadeId: tutor.fidelidadeId, pets: pets.map(p => p.id), servicoId: banho.id, funcionarioId: profissional.id, atendimentos }));
  } finally { await db.$disconnect(); if (redis.isOpen) await redis.quit(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
