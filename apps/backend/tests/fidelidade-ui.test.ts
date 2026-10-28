import { expect, it } from 'vitest';
import { cotacaoDaSelecao, chaveCotacao } from '../../frontend/src/lib/fidelidade';
it('descarta cotação de outra seleção ou pet e bloqueia preço sem seleção completa', () => {
  const a = chaveCotacao(1, 2, '2026-11-03T12:00Z', 3);
  const cotacao = { precoBase: 89.9, desconto: 89.9, precoContratado: 0, beneficioId: 1, elegivelFidelidade: true };
  const resposta = { chave: a, cotacao };
  expect(cotacaoDaSelecao(resposta, a)).toEqual(cotacao);
  expect(cotacaoDaSelecao(resposta, chaveCotacao(2, 2, '2026-11-03T12:00Z', 3))).toBeNull();
  expect(cotacaoDaSelecao(resposta, chaveCotacao(1, 2, '2026-11-03T13:00Z', 3))).toBeNull();
  expect(cotacaoDaSelecao(resposta, chaveCotacao(1, 2, '2026-11-03T12:00Z', 4))).toBeNull();
  expect(cotacaoDaSelecao(resposta, chaveCotacao(null, 2, '2026-11-03T12:00Z', 3))).toBeNull();
  expect(cotacaoDaSelecao(null, a)).toBeNull();
});
