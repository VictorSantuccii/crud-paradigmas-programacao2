import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
vi.mock('../src/lib/firebaseAdmin', () => ({ verificarTokenFirebase: vi.fn(async () => ({ email_verified: true, email: 'google@example.com', name: 'Google Tutor' })) }));
import app from '../src/app';
import * as animalRepository from '../src/repositories/animalRepository';
import prisma from '../src/lib/prisma';
import redis, { conectarRedis } from '../src/lib/redis';
import { hashSenha } from '../src/lib/password';

const address = { cep: '12345-678', rua: 'Rua Teste', bairro: 'Centro', numero: 12 };
const registration = { nome: 'Ana', email: ' ANA@example.com ', cpf: '529.982.247-25', senha: '12345678', telefone: '+55 (11) 99999-1234', endereco: address };
const cookie = (res: request.Response) => (res.headers['set-cookie'] as unknown as string[]).map(v => v.split(';')[0]).join('; ');
let a: string, b: string, admin: string, employee: string;
let aId: number, bId: number, animalB: number, employeeId: number, serviceId: number;
beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes('petshop_test') || !process.env.REDIS_URL?.endsWith('/15')) throw new Error('Use bancos isolados de teste.');
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-27T12:00:00Z'));
  await conectarRedis();
  await prisma.$executeRawUnsafe('TRUNCATE usuarios, fidelidades, enderecos, animais, funcionarios, servicos, agendamentos, assinaturas, planos RESTART IDENTITY CASCADE');
  await redis.flushDb();
});
afterAll(async () => { vi.useRealTimers(); await prisma.$disconnect(); if (redis.isOpen) await redis.quit(); });
describe('HTTP identidade e autorização', () => {
  it('nega todas as rotas privadas sem sessão', async () => {
    for (const path of ['usuarios', 'enderecos', 'animais', 'agendamentos', 'fidelidades', 'funcionarios', 'planos', 'assinaturas']) {
      for (const method of ['get', 'post', 'put', 'delete'] as const) {
        const res = await request(app)[method](`/${path}${method === 'put' || method === 'delete' ? '/1' : ''}`);
        expect(res.status, `${method} ${path}`).toBe(401);
      }
    }
    expect((await request(app).get('/servicos')).status).toBe(200);
    expect((await request(app).post('/servicos').send({})).status).toBe(401);
  });
  it('cadastro rejeita privilégios e falha atomicamente sem endereço válido', async () => {
    for (const extra of [{ role: 'ADMIN' }, { funcionarioId: 1 }, { fidelidadeId: 1 }]) expect((await request(app).post('/auth/cadastro').send({ ...registration, ...extra })).status).toBe(400);
    expect((await request(app).post('/auth/cadastro').send({ ...registration, endereco: { ...address, numero: -1 } })).status).toBe(400);
    expect(await prisma.usuario.count()).toBe(0);
    expect(await prisma.fidelidade.count()).toBe(0);
  });
  it('cadastro normaliza identidade, cria endereço/fidelidade e resolve concorrência com 409', async () => {
    const results = await Promise.all([request(app).post('/auth/cadastro').send(registration), request(app).post('/auth/cadastro').send(registration)]);
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    const duplicate = results.find(r => r.status === 409)!;
    expect(['email', 'cpf']).toContain(Object.keys(duplicate.body.fieldErrors || {})[0]);
    const result = results.find(r => r.status === 201)!;
    a = cookie(result); aId = result.body.usuario.id;
    expect(result.body.usuario).toMatchObject({ email: 'ana@example.com', cpf: '52998224725', telefone: '11999991234', perfilCompleto: true });
    expect(JSON.stringify(result.body)).not.toMatch(/senha|Hash/);
    const second = await request(app).post('/auth/cadastro').send({ ...registration, email: 'b@example.com', cpf: '11144477735' });
    expect(second.status).toBe(201); b = cookie(second); bId = second.body.usuario.id;
    const animal = await request(app).post('/animais').set('Cookie', b).send({ nome: 'B', idade: 2, porte: 'PEQUENO', especie: 'Gato' });
    expect(animal.status).toBe(201); animalB = animal.body.id;
  });
  it('recarrega sessão e restringe titularidade, filtros e campos de dono', async () => {
    expect((await request(app).get('/auth/me').set('Cookie', a)).body.usuario.perfilCompleto).toBe(true);
    expect((await request(app).get(`/animais?usuarioId=${bId}`).set('Cookie', a)).body).toEqual([]);
    for (const method of ['get', 'put', 'delete'] as const) expect((await request(app)[method](`/animais/${animalB}`).set('Cookie', a).send({ nome: 'roubado' })).status).toBe(403);
    expect((await request(app).post('/animais').set('Cookie', a).send({ nome: 'X', idade: 1, porte: 'PEQUENO', especie: 'Gato', usuarioId: bId })).status).toBe(403);
    expect((await request(app).put('/auth/me').set('Cookie', a).send({ cpf: '11144477735' })).status).toBe(400);
    expect((await request(app).put('/auth/me').set('Cookie', a).send({ role: 'ADMIN' })).status).toBe(400);
    const addr = await prisma.endereco.findFirstOrThrow({ where: { usuarioId: aId } });
    expect((await request(app).delete(`/enderecos/${addr.id}`).set('Cookie', a)).status).toBe(409);
    const otherAddr = await prisma.endereco.findFirstOrThrow({ where: { usuarioId: bId } });
    expect((await request(app).put('/auth/me').set('Cookie', a).send({ endereco: { ...address, id: otherAddr.id } })).status).toBe(403);
    for (const path of ['usuarios', 'funcionarios', 'planos', 'assinaturas']) expect((await request(app).get(`/${path}`).set('Cookie', a)).status).toBe(403);
    expect((await request(app).post('/fidelidades').set('Cookie', a).send({})).status).toBe(403);
  });
  it('Google cria apenas sessão temporária retomável; conclusão emite sessão normal', async () => {
    const start = await request(app).post('/auth/google').send({ idToken: 'verified-by-firebase-mock', nome: 'Fake', email: 'fake@example.com' });
    expect(start.body.requiresOnboarding).toBe(true);
    const temporary = cookie(start);
    expect((await request(app).get('/auth/me').set('Cookie', temporary)).status).toBe(401);
    expect((await request(app).get('/animais').set('Cookie', temporary)).status).toBe(401);
    expect((await request(app).get('/auth/onboarding').set('Cookie', temporary)).body.email).toBe('google@example.com');
    expect(await prisma.usuario.findUnique({ where: { email: 'google@example.com' } })).toBe(null);
    const finish = await request(app).put('/auth/onboarding').set('Cookie', temporary).send({ cpf: '12345678909', telefone: '11999991234', endereco: address });
    expect(finish.status).toBe(201);
    expect(finish.body.usuario.perfilCompleto).toBe(true);
    expect((await request(app).get('/auth/onboarding').set('Cookie', temporary)).status).toBe(401);
  });
  it('conta legada só acessa perfil até regularização e logout revoga sessão', async () => {
    const legacy = await prisma.usuario.create({ data: { nome: 'Legado', email: 'legacy@example.com', cpf: 'invalid', senhaHash: await hashSenha('12345678'), role: 'CLIENTE', fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } } } });
    const login = await request(app).post('/auth/login').send({ email: legacy.email, senha: '12345678' });
    const session = cookie(login);
    expect(login.body.usuario.perfilCompleto).toBe(false);
    expect((await request(app).get('/animais').set('Cookie', session)).body.code).toBe('PERFIL_INCOMPLETO');
    const complete = await request(app).put('/auth/me').set('Cookie', session).send({ cpf: '98765432100', telefone: '11999991234', endereco: address });
    expect(complete.status).toBe(200); expect(complete.body.usuario.perfilCompleto).toBe(true);
    expect((await request(app).get('/animais').set('Cookie', session)).status).toBe(200);
    await request(app).post('/auth/logout').set('Cookie', session);
    expect((await request(app).get('/auth/me').set('Cookie', session)).status).toBe(401);
  });
  it('provisiona funcionário por ADMIN e limita agenda ao vínculo atual', async () => {
    const root = await prisma.usuario.create({ data: { nome: 'Admin', email: 'admin@example.com', cpf: '39053344705', senhaHash: await hashSenha('12345678'), role: 'ADMIN', fidelidade: { create: { beneficioAtivo: false, qntdServicos: 0 } } } });
    admin = cookie(await request(app).post('/auth/login').send({ email: root.email, senha: '12345678' }));
    expect((await request(app).post('/usuarios').set('Cookie', admin).send({ ...registration, role: 'ADMIN' })).status).toBe(400);
    const provision = await request(app).post('/usuarios').set('Cookie', admin).send({ nome: 'Funcionário', email: 'employee@example.com', cpf: '15350946056', senha: '12345678', role: 'FUNCIONARIO', funcionario: { nome: 'Funcionário', cargo: 'Tosador' } });
    expect(provision.status).toBe(201); employeeId = provision.body.funcionarioId;
    employee = cookie(await request(app).post('/auth/login').send({ email: 'employee@example.com', senha: '12345678' }));
    serviceId = (await prisma.servico.create({ data: { nome: 'Banho', categoria: 'BANHO_TOSA', ativo: true, preco: 50, duracaoMin: 30, profissionais: { connect: { id: employeeId } } } })).id;
    await prisma.funcionario.update({ where: { id: employeeId }, data: { ativo: true } });
    const booking = { dataHoraIni: '2026-11-03T12:00:00Z', animalId: animalB, servicoId: serviceId, funcionarioId: employeeId };
    expect((await request(app).post('/agendamentos').set('Cookie', a).send(booking)).status).toBe(403);
    const created = await request(app).post('/agendamentos').set('Cookie', b).send(booking);
    expect(created.status).toBe(201);
    expect((await request(app).get('/agendamentos').set('Cookie', employee)).body).toHaveLength(1);
    expect((await request(app).put(`/agendamentos/${created.body.id}`).set('Cookie', employee).send({})).status).toBe(403);
    expect((await request(app).get('/animais').set('Cookie', employee)).status).toBe(403);
    await prisma.usuario.update({ where: { id: provision.body.id }, data: { role: 'CLIENTE', funcionarioId: null } });
    expect((await request(app).get('/agendamentos').set('Cookie', employee)).status).toBe(403);
  });
});

