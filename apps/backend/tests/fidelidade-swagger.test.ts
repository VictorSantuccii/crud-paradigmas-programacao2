import { expect, it } from 'vitest';
import { swaggerSpec } from '../src/config/swagger';
it('documenta prévia, cotação esperada, saldo próprio e ajuste exclusivo; elimina mutações genéricas', () => {
  const spec = swaggerSpec as unknown as { paths: Record<string, Record<string, unknown>>; components: { schemas: Record<string, { properties: Record<string, unknown> }> } };
  expect(spec.paths['/fidelidades/me']?.get).toBeTruthy();
  expect(spec.paths['/fidelidades/{id}/ajustes']?.post).toBeTruthy();
  expect(spec.paths['/agendamentos/previa']?.post).toBeTruthy();
  expect(spec.paths['/fidelidades']?.post).toBeUndefined();
  expect(spec.paths['/fidelidades/{id}']?.put).toBeUndefined();
  expect(spec.paths['/fidelidades/{id}']?.delete).toBeUndefined();
  expect(spec.components.schemas.AgendamentoInput.properties.cotacaoEsperada).toBeTruthy();
  expect(spec.components.schemas.Agendamento.properties.precoBase).toBeTruthy();
  expect(spec.components.schemas.ServicoInput.properties.elegivelFidelidade).toBeTruthy();
});
