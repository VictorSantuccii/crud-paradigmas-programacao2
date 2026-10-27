import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import redis, { conectarRedis } from '../src/lib/redis';
import { transacaoAgenda } from '../src/repositories/agendaRepository';
import { configuracaoPadrao } from '../src/lib/agenda';
let admin: string, cliente: string, outro: string, equipe: string;
let animalId: number, outroAnimal: number, servicoId: number, funcionarioId: number, outroFuncionario: number, usuarioId: number;
const inicio = '2026-11-03T09:00:00-03:00';
const reserva = () => ({ animalId, servicoId, funcionarioId, dataHoraIni: inicio, observacoes: 'Atenção à pele' });
const criar = (body = reserva(), sessao = cliente) => request(app).post('/agendamentos').set('Cookie', sessao).send(body);
const transicao = (id: number, status: string, sessao = cliente) => request(app).patch(`/agendamentos/${id}/status`).set('Cookie', sessao).send({ status, motivo: 'Teste' });
beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes('petshop_test') || !process.env.REDIS_URL?.endsWith('/15')) throw new Error('Use bancos isolados.');
  await conectarRedis();
});
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-02T09:00:00Z'));
  await prisma.$executeRawUnsafe('TRUNCATE usuarios, fidelidades, enderecos, animais, funcionarios, servicos, agendamentos, assinaturas, planos RESTART IDENTITY CASCADE');
  await prisma.configuracaoAgenda.upsert({ where: { id: 1 }, create: { id: 1, ...configuracaoPadrao }, update: configuracaoPadrao });
  await prisma.bloqueioAgenda.deleteMany();
  await redis.flushDb();
  const employee = await prisma.funcionario.create({ data: { nome: 'Ana', cargo: 'Vet', ativo: true } }); funcionarioId = employee.id;
  outroFuncionario = (await prisma.funcionario.create({ data: { nome: 'Bia', cargo: 'Vet', ativo: true } })).id;
  servicoId = (await prisma.servico.create({ data: { nome: 'Consulta', categoria: 'CONSULTA', ativo: true, preco: 100, duracaoMin: 45, profissionais: { connect: [{ id: funcionarioId }, { id: outroFuncionario }] } } })).id;
  async function usuario(role: 'ADMIN' | 'CLIENTE' | 'FUNCIONARIO', cpf: string, funcionario?: number) {
    const u = await prisma.usuario.create({ data: { role, nome: role, email: `${cpf}@test.local`, cpf, telefone: '11999991234', senhaHash: 'hash', ...(funcionario ? { funcionario: { connect: { id: funcionario } } } : {}), fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } }, enderecos: { create: { cep: '12345678', rua: 'Rua', bairro: 'Centro', numero: 1 } } } });
    await redis.set(`sessao:${cpf}`, JSON.stringify({ id: u.id }), { EX: 3600 });
    return { id: u.id, cookie: `petshop_session=${cpf}` };
  }
  admin = (await usuario('ADMIN', '39053344705')).cookie;
  const tutor = await usuario('CLIENTE', '52998224725'); usuarioId = tutor.id; cliente = tutor.cookie;
  const b = await usuario('CLIENTE', '11144477735'); outro = b.cookie;
  equipe = (await usuario('FUNCIONARIO', '15350946056', funcionarioId)).cookie;
  animalId = (await prisma.animal.create({ data: { nome: 'Lua', especie: 'Gato', idade: 2, porte: 'PEQUENO', usuarioId } })).id;
  outroAnimal = (await prisma.animal.create({ data: { nome: 'Sol', especie: 'Cão', idade: 1, porte: 'MEDIO', usuarioId: b.id } })).id;
});
afterAll(async () => { vi.useRealTimers(); await prisma.$disconnect(); if (redis.isOpen) await redis.quit(); });
describe('catálogo e operação', () => {
  it('publica apenas catálogo ativo classificado e projeção mínima dos habilitados', async () => {
    await prisma.servico.create({ data: { nome: 'Legado', preco: 20, duracaoMin: 30 } });
    const res = await request(app).get('/servicos?categoria=CONSULTA');
    expect(res.status).toBe(200); expect(res.body).toHaveLength(1);
    const profissionais = await request(app).get(`/servicos/${servicoId}/profissionais`);
    expect(profissionais.body).toHaveLength(2);
    expect(Object.keys(profissionais.body[0]).sort()).toEqual(['cargo', 'id', 'nome']);
    expect((await request(app).get('/servicos?categoria=INVALIDA')).status).toBe(400);
  });
  it('exige ADMIN e valida configuração, catálogo, bloqueios e habilitação explícita', async () => {
    expect((await request(app).get('/configuracao-agenda')).status).toBe(401);
    expect((await request(app).get('/configuracao-agenda').set('Cookie', cliente)).status).toBe(403);
    expect((await request(app).get('/configuracao-agenda').set('Cookie', admin)).body.fuso).toBe('America/Sao_Paulo');
    expect((await request(app).put('/configuracao-agenda').set('Cookie', admin).send({ ...configuracaoPadrao, intervaloSlotMin: 0 })).status).toBe(400);
    expect((await request(app).post('/servicos').set('Cookie', admin).send({ nome: 'X', preco: 10, duracaoMin: 30 })).status).toBe(400);
    expect((await request(app).put(`/funcionarios/${funcionarioId}`).set('Cookie', admin).send({ servicoIds: [999999] })).status).toBe(404);
    const block = await request(app).post('/bloqueios-agenda').set('Cookie', admin).send({ inicio, fim: '2026-11-03T10:00:00-03:00' });
    expect(block.status).toBe(201);
    expect((await request(app).get('/bloqueios-agenda').set('Cookie', admin)).body).toHaveLength(1);
    expect((await criar()).body.code).toBe('HORARIO_INDISPONIVEL');
    expect((await request(app).delete(`/bloqueios-agenda/${block.body.id}`).set('Cookie', admin)).status).toBe(204);
    expect((await criar()).status).toBe(201);
  });
  it('disponibilidade pública limita janela e não revela reservas', async () => {
    await criar();
    const res = await request(app).get(`/disponibilidade?servicoId=${servicoId}&dataInicio=2026-11-03&dataFim=2026-11-04&funcionarioId=${funcionarioId}`);
    expect(res.status).toBe(200); expect(res.body.fuso).toBe('America/Sao_Paulo');
    expect(res.body.slots.some((s: { inicio: string }) => s.inicio === inicio)).toBe(false);
    expect(JSON.stringify(res.body)).not.toMatch(/Lua|observacoes|animalId|usuarioId|Atenção/);
    for (const [a, b] of [['2026-11-01', '2026-12-02'], ['2026-11-05', '2026-11-02'], ['2026-02-30', '2026-03-01']]) expect((await request(app).get(`/disponibilidade?servicoId=${servicoId}&dataInicio=${a}&dataFim=${b}`)).status).toBe(400);
  });
});
describe('contrato e reservas', () => {
  it('deriva titular, fim e valores e grava auditoria atomicamente', async () => {
    const res = await criar(); expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ usuarioId, status: 'AGENDADO', precoContratado: 100, duracaoContratadaMin: 45, dataHoraFim: '2026-11-03T12:45:00.000Z', animal: { nome: 'Lua' }, funcionario: { nome: 'Ana' } });
    expect(await prisma.eventoAgendamento.count({ where: { agendamentoId: res.body.id } })).toBe(1);
    expect((await request(app).delete(`/agendamentos/${res.body.id}`).set('Cookie', cliente)).status).toBe(404);
  });
  it('rejeita manipulação de campos e titularidade', async () => {
    for (const campo of ['usuarioId', 'dataHoraFim', 'preco', 'precoContratado', 'duracaoContratadaMin', 'status', 'estado']) expect((await criar({ ...reserva(), [campo]: 1 })).status, campo).toBe(400);
    expect((await criar({ ...reserva(), animalId: outroAnimal })).status).toBe(403);
    expect((await criar({ ...reserva(), animalId: outroAnimal }, admin)).status).toBe(201);
    expect((await criar({ ...reserva(), observacoes: 'a'.repeat(301) })).status).toBe(400);
    expect((await criar(reserva(), equipe)).status).toBe(403);
  });
  it('nega serviço/profissional inativo e profissional sem habilitação', async () => {
    await prisma.servico.update({ where: { id: servicoId }, data: { ativo: false } });
    expect((await criar()).status).toBe(409);
    await prisma.servico.update({ where: { id: servicoId }, data: { ativo: true } });
    await request(app).put(`/funcionarios/${funcionarioId}`).set('Cookie', admin).send({ ativo: false });
    expect((await criar()).status).toBe(409);
    await request(app).put(`/funcionarios/${funcionarioId}`).set('Cookie', admin).send({ ativo: true, servicoIds: [] });
    expect((await criar()).status).toBe(409);
  });
  it('reagenda com contrato original e preserva reserva/auditoria na falha', async () => {
    const created = await criar();
    await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ preco: 999, duracaoMin: 90 });
    const moved = await request(app).put(`/agendamentos/${created.body.id}`).set('Cookie', cliente).send({ dataHoraIni: '2026-11-04T09:00:00-03:00', funcionarioId: outroFuncionario });
    expect(moved.status).toBe(200); expect(moved.body).toMatchObject({ precoContratado: 100, duracaoContratadaMin: 45, dataHoraFim: '2026-11-04T12:45:00.000Z' });
    const failed = await request(app).put(`/agendamentos/${created.body.id}`).set('Cookie', cliente).send({ dataHoraIni: '2026-11-04T11:30:00-03:00' });
    expect(failed.status).toBe(409);
    expect((await prisma.agendamento.findUniqueOrThrow({ where: { id: created.body.id } })).dataHoraIni.toISOString()).toBe('2026-11-04T12:00:00.000Z');
    expect(await prisma.eventoAgendamento.count()).toBe(2);
  });
  it('escopa listagem, detalhes, observações e filtros', async () => {
    const created = await criar();
    for (const sessao of [cliente, admin, equipe]) expect((await request(app).get(`/agendamentos/${created.body.id}`).set('Cookie', sessao)).body.observacoes).toBe('Atenção à pele');
    expect((await request(app).get(`/agendamentos/${created.body.id}`).set('Cookie', outro)).status).toBe(403);
    expect((await request(app).get('/agendamentos').set('Cookie', outro)).body).toEqual([]);
    expect((await request(app).get('/agendamentos?status=CANCELADO').set('Cookie', cliente)).body).toEqual([]);
    expect((await request(app).get('/agendamentos?dataInicio=2026-11-04&dataFim=2026-11-05').set('Cookie', cliente)).body).toEqual([]);
    expect((await request(app).get('/agendamentos/999999').set('Cookie', cliente)).status).toBe(404);
  });
});
describe('transições e prazos', () => {
  it('cancelamento libera intervalo; repetição final é idempotente; final não reabre', async () => {
    const r = await criar();
    expect((await transicao(r.body.id, 'CANCELADO')).status).toBe(200);
    expect((await transicao(r.body.id, 'CANCELADO')).status).toBe(200);
    expect(await prisma.eventoAgendamento.count()).toBe(2);
    expect((await transicao(r.body.id, 'CONCLUIDO', admin)).status).toBe(409);
    expect((await criar()).status).toBe(201);
  });
  it('aplica 24h, exceção ADMIN antes do início e apenas responsável conclui após fim', async () => {
    const r = await criar();
    expect((await transicao(r.body.id, 'CONCLUIDO', equipe)).status).toBe(409);
    expect((await request(app).put(`/agendamentos/${r.body.id}`).set('Cookie', equipe).send({ observacoes: 'X' })).status).toBe(403);
    vi.setSystemTime(new Date('2026-11-02T12:00:00.001Z'));
    expect((await transicao(r.body.id, 'CANCELADO')).status).toBe(409);
    expect((await request(app).put(`/agendamentos/${r.body.id}`).set('Cookie', cliente).send({ dataHoraIni: '2026-11-04T09:00:00-03:00' })).status).toBe(409);
    const moved = await request(app).put(`/agendamentos/${r.body.id}`).set('Cookie', admin).send({ dataHoraIni: '2026-11-03T08:30:00-03:00' });
    expect(moved.status).toBe(409);
    vi.setSystemTime(new Date('2026-11-03T12:45Z'));
    expect((await transicao(r.body.id, 'CONCLUIDO')).status).toBe(403);
    expect((await transicao(r.body.id, 'CONCLUIDO', equipe)).status).toBe(200);
    expect((await transicao(r.body.id, 'CONCLUIDO', equipe)).status).toBe(200);
    expect(await prisma.eventoAgendamento.count()).toBe(2);
  });
});
describe('concorrência PostgreSQL', () => {
  it('apenas uma criação conflitante persiste com uma auditoria', async () => {
    const results = await Promise.all([criar(), criar()]);
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    expect(results.find(r => r.status === 409)?.body.code).toBe('HORARIO_INDISPONIVEL');
    expect(await prisma.agendamento.count()).toBe(1); expect(await prisma.eventoAgendamento.count()).toBe(1);
  });
  it('restrição GiST protege escritas diretas: iguais, contidos e parciais; permite adjacentes e profissionais distintos', async () => {
    const dados = { animalId, servicoId, funcionarioId, usuarioId, duracaoContratadaMin: 60 };
    const write = (a: string, b: string, func = funcionarioId) => prisma.agendamento.create({ data: { ...dados, funcionarioId: func, dataHoraIni: new Date(a), dataHoraFim: new Date(b) } });
    await write('2026-11-03T12:00Z', '2026-11-03T13:00Z');
    for (const [a, b] of [['12:00', '13:00'], ['12:15', '12:45'], ['11:30', '12:30'], ['11:00', '14:00']]) await expect(write(`2026-11-03T${a}Z`, `2026-11-03T${b}Z`)).rejects.toThrow();
    await write('2026-11-03T13:00Z', '2026-11-03T14:00Z');
    await write('2026-11-03T12:00Z', '2026-11-03T13:00Z', outroFuncionario);
    expect(await prisma.agendamento.count()).toBe(3);
  });
  it('serializa reagendamento e cancelamento do mesmo registro sem reabrir estado final', async () => {
    const r = await criar();
    const results = await Promise.all([
      request(app).put(`/agendamentos/${r.body.id}`).set('Cookie', cliente).send({ dataHoraIni: '2026-11-04T09:00:00-03:00' }),
      transicao(r.body.id, 'CANCELADO'),
    ]);
    expect(results[1].status).toBe(200); expect([200, 409]).toContain(results[0].status);
    expect((await prisma.agendamento.findUniqueOrThrow({ where: { id: r.body.id } })).status).toBe('CANCELADO');
    expect(await prisma.eventoAgendamento.count()).toBe(results[0].status === 200 ? 3 : 2);
  });
  it('serializa bloqueio e criação, preservando reserva se ela preceder o bloqueio', async () => {
    const results = await Promise.all([criar(), request(app).post('/bloqueios-agenda').set('Cookie', admin).send({ inicio, fim: '2026-11-03T10:00:00-03:00' })]);
    expect(results[1].status).toBe(201); expect([201, 409]).toContain(results[0].status);
    expect((await criar()).status).toBe(409);
    expect(await prisma.agendamento.count()).toBe(results[0].status === 201 ? 1 : 0);
  });
});