describe('sessões inválidas e recursos ausentes', () => {
  it('retorna 401 para sessão inexistente, malformada, expirada e usuário removido', async () => {
    for (const value of ['', 'invalid', '{"id":"bad"}', '{"id":999999}']) {
      await redis.set('sessao:invalid', value, { EX: 30 });
      expect((await request(app).get('/auth/me').set('Cookie', 'petshop_session=invalid')).status).toBe(401);
    }
    await redis.set('sessao:expired', JSON.stringify({ id: aId }), { EX: 1 });
    await redis.expire('sessao:expired', 0);
    expect((await request(app).get('/auth/me').set('Cookie', 'petshop_session=expired')).status).toBe(401);
    expect((await request(app).get('/animais/999999').set('Cookie', a)).status).toBe(404);
    await redis.set('onboarding:expired', JSON.stringify({ nome: 'Ana', email: 'test@example.com' }), { EX: 1 });
    await redis.expire('onboarding:expired', 0);
    expect((await request(app).get('/auth/onboarding').set('Cookie', 'petshop_onboarding=expired')).status).toBe(401);
  });
  it('aplica titularidade a endereços, fidelidade e agendamentos, sem vazamento de senha', async () => {
    const userB = await prisma.usuario.findUniqueOrThrow({ where: { id: bId }, include: { enderecos: true } });
    const agendamento = await prisma.agendamento.findFirstOrThrow({ where: { usuarioId: bId } });
    for (const [path, id] of [['enderecos', userB.enderecos[0].id], ['agendamentos', agendamento.id]] as const) {
      const list = await request(app).get(`/${path}?usuarioId=${bId}`).set('Cookie', a);
      expect(list.body.every((item: { usuarioId: number }) => item.usuarioId === aId)).toBe(true);
      for (const method of (path === 'agendamentos' ? ['get', 'put'] : ['get', 'put', 'delete']) as ('get' | 'put' | 'delete')[]) expect((await request(app)[method](`/${path}/${id}`).set('Cookie', a).send({ nome: 'Intruso' })).status).toBe(403);
    }
    expect((await request(app).get(`/fidelidades/${userB.fidelidadeId}`).set('Cookie', a)).status).toBe(403);
    const ownFidelity = await request(app).get(`/fidelidades?usuarioId=${bId}`).set('Cookie', a);
    const userA = await prisma.usuario.findUniqueOrThrow({ where: { id: aId } });
    expect(ownFidelity.body.map((f: { id: number }) => f.id)).toEqual([userA.fidelidadeId]);
    for (const path of ['/auth/me', '/usuarios', `/usuarios/${aId}`]) {
      const result = await request(app).get(path).set('Cookie', admin);
      expect(result.status).toBe(200); expect(JSON.stringify(result.body)).not.toMatch(/senha|Hash/);
    }
  });
  it('protege último endereço também em transferência administrativa e concorrência', async () => {
    const addressA = await prisma.endereco.findFirstOrThrow({ where: { usuarioId: aId } });
    expect((await request(app).put(`/enderecos/${addressA.id}`).set('Cookie', admin).send({ usuarioId: bId })).status).toBe(409);
    const extra = await request(app).post('/enderecos').set('Cookie', a).send(address);
    expect(extra.status).toBe(201);
    const results = await Promise.all([request(app).delete(`/enderecos/${addressA.id}`).set('Cookie', a), request(app).delete(`/enderecos/${extra.body.id}`).set('Cookie', a)]);
    expect(results.map(r => r.status).sort()).toEqual([200, 409]);
  });
});


