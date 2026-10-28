import { beforeAll, beforeEach, afterAll, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import redis, { conectarRedis } from '../src/lib/redis';
import { configuracaoPadrao } from '../src/lib/agenda';
let admin: string, cliente: string, outro: string, equipe: string;
let animalId: number, segundoPet: number, servicoId: number, funcionarioId: number, fidelidadeId: number;
const reserva = (hora = '09:00', pet = animalId) => ({ animalId: pet, servicoId, funcionarioId, dataHoraIni: `2026-11-03T${hora}:00-03:00` });
const criar = (body: object = reserva()) => request(app).post('/agendamentos').set('Cookie', cliente).send(body);
const previa = (body: object = reserva()) => request(app).post('/agendamentos/previa').set('Cookie', cliente).send(body);
const transicao = (id: number, status = 'CONCLUIDO', sessao = equipe) => request(app).patch(`/agendamentos/${id}/status`).set('Cookie', sessao).send({ status });
const saldo = () => request(app).get('/fidelidades/me').set('Cookie', cliente);
const ajuste = (progresso: number, variacaoBeneficios = 0, motivo = 'Acerto documentado') => request(app).post(`/fidelidades/${fidelidadeId}/ajustes`).set('Cookie', admin).send({ progresso, variacaoBeneficios, motivo });
beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes('petshop_test') || !process.env.REDIS_URL?.endsWith('/15')) throw Error('Use bancos isolados.');
  await conectarRedis();
});
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-02T09:00Z'));
  await prisma.$executeRawUnsafe('TRUNCATE usuarios, fidelidades, enderecos, animais, funcionarios, servicos, agendamentos, assinaturas, planos RESTART IDENTITY CASCADE');
  await prisma.configuracaoAgenda.upsert({ where: { id: 1 }, create: { id: 1, ...configuracaoPadrao }, update: configuracaoPadrao });
  await prisma.bloqueioAgenda.deleteMany(); await redis.flushDb();
  funcionarioId = (await prisma.funcionario.create({ data: { nome: 'Ana', cargo: 'Tosadora', ativo: true } })).id;
  async function usuario(role: 'ADMIN' | 'CLIENTE' | 'FUNCIONARIO', cpf: string) {
    const u = await prisma.usuario.create({ data: { nome: role, email: `${cpf}@test.local`, cpf, senhaHash: 'hash', role, telefone: '11999991234', ...(role === 'FUNCIONARIO' ? { funcionario: { connect: { id: funcionarioId } } } : {}), fidelidade: { create: { qntdServicos: 0, beneficioAtivo: false } }, enderecos: { create: { cep: '12345678', rua: 'Rua', numero: 1, bairro: 'Centro' } } } });
    await redis.set(`sessao:${cpf}`, JSON.stringify({ id: u.id }), { EX: 3600 });
    return { ...u, cookie: `petshop_session=${cpf}` };
  }
  admin = (await usuario('ADMIN', '39053344705')).cookie;
  const u = await usuario('CLIENTE', '52998224725'); cliente = u.cookie; fidelidadeId = u.fidelidadeId;
  outro = (await usuario('CLIENTE', '11144477735')).cookie;
  equipe = (await usuario('FUNCIONARIO', '15350946056')).cookie;
  animalId = (await prisma.animal.create({ data: { nome: 'Lua', especie: 'Cão', idade: 2, porte: 'PEQUENO', usuarioId: u.id } })).id;
  segundoPet = (await prisma.animal.create({ data: { nome: 'Sol', especie: 'Cão', idade: 1, porte: 'MEDIO', usuarioId: u.id } })).id;
  // Configure explicitamente pela API administrativa; nome nunca determina elegibilidade.
  const s = await request(app).post('/servicos').set('Cookie', admin).send({ nome: 'Pacote explícito', categoria: 'BANHO_TOSA', ativo: true, elegivelFidelidade: true, preco: 89.9, duracaoMin: 30 });
  expect(s.status).toBe(201); servicoId = s.body.id;
  await prisma.funcionario.update({ where: { id: funcionarioId }, data: { servicos: { connect: { id: servicoId } } } });
});
afterAll(async () => { vi.useRealTimers(); await prisma.$disconnect(); if (redis.isOpen) await redis.quit(); });
async function concluidos(n: number) {
  const ids: number[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(2026, 10, 3 + Math.floor(i / 4), [12, 13, 14, 16][i % 4]));
    const r = await criar({ ...reserva(), animalId: i % 2 ? segundoPet : animalId, dataHoraIni: d.toISOString() });
    expect(r.status).toBe(201); ids.push(r.body.id);
  }
  vi.setSystemTime(new Date('2026-11-10T22:00Z'));
  for (const id of ids) expect((await transicao(id)).status).toBe(200);
  return ids;
}
it('sete não emitem, oito emitem um, dezesseis emitem dois; progresso pertence ao tutor', async () => {
  const ids = await concluidos(16);
  expect((await saldo()).body).toMatchObject({ meta: 8, progresso: 0, beneficios: { disponiveis: 2, reservados: 0, consumidos: 0 } });
  expect(await prisma.movimentoFidelidade.count({ where: { tipo: 'CONTAGEM' } })).toBe(16);
  expect(await prisma.beneficioFidelidade.count()).toBe(2);
  expect((await transicao(ids[0])).status).toBe(200);
  expect(await prisma.movimentoFidelidade.count({ where: { tipo: 'CONTAGEM' } })).toBe(16);
});
it('sétimo mantém progresso sete e oitavo simultâneo repetido emite exatamente um', async () => {
  await concluidos(7);
  expect((await saldo()).body).toMatchObject({ progresso: 7, beneficios: { disponiveis: 0 } });
  vi.setSystemTime(new Date('2026-11-02T09:00Z'));
  const oitavo = await criar(reserva('16:00')); expect(oitavo.status).toBe(201);
  vi.setSystemTime(new Date('2026-11-10T22:00Z'));
  expect((await Promise.all([transicao(oitavo.body.id), transicao(oitavo.body.id)])).map(r => r.status)).toEqual([200, 200]);
  expect((await saldo()).body).toMatchObject({ progresso: 0, beneficios: { disponiveis: 1 } });
});
it('duas conclusões concorrentes cruzam a meta sem perder progresso', async () => {
  await ajuste(7);
  const a = await criar(), b = await criar(reserva('10:00'));
  vi.setSystemTime(new Date('2026-11-03T22:00Z'));
  expect((await Promise.all([transicao(a.body.id), transicao(b.body.id)])).map(r => r.status)).toEqual([200, 200]);
  expect((await saldo()).body).toMatchObject({ progresso: 1, beneficios: { disponiveis: 1 } });
});
it('prévia não escreve, contrato usa Decimal, reserva mais antigo e cotação obsoleta conflita sem efeitos', async () => {
  await ajuste(3, 2);
  const p = await previa(); expect(p.status).toBe(200);
  expect(p.body).toMatchObject({ precoBase: 89.9, desconto: 89.9, precoContratado: 0 });
  expect(await prisma.agendamento.count()).toBe(0);
  expect((await saldo()).body.beneficios).toMatchObject({ disponiveis: 2, reservados: 0 });
  const r = await criar({ ...reserva(), cotacaoEsperada: p.body }); expect(r.status).toBe(201);
  expect(r.body).toMatchObject({ beneficioId: p.body.beneficioId, situacaoBeneficio: 'RESERVADO', precoBase: 89.9, desconto: 89.9, precoContratado: 0 });
  const conflito = await criar({ ...reserva('10:00'), cotacaoEsperada: p.body });
  expect(conflito.status).toBe(409); expect(conflito.body.code).toBe('COTACAO_ALTERADA');
  expect(await prisma.agendamento.count()).toBe(1);
  const novo = await criar(reserva('10:00')); expect(novo.status).toBe(201);
  expect(novo.body.beneficioId).toBeGreaterThan(r.body.beneficioId);
});
it('reserva segue ordem de criação; reagendamento preserva; cancelamento devolve e reutilização não muda contrato histórico', async () => {
  await ajuste(7, 1);
  const a = await criar(reserva('10:00')), b = await criar();
  expect(a.body.precoContratado).toBe(0); expect(b.body.precoContratado).toBe(89.9);
  await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ preco: 125.55, elegivelFidelidade: false });
  const moved = await request(app).put(`/agendamentos/${a.body.id}`).set('Cookie', cliente).send({ dataHoraIni: '2026-11-04T10:00:00-03:00' });
  expect(moved.status).toBe(200); expect(moved.body).toMatchObject({ precoBase: 89.9, desconto: 89.9, precoContratado: 0, beneficioId: a.body.beneficioId });
  expect((await transicao(a.body.id, 'CANCELADO', cliente)).body.situacaoBeneficio).toBe('DEVOLVIDO');
  await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ elegivelFidelidade: true });
  const c = await criar(reserva('11:00'));
  expect(c.body).toMatchObject({ beneficioId: a.body.beneficioId, precoBase: 125.55, desconto: 125.55, precoContratado: 0 });
  expect((await request(app).get(`/agendamentos/${a.body.id}`).set('Cookie', cliente)).body).toMatchObject({ situacaoBeneficio: 'DEVOLVIDO', desconto: 89.9 });
  vi.setSystemTime(new Date('2026-11-05T22:00Z'));
  expect((await transicao(c.body.id)).body.situacaoBeneficio).toBe('CONSUMIDO');
  expect((await saldo()).body).toMatchObject({ progresso: 7, beneficios: { disponiveis: 0, reservados: 0, consumidos: 1 } });
});
it('falta devolve; consulta, não elegível e cancelamento não contam; não há retroatividade', async () => {
  const antigo = await criar();
  await ajuste(0, 1);
  expect((await request(app).get(`/agendamentos/${antigo.body.id}`).set('Cookie', cliente)).body.precoContratado).toBe(89.9);
  const gratuito = await criar(reserva('10:00'));
  await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ elegivelFidelidade: false });
  const comum = await criar(reserva('11:00'));
  vi.setSystemTime(new Date('2026-11-03T22:00Z'));
  await transicao(gratuito.body.id, 'NAO_COMPARECEU'); await transicao(comum.body.id); await transicao(antigo.body.id, 'CANCELADO', admin);
  expect((await saldo()).body).toMatchObject({ progresso: 0, beneficios: { disponiveis: 1, reservados: 0 } });
  expect(await prisma.movimentoFidelidade.count({ where: { tipo: 'CONTAGEM' } })).toBe(0);
});
it('duas reservas disputam um único benefício sem reutilizá-lo', async () => {
  await ajuste(0, 1);
  const rs = await Promise.all([criar(), criar(reserva('10:00'))]);
  expect(rs.map(r => r.status)).toEqual([201, 201]);
  expect(rs.map(r => r.body.precoContratado).sort()).toEqual([0, 89.9]);
  expect((await saldo()).body.beneficios).toMatchObject({ disponiveis: 0, reservados: 1 });
});
it('reverte contrato, reserva, status, saldo e movimentos se a auditoria falhar', async () => {
  await ajuste(7, 1);
  await prisma.$executeRawUnsafe(`ALTER TABLE eventos_agendamento ADD CONSTRAINT falha_fase4 CHECK (acao NOT IN ('CRIACAO','CONCLUIDO','CANCELADO'))`);
  try {
    expect((await criar()).status).toBe(500);
    expect(await prisma.agendamento.count()).toBe(0);
    expect((await saldo()).body).toMatchObject({ progresso: 7, beneficios: { disponiveis: 1, reservados: 0 } });
    expect(await prisma.movimentoFidelidade.count({ where: { tipo: 'RESERVA' } })).toBe(0);
  } finally { await prisma.$executeRawUnsafe('ALTER TABLE eventos_agendamento DROP CONSTRAINT falha_fase4'); }
  const r = await criar();
  vi.setSystemTime(new Date('2026-11-03T22:00Z'));
  await prisma.$executeRawUnsafe(`ALTER TABLE eventos_agendamento ADD CONSTRAINT falha_fase4 CHECK (acao <> 'CONCLUIDO')`);
  try {
    expect((await transicao(r.body.id)).status).toBe(500);
    expect((await saldo()).body.beneficios).toMatchObject({ reservados: 1, consumidos: 0 });
    expect((await prisma.agendamento.findUniqueOrThrow({ where: { id: r.body.id } })).status).toBe('AGENDADO');
  } finally { await prisma.$executeRawUnsafe('ALTER TABLE eventos_agendamento DROP CONSTRAINT falha_fase4'); }
});
it('exige ADMIN, motivo, inteiros e saldo; revoga só disponíveis recentes; preserva histórico e fecha mutações antigas', async () => {
  expect((await ajuste(8)).status).toBe(400); expect((await ajuste(0, 0, ' ')).status).toBe(400);
  expect((await ajuste(0, -1)).status).toBe(409);
  expect((await ajuste(0, 0.5)).status).toBe(400);
  expect((await ajuste(0, 1, 'x'.repeat(301))).status).toBe(400);
  await ajuste(2, 3); const r = await criar();
  expect((await ajuste(4, -2)).status).toBe(200);
  expect((await ajuste(0, -1)).status).toBe(409);
  expect((await saldo()).body).toMatchObject({ progresso: 4, beneficios: { disponiveis: 0, reservados: 1, revogados: 2 } });
  const movimentos = await prisma.movimentoFidelidade.findMany({ where: { tipo: 'AJUSTE' } });
  expect(movimentos).toHaveLength(2); expect(movimentos[1]).toMatchObject({ motivo: 'Acerto documentado', antes: { progresso: 2 }, depois: { progresso: 4 } });
  expect((await request(app).get(`/fidelidades/${fidelidadeId}`).set('Cookie', outro)).status).toBe(403);
  for (const sessao of [cliente, equipe]) expect((await request(app).post(`/fidelidades/${fidelidadeId}/ajustes`).set('Cookie', sessao).send({ progresso: 0, variacaoBeneficios: 1, motivo: 'Fraude' })).status).toBe(403);
  for (const [method, path] of [['post', '/fidelidades'], ['put', `/fidelidades/${fidelidadeId}`], ['delete', `/fidelidades/${fidelidadeId}`]] as const) expect((await request(app)[method](path).set('Cookie', admin).send({ beneficioAtivo: true, qntdServicos: 0 })).status).toBe(404);
  expect((await request(app).get(`/agendamentos/${r.body.id}`).set('Cookie', cliente)).status).toBe(200);
});
it('permite elegibilidade apenas BANHO_TOSA por ADMIN; prévia respeita titularidade e agenda', async () => {
  expect((await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ categoria: 'CONSULTA' })).status).toBe(400);
  expect((await request(app).put(`/servicos/${servicoId}`).set('Cookie', cliente).send({ elegivelFidelidade: true })).status).toBe(403);
  expect((await request(app).post('/agendamentos/previa').set('Cookie', outro).send(reserva())).status).toBe(403);
  expect((await previa({ ...reserva(), dataHoraIni: '2026-11-03T03:00:00Z' })).status).toBe(409);
  expect((await request(app).get('/fidelidades/me')).status).toBe(401);
  const mudanca = await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ categoria: 'CONSULTA', elegivelFidelidade: false }); expect(mudanca.status).toBe(200);
  await ajuste(0, 1); expect((await previa()).body).toMatchObject({ desconto: 0, precoContratado: 89.9, beneficioId: null });
});
it('cotação paga perde validade por preço ou elegibilidade; manipulações são rejeitadas', async () => {
  const p = await previa(); expect(p.status).toBe(200);
  await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ preco: 100.01 });
  const r = await criar({ ...reserva(), cotacaoEsperada: p.body });
  expect(r.status).toBe(409); expect(r.body.code).toBe('COTACAO_ALTERADA');
  expect(await prisma.agendamento.count()).toBe(0);
  const q = await previa();
  await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ elegivelFidelidade: false });
  expect((await criar({ ...reserva(), cotacaoEsperada: q.body })).body.code).toBe('COTACAO_ALTERADA');
  for (const campo of ['precoBase', 'desconto', 'beneficioId', 'elegivelFidelidade']) expect((await criar({ ...reserva(), [campo]: 1 })).status).toBe(400);
  expect((await criar({ ...reserva(), cotacaoEsperada: {} })).status).toBe(400);
});
it('falha na gravação de movimento reverte contagem, emissão e conclusão', async () => {
  await ajuste(7);
  const r = await criar(); expect(r.status).toBe(201);
  vi.setSystemTime(new Date('2026-11-03T22:00Z'));
  await prisma.$executeRawUnsafe(`ALTER TABLE movimentos_fidelidade ADD CONSTRAINT falha_movimento CHECK (tipo <> 'EMISSAO')`);
  try {
    expect((await transicao(r.body.id)).status).toBe(500);
    expect((await saldo()).body).toMatchObject({ progresso: 7, beneficios: { disponiveis: 0 } });
    expect(await prisma.beneficioFidelidade.count()).toBe(0);
    expect(await prisma.movimentoFidelidade.count({ where: { tipo: 'CONTAGEM' } })).toBe(0);
    expect((await prisma.agendamento.findUniqueOrThrow({ where: { id: r.body.id } })).status).toBe('AGENDADO');
    expect(await prisma.eventoAgendamento.count()).toBe(1);
  } finally { await prisma.$executeRawUnsafe('ALTER TABLE movimentos_fidelidade DROP CONSTRAINT falha_movimento'); }
});
it('falha de auditoria no cancelamento reverte liberação e projeções', async () => {
  await ajuste(0, 1); const r = await criar();
  await prisma.$executeRawUnsafe(`ALTER TABLE eventos_agendamento ADD CONSTRAINT falha_liberacao CHECK (acao <> 'CANCELADO')`);
  try {
    expect((await transicao(r.body.id, 'CANCELADO', cliente)).status).toBe(500);
    expect((await saldo()).body.beneficios).toMatchObject({ disponiveis: 0, reservados: 1 });
    expect(await prisma.movimentoFidelidade.count({ where: { tipo: 'LIBERACAO' } })).toBe(0);
    expect((await prisma.agendamento.findUniqueOrThrow({ where: { id: r.body.id } })).status).toBe('AGENDADO');
  } finally { await prisma.$executeRawUnsafe('ALTER TABLE eventos_agendamento DROP CONSTRAINT falha_liberacao'); }
});
it('ajuste revoga os mais recentes e protege histórico mesmo em usuário sem atendimentos', async () => {
  await ajuste(1, 3);
  const beneficios = await prisma.beneficioFidelidade.findMany({ where: { fidelidadeId }, orderBy: { id: 'asc' } });
  await ajuste(1, -1);
  expect((await prisma.beneficioFidelidade.findUniqueOrThrow({ where: { id: beneficios[2].id } })).estado).toBe('REVOGADO');
  expect((await previa()).body.beneficioId).toBe(beneficios[0].id);
  const u = await prisma.usuario.findUniqueOrThrow({ where: { fidelidadeId } });
  expect((await request(app).delete(`/usuarios/${u.id}`).set('Cookie', admin)).status).toBe(409);
  expect(await prisma.usuario.findUnique({ where: { id: u.id } })).not.toBeNull();
  const m = await prisma.movimentoFidelidade.findFirstOrThrow({ where: { fidelidadeId } });
  await expect(prisma.movimentoFidelidade.create({ data: { fidelidadeId, tipo: 'AJUSTE', antes: m.antes!, depois: m.depois! } })).rejects.toThrow();
});
it('rejeita reservas cruzadas e vínculos de estado inconsistentes no banco', async () => {
  await ajuste(0, 1); const r = await criar();
  await expect(prisma.beneficioFidelidade.update({ where: { id: r.body.beneficioId }, data: { estado: 'DISPONIVEL' } })).rejects.toThrow();
  await expect(prisma.beneficioFidelidade.update({ where: { id: r.body.beneficioId }, data: { agendamentoId: null } })).rejects.toThrow();
  const outroUsuario = await prisma.usuario.findFirstOrThrow({ where: { role: 'CLIENTE', fidelidadeId: { not: fidelidadeId } } });
  await expect(prisma.beneficioFidelidade.update({ where: { id: r.body.beneficioId }, data: { fidelidadeId: outroUsuario.fidelidadeId } })).rejects.toThrow();
});
it('preço e elegibilidade contratados prevalecem após alteração do catálogo; valor zero não conta', async () => {
  const pago = await criar(); expect(pago.status).toBe(201);
  await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ elegivelFidelidade: false, preco: 10 });
  const inelegivel = await criar(reserva('10:00')); expect(inelegivel.status).toBe(201);
  await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ elegivelFidelidade: true, preco: 0 });
  const zero = await criar(reserva('11:00')); expect(zero.status).toBe(201);
  vi.setSystemTime(new Date('2026-11-03T22:00Z'));
  for (const r of [pago, inelegivel, zero]) expect((await transicao(r.body.id)).status).toBe(200);
  expect((await saldo()).body.progresso).toBe(1);
  expect((await request(app).get(`/agendamentos/${pago.body.id}`).set('Cookie', cliente)).body).toMatchObject({ precoBase: 89.9, precoContratado: 89.9, elegivelFidelidade: true });
});
