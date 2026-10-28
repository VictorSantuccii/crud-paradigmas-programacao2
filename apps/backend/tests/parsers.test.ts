import { describe, expect, it } from 'vitest';
import { data, dataHora, inteiro, obrigatorio, opcional, parseAtualizacao, parseCriacao, parseIdParam, preco, texto } from '../src/lib/parsers';

describe('limites de entrada da API', () => {
  it.each(['0', '-1', '1.5', '1e2', '12abc', '2147483648', 'Infinity', ''])('rejeita ID inválido %j', value => {
    expect(() => parseIdParam(value)).toThrow();
  });

  it('aceita os limites positivos de ID e zero em campos inteiros não negativos', () => {
    expect(parseIdParam('1')).toBe(1);
    expect(parseIdParam('2147483647')).toBe(2147483647);
    expect(inteiro(0)(0, 'idade')).toBe(0);
  });

  it.each([NaN, Infinity, -Infinity, -0.01, 1.001, 100000000, '12.50'])('rejeita preço inválido %j', value => {
    expect(() => preco(value, 'preco')).toThrow();
  });

  it('aceita preço zero e o maior Decimal(10,2) permitido', () => {
    expect(preco(0, 'preco')).toBe(0);
    expect(preco(99999999.99, 'preco')).toBe(99999999.99);
  });

  it.each(['2025-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-1-01'])('rejeita data inválida %j sem normalização silenciosa', value => {
    expect(() => data(value, 'data')).toThrow();
  });

  it('aceita ano bissexto e converte offsets para o mesmo instante', () => {
    expect(data('2028-02-29', 'data').toISOString()).toBe('2028-02-29T00:00:00.000Z');
    expect(dataHora('2028-02-29T09:00:00.123-03:00', 'inicio')).toEqual(dataHora('2028-02-29T12:00:00.123Z', 'inicio'));
  });

  it.each(['2026-11-02T09:00:00', '2026-11-02T24:00:00Z', '2026-11-02T09:60:00Z', '2026-02-30T09:00:00Z'])('exige data e hora válidas com fuso: %j', value => {
    expect(() => dataHora(value, 'inicio')).toThrow();
  });

  const schema = { nome: obrigatorio(texto), raca: opcional(texto) };
  it.each([null, [], 'texto', 1])('rejeita corpo que não é objeto: %j', body => {
    expect(() => parseCriacao(schema, body)).toThrow();
    expect(() => parseAtualizacao(schema, body)).toThrow();
  });

  it('distingue ausência e limpeza explícita de campo opcional na edição', () => {
    expect(parseCriacao(schema, { nome: ' Lua ' })).toEqual({ nome: 'Lua', raca: null });
    expect(parseAtualizacao(schema, { nome: ' Sol ' })).toEqual({ nome: 'Sol' });
    expect(parseAtualizacao(schema, { raca: null })).toEqual({ raca: null });
    expect(() => parseAtualizacao(schema, {})).toThrow();
    expect(() => parseAtualizacao(schema, { nome: null })).toThrow();
  });

  it('identifica o campo obrigatório ausente na criação', () => {
    expect(() => parseCriacao(schema, { raca: 'Siamês' })).toThrow(expect.objectContaining({ status: 400, fieldErrors: { nome: expect.any(String) } }));
  });
});
