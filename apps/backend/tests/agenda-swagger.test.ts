import { expect, it } from 'vitest';
import { swaggerSpec } from '../src/config/swagger';
it('documenta reserva estrita, reagendamento, transição substituta do DELETE e rotas públicas', () => {
  const spec = swaggerSpec as unknown as { paths: Record<string, Record<string, { security?: unknown[]; parameters?: unknown[] }>>; components: { schemas: Record<string, { properties: Record<string, unknown> }> } };
  expect(spec.paths['/agendamentos/{id}'].delete).toBeUndefined();
  expect(spec.paths['/agendamentos/{id}/status'].patch).toBeTruthy();
  expect(spec.paths['/agendamentos/{id}/disponibilidade'].get).toBeTruthy();
  expect(spec.paths['/disponibilidade'].get.security).toEqual([]);
  expect(spec.paths['/servicos/{id}/profissionais'].get.security).toEqual([]);
  const input = spec.components.schemas.AgendamentoInput.properties;
  expect(Object.keys(input).sort()).toEqual(['animalId', 'cotacaoEsperada', 'dataHoraIni', 'funcionarioId', 'observacoes', 'servicoId']);
  expect(Object.keys(spec.components.schemas.AgendamentoUpdate.properties).sort()).toEqual(['dataHoraIni', 'funcionarioId', 'observacoes']);
});
