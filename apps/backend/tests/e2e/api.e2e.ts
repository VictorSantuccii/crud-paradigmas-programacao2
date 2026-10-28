import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { configuracaoPadrao } from '../../src/lib/agenda';
import { hashSenha } from '../../src/lib/password';
import { encerrarApi, iniciarApi } from './support/server';

const db = new PrismaClient();
const redis = createClient({ url: process.env.REDIS_URL });
let api: Awaited<ReturnType<typeof iniciarApi>> | undefined;
const senha = 'e2e-senha-segura';
const cadastro = { nome: 'Tutor E2E', email: 'e2e-tutor@example.com', cpf: '52998224725', telefone: '11999991234', senha, endereco: { cep: '12345678', rua: 'Rua E2E', bairro: 'Centro', numero: 10 } };

async function chamar(path: string, options: { method?: string; cookie?: string; body?: unknown } = {}, status = 200) {
  const res = await fetch(`${api!.url}${path}`, {
    method: options.method || 'GET',
    headers: { ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(options.cookie ? { Cookie: options.cookie } : {}) },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    signal: AbortSignal.timeout(10000),
  });
  const text = await res.text();
  expect(res.status, `${options.method || 'GET'} ${path}: ${text}\n${api!.logs()}`).toBe(status);
  return { body: text ? JSON.parse(text) : null, headers: res.headers, cookie: res.headers.get('set-cookie')?.split(';')[0] || '' };
}
const registrar = () => chamar('/auth/cadastro', { method: 'POST', body: cadastro }, 201);

beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== '/petshop_test' || new URL(process.env.REDIS_URL!).pathname !== '/15') throw Error('E2E exige PostgreSQL petshop_test e Redis /15 isolados.');
  await redis.connect();
  api = await iniciarApi();
});
beforeEach(async () => {
  await db.$executeRawUnsafe('TRUNCATE usuarios, fidelidades, enderecos, animais, funcionarios, servicos, agendamentos, assinaturas, planos RESTART IDENTITY CASCADE');
  await redis.flushDb();
  await db.bloqueioAgenda.deleteMany();
  await db.configuracaoAgenda.upsert({ where: { id: 1 }, create: { id: 1, ...configuracaoPadrao }, update: configuracaoPadrao });
});
afterAll(async () => {
  if (api) await encerrarApi(api.processo);
  await db.$disconnect();
  if (redis.isOpen) await redis.quit();
});