describe('limites e corridas adicionais', () => {
  it('recusa datas normalizadas pelo JavaScript e flags nulas', async () => {
    expect((await request(app).post('/bloqueios-agenda').set('Cookie', admin).send({ inicio: '2026-02-30T09:00:00-03:00', fim: '2026-03-03T10:00:00-03:00' })).status).toBe(400);
    expect((await request(app).post('/servicos').set('Cookie', admin).send({ nome: 'X', preco: 10, duracaoMin: 30, categoria: 'CONSULTA', ativo: null })).status).toBe(400);
    expect((await request(app).post('/funcionarios').set('Cookie', admin).send({ nome: 'X', cargo: 'X', ativo: null })).status).toBe(400);
  });
  it('ADMIN reagenda dentro de 24h; cliente respeita limite exato e novas políticas', async () => {
    const r = await criar();
    vi.setSystemTime(new Date('2026-11-02T12:00Z'));
    expect((await request(app).put(`/agendamentos/${r.body.id}`).set('Cookie', cliente).send({ dataHoraIni: '2026-11-04T09:00:00-03:00' })).status).toBe(200);
    vi.setSystemTime(new Date('2026-11-04T11:00Z'));
    const moved = await request(app).put(`/agendamentos/${r.body.id}`).set('Cookie', admin).send({ dataHoraIni: '2026-11-04T10:00:00-03:00' });
    expect(moved.status).toBe(200);
    expect((await request(app).get(`/agendamentos/${r.body.id}`).set('Cookie', cliente)).body).toMatchObject({ podeCancelar: false, podeReagendar: false });
    vi.setSystemTime(new Date('2026-11-04T13:00Z'));
    expect((await request(app).put(`/agendamentos/${r.body.id}`).set('Cookie', admin).send({ dataHoraIni: '2026-11-05T10:00:00-03:00' })).status).toBe(409);
  });
  it('falta libera intervalo e outro profissional não pode ler nem alterar observações', async () => {
    const r = await criar();
    const u = await prisma.usuario.create({ data: { role: 'FUNCIONARIO', nome: 'Bia', cpf: '12345678909', senhaHash: 'hash', funcionario: { connect: { id: outroFuncionario } }, fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } } } });
    await redis.set('sessao:outro-profissional', JSON.stringify({ id: u.id }), { EX: 3600 });
    const sessao = 'petshop_session=outro-profissional';
    expect((await request(app).get(`/agendamentos/${r.body.id}`).set('Cookie', sessao)).status).toBe(403);
    expect((await transicao(r.body.id, 'NAO_COMPARECEU', sessao)).status).toBe(403);
    vi.setSystemTime(new Date('2026-11-03T12:45Z'));
    expect((await transicao(r.body.id, 'NAO_COMPARECEU', equipe)).status).toBe(200);
    await expect(prisma.agendamento.create({ data: { animalId, usuarioId, servicoId, funcionarioId, duracaoContratadaMin: 45, dataHoraIni: new Date(inicio), dataHoraFim: new Date('2026-11-03T12:45Z') } })).resolves.toHaveProperty('id');
  });
  it('duas escritas diretas concorrentes parcialmente sobrepostas ou contidas persistem só uma', async () => {
    for (const [a, b] of [['12:30', '13:30'], ['12:15', '12:45']]) {
      await prisma.agendamento.deleteMany();
      const dados = { animalId, usuarioId, servicoId, funcionarioId, duracaoContratadaMin: 60 };
      const resultados = await Promise.allSettled([
        prisma.agendamento.create({ data: { ...dados, dataHoraIni: new Date('2026-11-03T12:00Z'), dataHoraFim: new Date('2026-11-03T13:00Z') } }),
        prisma.agendamento.create({ data: { ...dados, dataHoraIni: new Date(`2026-11-03T${a}Z`), dataHoraFim: new Date(`2026-11-03T${b}Z`) } }),
      ]);
      expect(resultados.filter(r => r.status === 'fulfilled')).toHaveLength(1);
      expect(await prisma.agendamento.count()).toBe(1);
    }
  });
  it('duas reservas diferentes disputam o mesmo reagendamento e a perdedora fica intacta', async () => {
    const a = await criar();
    const b = await criar({ ...reserva(), dataHoraIni: '2026-11-03T10:00:00-03:00' });
    const resultados = await Promise.all([a, b].map(r => request(app).put(`/agendamentos/${r.body.id}`).set('Cookie', cliente).send({ dataHoraIni: '2026-11-04T09:00:00-03:00' })));
    expect(resultados.map(r => r.status).sort()).toEqual([200, 409]);
    const perdedor = resultados.findIndex(r => r.status === 409);
    expect((await prisma.agendamento.findUniqueOrThrow({ where: { id: [a, b][perdedor].body.id } })).dataHoraIni.toISOString()).toBe([a, b][perdedor].body.dataHoraIni);
    expect(await prisma.eventoAgendamento.count()).toBe(3);
  });
  it('configuração e elegibilidade concorrentes serializam com criação e preservam reservas prévias', async () => {
    const criacao = criar();
    const mudanca = request(app).put('/configuracao-agenda').set('Cookie', admin).send({ ...configuracaoPadrao, intervalos: [] });
    const resultados = await Promise.all([criacao, mudanca]);
    expect(resultados[1].status).toBe(200); expect([201, 409]).toContain(resultados[0].status);
    expect((await criar()).body.code).toBe('HORARIO_INDISPONIVEL');
    await request(app).put('/configuracao-agenda').set('Cookie', admin).send(configuracaoPadrao);
    const elegibilidade = await Promise.all([criar({ ...reserva(), dataHoraIni: '2026-11-04T09:00:00-03:00' }), request(app).put(`/funcionarios/${funcionarioId}`).set('Cookie', admin).send({ servicoIds: [] })]);
    expect(elegibilidade[1].status).toBe(200); expect([201, 409]).toContain(elegibilidade[0].status);
    expect((await criar()).status).toBe(409);
    if (resultados[0].status === 201) expect((await request(app).get(`/agendamentos/${resultados[0].body.id}`).set('Cookie', cliente)).body.status).toBe('AGENDADO');
  });
  it('disponibilidade de reagendamento usa contrato original e ignora a própria reserva', async () => {
    const r = await criar();
    await request(app).put(`/servicos/${servicoId}`).set('Cookie', admin).send({ preco: 999, duracaoMin: 90 });
    const res = await request(app).get(`/agendamentos/${r.body.id}/disponibilidade?dataInicio=2026-11-03&dataFim=2026-11-03&funcionarioId=${funcionarioId}`).set('Cookie', cliente);
    expect(res.status).toBe(200); expect(res.body).toMatchObject({ preco: 100, duracaoMin: 45 });
    expect(res.body.slots.some((s: { inicio: string }) => s.inicio === inicio)).toBe(true);
    expect((await request(app).get(`/agendamentos/${r.body.id}/disponibilidade?dataInicio=2026-11-03&dataFim=2026-11-03`).set('Cookie', outro)).status).toBe(403);
  });
});

it('traduz violação real da exclusão em 409 HORARIO_INDISPONIVEL', async () => {
  await criar();
  await expect(transacaoAgenda(db => db.agendamento.create({ data: { animalId, servicoId, funcionarioId, usuarioId, duracaoContratadaMin: 45, dataHoraIni: new Date(inicio), dataHoraFim: new Date('2026-11-03T12:45Z') } }))).rejects.toMatchObject({ status: 409, code: 'HORARIO_INDISPONIVEL' });
});
