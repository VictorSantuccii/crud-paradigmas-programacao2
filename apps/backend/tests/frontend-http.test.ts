import { afterEach, expect, it, vi } from 'vitest';
import { api, ApiError } from '../../frontend/src/lib/api';
afterEach(() => vi.unstubAllGlobals());
it('serializa JSON e inclui cookies sem enviar opções internas ao fetch', async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({ nome: 'Lua' }), { status: 201 }));
  vi.stubGlobal('fetch', fetch);
  expect(await api('/animais', { method: 'POST', body: { nome: 'Lua' } })).toEqual({ nome: 'Lua' });
  expect(fetch.mock.calls[0]).toEqual([expect.stringContaining('/animais'), expect.objectContaining({ method: 'POST', credentials: 'include', body: '{"nome":"Lua"}' })]);
});
it('preserva status, código e erros por campo', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Duplicado', code: 'DUPLICADO', fieldErrors: { email: 'Já cadastrado' } }), { status: 409 })));
  await expect(api('/auth/cadastro', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 409, code: 'DUPLICADO', fieldErrors: { email: 'Já cadastrado' } });
});
it('diferencia falha de rede de 401 e suporta resposta sem corpo', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  const error = await api('/auth/me').catch(e => e);
  expect(error).toBeInstanceOf(ApiError);
  if (!(error instanceof ApiError)) throw new Error('Era esperado ApiError.');
  expect(error.status).toBe(0);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })));
  expect(await api('/auth/logout', { method: 'POST' })).toBeUndefined();
});
