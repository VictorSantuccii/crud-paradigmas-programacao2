import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
vi.mock('../src/lib/firebaseAdmin', () => ({ verificarTokenFirebase: vi.fn() }));
import app from '../src/app';
import prisma from '../src/lib/prisma';
import redis, { conectarRedis } from '../src/lib/redis';
import { verificarTokenFirebase } from '../src/lib/firebaseAdmin';
import { DURACAO_SESSAO_SEGUNDOS } from '../src/services/authService';

const cadastro = { nome: 'Tutor Segurança', email: 'security@example.com', cpf: '52998224725', telefone: '11999991234', senha: 'senha-segura-123', endereco: { cep: '12345678', rua: 'Rua Teste', bairro: 'Centro', numero: 1 } };
const cookie = (res: request.Response) => (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
let sessao: string;
let usuarioId: number;
const identidadeGoogle = (email: string, verificado = true): Awaited<ReturnType<typeof verificarTokenFirebase>> => ({
  aud: 'petshop-test', auth_time: 0, exp: 3600, iat: 0,
  iss: 'https://securetoken.google.com/petshop-test', sub: 'google-test', uid: 'google-test',
  firebase: { identities: {}, sign_in_provider: 'google.com' },
  email, email_verified: verificado, name: 'Nome do provedor',
});

beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== '/petshop_test' || new URL(process.env.REDIS_URL!).pathname !== '/15') throw Error('Use bancos isolados de teste.');
  await conectarRedis();
});
beforeEach(async () => {
  vi.resetAllMocks();
  await prisma.$executeRawUnsafe('TRUNCATE usuarios, fidelidades, enderecos, animais, funcionarios, servicos, agendamentos, assinaturas, planos RESTART IDENTITY CASCADE');
  await redis.flushDb();
  const res = await request(app).post('/auth/cadastro').send(cadastro);
  expect(res.status).toBe(201);
  sessao = cookie(res); usuarioId = res.body.usuario.id;
});
afterAll(async () => { await prisma.$disconnect(); if (redis.isOpen) await redis.quit(); });