describe('fase 2: perfil, endereços e pets persistidos', () => {
  it('cria, consulta, edita, preserva e limpa raça e remove pet', async () => {
    const created = await request(app).post('/animais').set('Cookie', a).send({ nome: ' Lua ', especie: ' Gato ', idade: 0, porte: 'PEQUENO', raca: ' Siamês ' });
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect(created.body).toMatchObject({ nome: 'Lua', especie: 'Gato', raca: 'Siamês', usuarioId: aId, idade: 0 });
    expect((await request(app).get(`/animais/${id}`).set('Cookie', a)).body.raca).toBe('Siamês');
    expect((await prisma.animal.findUniqueOrThrow({ where: { id: animalB } })).raca).toBe(null);
    expect((await request(app).put(`/animais/${id}`).set('Cookie', a).send({ idade: 1, porte: 'MEDIO' })).body.raca).toBe('Siamês');
    expect((await request(app).put(`/animais/${id}`).set('Cookie', a).send({ raca: null })).body.raca).toBe(null);
    expect((await prisma.animal.findUniqueOrThrow({ where: { id } })).raca).toBe(null);
    expect((await request(app).put(`/animais/${id}`).set('Cookie', a).send({ usuarioId: bId })).status).toBe(403);
    expect((await request(app).delete(`/animais/${id}`).set('Cookie', a)).status).toBe(200);
    expect((await request(app).get(`/animais/${id}`).set('Cookie', a)).status).toBe(404);
  });
  it('rejeita dados de pet inválidos com identificação do campo', async () => {
    const valid = { nome: 'Pet', especie: 'Gato', idade: 1, porte: 'PEQUENO' };
    for (const field of ['nome', 'especie', 'idade', 'porte']) {
      const body: Record<string, unknown> = { ...valid }; delete body[field];
      const res = await request(app).post('/animais').set('Cookie', a).send(body);
      expect(res.status).toBe(400); expect(res.body.fieldErrors[field]).toBeTruthy();
    }
    for (const [field, value] of [['nome', ' '], ['especie', null], ['idade', -1], ['idade', 1.5], ['idade', '2'], ['porte', 'GIGANTE'], ['raca', 10], ['raca', ' ']]) {
      const res = await request(app).post('/animais').set('Cookie', a).send({ ...valid, [field]: value });
      expect(res.status).toBe(400); expect(res.body.fieldErrors[field as string]).toBeTruthy();
    }
  });
  it('bloqueia exclusão com agendamento inclusive se o vínculo surgir após a contagem', async () => {
    expect((await request(app).delete(`/animais/${animalB}`).set('Cookie', b)).status).toBe(409);
    const pet = await prisma.animal.create({ data: { nome: 'Concorrente', especie: 'Cão', idade: 1, porte: 'GRANDE', usuarioId: bId } });
    const remove = animalRepository.remove;
    const spy = vi.spyOn(animalRepository, 'remove').mockImplementationOnce(async (id, scope) => {
      await prisma.agendamento.create({ data: { animalId: id, usuarioId: bId, servicoId: serviceId, funcionarioId: employeeId, duracaoContratadaMin: 60, dataHoraIni: new Date('2026-12-01T12:00:00Z'), dataHoraFim: new Date('2026-12-01T13:00:00Z') } });
      return remove(id, scope);
    });
    try {
      const res = await request(app).delete(`/animais/${pet.id}`).set('Cookie', b);
      expect(res.status).toBe(409); expect(res.body.message).toMatch(/agendamentos/);
      expect(await prisma.animal.findUnique({ where: { id: pet.id } })).not.toBe(null);
    } finally { spy.mockRestore(); }
  });
  it('persiste perfil/endereço e preserva CPF e último endereço', async () => {
    const res = await request(app).put('/auth/me').set('Cookie', a).send({ nome: ' Ana Maria ', email: ' ANA.MARIA@example.com ', telefone: '(21) 99999-4321' });
    expect(res.status).toBe(200);
    expect((await request(app).get('/auth/me').set('Cookie', a)).body.usuario).toMatchObject({ nome: 'Ana Maria', email: 'ana.maria@example.com', telefone: '21999994321', cpf: '52998224725' });
    const blocked = await request(app).put('/auth/me').set('Cookie', a).send({ cpf: '11144477735' });
    expect(blocked.status).toBe(400); expect(blocked.body.fieldErrors.cpf).toBeTruthy();
    const added = await request(app).post('/enderecos').set('Cookie', a).send({ ...address, numero: 0, complemento: ' Casa ' });
    expect(added.status).toBe(201);
    expect((await request(app).put(`/enderecos/${added.body.id}`).set('Cookie', a).send({ rua: 'Rua Nova', complemento: null })).status).toBe(200);
    expect((await request(app).get('/auth/me').set('Cookie', a)).body.usuario.enderecos).toContainEqual(expect.objectContaining({ id: added.body.id, rua: 'Rua Nova', numero: 0, complemento: null }));
    expect((await request(app).delete(`/enderecos/${added.body.id}`).set('Cookie', a)).status).toBe(200);
    const last = (await request(app).get('/auth/me').set('Cookie', a)).body.usuario.enderecos[0];
    expect((await request(app).delete(`/enderecos/${last.id}`).set('Cookie', a)).status).toBe(409);
  });
  it('identifica campos inválidos e duplicidades normalizadas sem persistência parcial', async () => {
    for (const [body, field] of [[{ ...registration, endereco: { ...address, cep: 'x' } }, 'endereco.cep'], [{ ...registration, cpf: 'invalid' }, 'cpf'], [{ ...registration, telefone: '' }, 'telefone'], [{ ...registration, confirmarSenha: 'different' }, 'confirmarSenha']] as const) {
      const res = await request(app).post('/auth/cadastro').send(body);
      expect(res.status).toBe(400); expect(res.body.fieldErrors[field]).toBeTruthy();
    }
    const before = { users: await prisma.usuario.count(), addresses: await prisma.endereco.count(), fidelities: await prisma.fidelidade.count() };
    for (const [body, field] of [[{ ...registration, email: ' ANA.MARIA@EXAMPLE.COM ', cpf: '01234567890' }, 'email'], [{ ...registration, email: 'unique@example.com' }, 'cpf']] as const) {
      const res = await request(app).post('/auth/cadastro').send(body);
      expect(res.status).toBe(409); expect(res.body.fieldErrors[field]).toBeTruthy();
    }
    const original = await prisma.usuario.findUniqueOrThrow({ where: { id: aId } });
    const failed = await request(app).put('/auth/me').set('Cookie', a).send({ nome: 'Não salvar', email: ' B@EXAMPLE.COM ', endereco: address });
    expect(failed.status).toBe(409); expect(failed.body.fieldErrors.email).toBeTruthy();
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: aId } })).nome).toBe(original.nome);
    expect({ users: await prisma.usuario.count(), addresses: await prisma.endereco.count(), fidelities: await prisma.fidelidade.count() }).toEqual(before);
  });
});
