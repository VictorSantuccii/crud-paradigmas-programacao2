import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { hashSenha } from '../../src/lib/password';
import { configuracaoPadrao } from '../../src/lib/agenda';
// Executar manualmente somente no banco isolado de teste. Sem seed demonstrativo operacional.
async function main() {
  if (!process.env.DATABASE_URL?.includes('petshop_test') || !process.env.REDIS_URL?.endsWith('/15')) throw new Error('Use banco isolado.');
  const db = new PrismaClient(); const redis = createClient({ url: process.env.REDIS_URL });
  try {
    await redis.connect();
    const senhaHash = await hashSenha('fase3-teste-local');
    const admin = await db.usuario.upsert({ where: { email: 'fase3-admin@example.com' }, update: {}, create: { role: 'ADMIN', nome: 'Admin Teste', email: 'fase3-admin@example.com', cpf: '90000000175', senhaHash, fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } } } });
    const tutor = await db.usuario.upsert({ where: { email: 'fase3-ui@example.com' }, update: {}, create: { role: 'CLIENTE', nome: 'Tutor da Agenda', email: 'fase3-ui@example.com', cpf: '90000000256', telefone: '11999991234', senhaHash, fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } }, enderecos: { create: { rua: 'Rua Teste', bairro: 'Centro', cep: '12345678', numero: 1 } } } });
    const profissional = await db.funcionario.findFirst({ where: { nome: 'Profissional de Teste' } }) ?? await db.funcionario.create({ data: { nome: 'Profissional de Teste', cargo: 'Veterinário', ativo: true } });
    for (const [nome, categoria, duracaoMin, preco] of [['Banho de Teste', 'BANHO_TOSA', 45, 70], ['Clínica de Teste', 'CONSULTA', 45, 150]] as const) if (!await db.servico.findFirst({ where: { nome } })) await db.servico.create({ data: { nome, categoria, duracaoMin, preco, ativo: true, descricao: 'Atendimento da fixture isolada.', profissionais: { connect: { id: profissional.id } } } });
    await db.configuracaoAgenda.upsert({ where: { id: 1 }, create: { id: 1, ...configuracaoPadrao }, update: configuracaoPadrao });
    await db.bloqueioAgenda.deleteMany();
    await redis.set('sessao:fase3-ui', JSON.stringify({ id: tutor.id }), { EX: 14400 });
    await redis.set('sessao:fase3-admin', JSON.stringify({ id: admin.id }), { EX: 14400 });
    const pet = await db.animal.findFirst({ where: { usuarioId: tutor.id } });
    const banho = await db.servico.findFirst({ where: { nome: 'Banho de Teste' } });
    if (pet && banho && !await db.agendamento.findFirst({ where: { usuarioId: tutor.id, dataHoraIni: new Date('2026-10-01T12:00Z') } })) await db.agendamento.create({ data: { usuarioId: tutor.id, animalId: pet.id, servicoId: banho.id, funcionarioId: profissional.id, dataHoraIni: new Date('2026-10-01T12:00Z'), dataHoraFim: new Date('2026-10-01T12:45Z'), duracaoContratadaMin: 45, precoContratado: 70 } });
    console.log('Fixture isolada pronta: fase3-ui@example.com; cookies fase3-ui e fase3-admin.');
  } finally { await db.$disconnect(); if (redis.isOpen) await redis.quit(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