describe('segurança de autenticação', () => {
  it('não distingue conta inexistente de senha incorreta e não emite sessão', async () => {
    const chavesAntes = await redis.keys('sessao:*');
    const inexistente = await request(app).post('/auth/login').send({ email: 'ausente@example.com', senha: cadastro.senha });
    const incorreta = await request(app).post('/auth/login').send({ email: cadastro.email, senha: 'errada' });
    expect(inexistente.status).toBe(401); expect(incorreta.status).toBe(401);
    expect(inexistente.body).toEqual(incorreta.body);
    expect(inexistente.headers['set-cookie']).toBeUndefined(); expect(incorreta.headers['set-cookie']).toBeUndefined();
    expect(await redis.keys('sessao:*')).toEqual(chavesAntes);
  });

  it('normaliza login e protege cookie; Redis guarda só o ID com expiração', async () => {
    const res = await request(app).post('/auth/login').send({ email: ' SECURITY@EXAMPLE.COM ', senha: cadastro.senha });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(res.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
    expect(res.headers['set-cookie'][0]).toMatch(/Path=\//);
    const token = cookie(res).split('=')[1];
    expect(JSON.parse((await redis.get(`sessao:${token}`))!)).toEqual({ id: usuarioId });
    expect(await redis.ttl(`sessao:${token}`)).toBeGreaterThan(DURACAO_SESSAO_SEGUNDOS - 10);
    expect(await redis.ttl(`sessao:${token}`)).toBeLessThanOrEqual(DURACAO_SESSAO_SEGUNDOS);
    expect(JSON.stringify(res.body)).not.toMatch(/senha|Hash|token/);
  });

  it('logout revoga somente a sessão enviada e é idempotente', async () => {
    const outra = cookie(await request(app).post('/auth/login').send({ email: cadastro.email, senha: cadastro.senha }));
    expect(outra).not.toBe(sessao);
    expect((await request(app).post('/auth/logout').set('Cookie', sessao)).status).toBe(204);
    expect((await request(app).get('/auth/me').set('Cookie', sessao)).status).toBe(401);
    expect((await request(app).get('/auth/me').set('Cookie', outra)).status).toBe(200);
    expect((await request(app).post('/auth/logout').set('Cookie', sessao)).status).toBe(204);
    expect((await request(app).post('/auth/logout')).status).toBe(204);
  });

  it('reavalia privilégios no banco sem confiar em dados antigos do Redis', async () => {
    expect((await request(app).get('/usuarios').set('Cookie', sessao)).status).toBe(403);
    await prisma.usuario.update({ where: { id: usuarioId }, data: { role: 'ADMIN' } });
    expect((await request(app).get('/usuarios').set('Cookie', sessao)).status).toBe(200);
    await prisma.usuario.update({ where: { id: usuarioId }, data: { role: 'CLIENTE' } });
    expect((await request(app).get('/usuarios').set('Cookie', sessao)).status).toBe(403);
  });

  it('rejeita JSON malformado e cadastro com confirmação diferente sem criar conta', async () => {
    const invalido = await request(app).post('/auth/cadastro').set('Content-Type', 'application/json').send('{');
    expect(invalido.status).toBe(400); expect(invalido.body).toEqual({ message: 'JSON inválido.' });
    const confirmacao = await request(app).post('/auth/cadastro').send({ ...cadastro, email: 'novo@example.com', cpf: '11144477735', confirmarSenha: 'diferente' });
    expect(confirmacao.status).toBe(400); expect(confirmacao.body.fieldErrors.confirmarSenha).toBeTruthy();
    expect(await prisma.usuario.count()).toBe(1);
  });

  it('rejeita token Google inválido e conta sem e-mail verificado sem emitir cookies', async () => {
    vi.mocked(verificarTokenFirebase).mockRejectedValueOnce(new Error('Token inválido'));
    const invalido = await request(app).post('/auth/google').send({ idToken: 'invalido' });
    expect(invalido.status).toBe(401); expect(invalido.headers['set-cookie']).toBeUndefined();
    vi.mocked(verificarTokenFirebase).mockResolvedValueOnce(identidadeGoogle('google@example.com', false));
    const naoVerificado = await request(app).post('/auth/google').send({ idToken: 'nao-verificado' });
    expect(naoVerificado.status).toBe(401); expect(naoVerificado.headers['set-cookie']).toBeUndefined();
    expect(await redis.keys('onboarding:*')).toEqual([]);
    expect(await prisma.usuario.count()).toBe(1);
  });

  it('login Google de conta existente emite sessão sem duplicar identidade', async () => {
    vi.mocked(verificarTokenFirebase).mockResolvedValueOnce(identidadeGoogle(cadastro.email));
    const res = await request(app).post('/auth/google').send({ idToken: 'verificado' });
    expect(res.status).toBe(200); expect(res.body.usuario.id).toBe(usuarioId);
    expect(res.body.requiresOnboarding).toBeUndefined();
    expect((await request(app).get('/auth/me').set('Cookie', cookie(res))).body.usuario.nome).toBe(cadastro.nome);
    expect(await prisma.usuario.count()).toBe(1);
  });

  it('logout remove onboarding pendente e impede conclusão com o cookie antigo', async () => {
    vi.mocked(verificarTokenFirebase).mockResolvedValueOnce(identidadeGoogle('novo-google@example.com'));
    const res = await request(app).post('/auth/google').send({ idToken: 'verificado' });
    expect(res.body.requiresOnboarding).toBe(true);
    const temporaria = cookie(res);
    expect((await request(app).post('/auth/logout').set('Cookie', temporaria)).status).toBe(204);
    expect((await request(app).put('/auth/onboarding').set('Cookie', temporaria).send({ cpf: '11144477735', telefone: cadastro.telefone, endereco: cadastro.endereco })).status).toBe(401);
    expect(await prisma.usuario.count()).toBe(1);
  });
});