describe('E2E HTTP com servidor real e persistência', () => {
  it('publica saúde e Swagger, aplica CORS e responde erros JSON pela rede', async () => {
    expect((await chamar('/')).body).toMatchObject({ message: 'API funcionando corretamente.', docs: '/api-docs' });
    const docs = await fetch(`${api!.url}/api-docs/`, { signal: AbortSignal.timeout(10000) });
    expect(docs.status).toBe(200); expect(await docs.text()).toContain('Swagger UI');
    const preflight = await fetch(`${api!.url}/auth/login`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:25173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' }, signal: AbortSignal.timeout(10000) });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('http://localhost:25173');
    expect(preflight.headers.get('access-control-allow-credentials')).toBe('true');
    expect((await chamar('/rota-inexistente', {}, 404)).body).toEqual({ message: 'Rota não encontrada.' });
    await chamar('/animais', {}, 401);
    const invalido = await fetch(`${api!.url}/auth/cadastro`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{', signal: AbortSignal.timeout(10000) });
    expect(invalido.status).toBe(400); expect(await invalido.json()).toEqual({ message: 'JSON inválido.' });
  });

  it('cadastra, autentica, persiste e edita pet, revoga sessão e remove pet após novo login', async () => {
    const tutor = await registrar();
    expect(tutor.headers.get('set-cookie')).toMatch(/HttpOnly/);
    expect(tutor.body.usuario).toMatchObject({ perfilCompleto: true, role: 'CLIENTE' });
    expect((await chamar('/auth/me', { cookie: tutor.cookie })).body.usuario.email).toBe(cadastro.email);
    const pet = await chamar('/animais', { method: 'POST', cookie: tutor.cookie, body: { nome: 'Lua E2E', especie: 'Gato', idade: 2, porte: 'PEQUENO', raca: 'Siamês' } }, 201);
    const id = pet.body.id;
    await chamar(`/animais/${id}`, { method: 'PUT', cookie: tutor.cookie, body: { nome: 'Lua Atualizada', raca: null } });
    expect((await chamar('/animais', { cookie: tutor.cookie })).body).toEqual([expect.objectContaining({ id, nome: 'Lua Atualizada', raca: null })]);
    await chamar('/auth/logout', { method: 'POST', cookie: tutor.cookie }, 204);
    await chamar('/auth/me', { cookie: tutor.cookie }, 401);
    await chamar('/auth/login', { method: 'POST', body: { email: cadastro.email, senha: 'incorreta' } }, 401);
    const login = await chamar('/auth/login', { method: 'POST', body: { email: ' E2E-TUTOR@EXAMPLE.COM ', senha } });
    expect(login.cookie).not.toBe(tutor.cookie);
    expect((await chamar(`/animais/${id}`, { cookie: login.cookie })).body.nome).toBe('Lua Atualizada');
    expect((await chamar(`/animais/${id}`, { method: 'DELETE', cookie: login.cookie })).body).toEqual({ message: 'Animal removido com sucesso.' });
    expect((await chamar('/animais', { cookie: login.cookie })).body).toEqual([]);
    await chamar(`/animais/${id}`, { cookie: login.cookie }, 404);
  });

  it('configura operação, cota e reserva benefício; conflito não duplica e cancelamento libera saldo e horário', async () => {
    // Apenas o ADMIN inicial é provisionado diretamente; toda a operação usa HTTP.
    await db.usuario.create({ data: { nome: 'Admin E2E', email: 'e2e-admin@example.com', cpf: '39053344705', role: 'ADMIN', senhaHash: await hashSenha(senha), fidelidade: { create: { qntdServicos: 0, beneficioAtivo: false } } } });
    const admin = await chamar('/auth/login', { method: 'POST', body: { email: 'e2e-admin@example.com', senha } });
    const tutor = await registrar();
    const cookie = tutor.cookie;
    const pet = await chamar('/animais', { method: 'POST', cookie, body: { nome: 'Sol E2E', especie: 'Cão', idade: 3, porte: 'MEDIO' } }, 201);
    const servico = await chamar('/servicos', { method: 'POST', cookie: admin.cookie, body: { nome: 'Banho E2E', categoria: 'BANHO_TOSA', ativo: true, preco: 89.9, duracaoMin: 45, elegivelFidelidade: true } }, 201);
    const profissional = await chamar('/funcionarios', { method: 'POST', cookie: admin.cookie, body: { nome: 'Tosadora E2E', cargo: 'Tosadora', ativo: true, servicoIds: [servico.body.id] } }, 201);
    await chamar(`/fidelidades/${tutor.body.usuario.fidelidadeId}/ajustes`, { method: 'POST', cookie: admin.cookie, body: { progresso: 0, variacaoBeneficios: 1, motivo: 'Saldo de abertura E2E' } });

    const inicio = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const fim = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const path = `/disponibilidade?servicoId=${servico.body.id}&dataInicio=${inicio}&dataFim=${fim}`;
    const disponibilidade = await chamar(path);
    expect(disponibilidade.body.slots.length).toBeGreaterThan(0);
    const slot = disponibilidade.body.slots[0];
    const dados = { animalId: pet.body.id, servicoId: servico.body.id, funcionarioId: profissional.body.id, dataHoraIni: slot.inicio };
    const previa = await chamar('/agendamentos/previa', { method: 'POST', cookie, body: dados });
    expect(previa.body).toMatchObject({ precoBase: 89.9, desconto: 89.9, precoContratado: 0 });
    const reserva = await chamar('/agendamentos', { method: 'POST', cookie, body: { ...dados, cotacaoEsperada: previa.body } }, 201);
    expect(reserva.body).toMatchObject({ status: 'AGENDADO', precoBase: 89.9, desconto: 89.9, precoContratado: 0, situacaoBeneficio: 'RESERVADO' });
    expect((await chamar('/fidelidades/me', { cookie })).body.beneficios).toMatchObject({ disponiveis: 0, reservados: 1 });
    const conflito = await chamar('/agendamentos', { method: 'POST', cookie, body: dados }, 409);
    expect(conflito.body.code).toBe('HORARIO_INDISPONIVEL');
    expect((await chamar('/agendamentos', { cookie })).body).toHaveLength(1);
    expect((await chamar(path)).body.slots.some((s: { inicio: string }) => s.inicio === slot.inicio)).toBe(false);
    await chamar(`/animais/${pet.body.id}`, { method: 'DELETE', cookie }, 409);

    await chamar(`/servicos/${servico.body.id}`, { method: 'PUT', cookie: admin.cookie, body: { preco: 129.9 } });
    expect((await chamar(`/agendamentos/${reserva.body.id}`, { cookie })).body.precoBase).toBe(89.9);
    const cancelado = await chamar(`/agendamentos/${reserva.body.id}/status`, { method: 'PATCH', cookie, body: { status: 'CANCELADO', motivo: 'Cancelamento E2E' } });
    expect(cancelado.body).toMatchObject({ status: 'CANCELADO', situacaoBeneficio: 'DEVOLVIDO', precoBase: 89.9 });
    expect((await chamar('/fidelidades/me', { cookie })).body.beneficios).toMatchObject({ disponiveis: 1, reservados: 0 });
    expect((await chamar(path)).body.slots.some((s: { inicio: string }) => s.inicio === slot.inicio)).toBe(true);
    expect((await chamar('/agendamentos/previa', { method: 'POST', cookie, body: dados })).body).toMatchObject({ precoBase: 129.9, desconto: 129.9, precoContratado: 0 });
  });
});
