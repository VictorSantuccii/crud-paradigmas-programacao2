import { describe, expect, it } from 'vitest';
import { calcularSlots, configuracaoPadrao, validarConfiguracao, dataLocal, isoLocal } from '../src/lib/agenda';

const base = {
  configuracao: configuracaoPadrao,
  dataInicio: '2026-11-02', dataFim: '2026-11-08', duracaoMin: 45,
  profissionais: [{ id: 1, nome: 'Ana', cargo: 'Veterinária' }],
  ocupados: [], bloqueios: [], agora: new Date('2026-11-01T12:00:00Z'), antecedenciaHoras: 24,
};
describe('disponibilidade no fuso da operação', () => {
  it('respeita pausa, fechamento, fim de semana e duração não múltipla do slot', () => {
    const slots = calcularSlots(base);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.some(s => s.data === '2026-11-07' || s.data === '2026-11-08')).toBe(false);
    const segunda = slots.filter(s => s.data === '2026-11-02');
    expect(segunda[0].inicio).toBe('2026-11-02T09:00:00-03:00');
    expect(segunda[0].fim).toBe('2026-11-02T09:45:00-03:00');
    expect(segunda.some(s => /T(11:30|12:00|12:30|17:30)/.test(s.inicio))).toBe(false);
    expect(segunda.at(-1)?.inicio).toContain('T17:00');
  });
  it('aceita antecedência exata e exclui um milissegundo antes', () => {
    expect(calcularSlots({ ...base, agora: new Date('2026-11-01T12:00:00.001Z') })[0].inicio).toContain('T09:30');
  });
  it('considera bloqueios globais e por profissional e intervalos semiabertos', () => {
    const slots = calcularSlots({ ...base,
      profissionais: [...base.profissionais, { id: 2, nome: 'B', cargo: 'Vet' }],
      ocupados: [{ funcionarioId: 1, inicio: new Date('2026-11-02T12:00Z'), fim: new Date('2026-11-02T12:45Z') }],
      bloqueios: [{ funcionarioId: null, inicio: new Date('2026-11-02T16:00Z'), fim: new Date('2026-11-02T17:00Z') }, { funcionarioId: 2, inicio: new Date('2026-11-02T12:00Z'), fim: new Date('2026-11-02T12:30Z') }],
    });
    expect(slots.some(s => s.data === '2026-11-02' && s.inicio.includes('T09:00'))).toBe(false);
    expect(slots.some(s => s.funcionario.id === 2 && s.inicio === '2026-11-02T09:30:00-03:00')).toBe(true);
    expect(slots.some(s => s.inicio === '2026-11-02T13:30:00-03:00')).toBe(false);
    expect(slots.some(s => s.inicio === '2026-11-02T14:00:00-03:00')).toBe(true);
  });
  it('converte UTC e data local sem usar o fuso da máquina', () => {
    expect(dataLocal(new Date('2026-11-03T01:00Z'))).toBe('2026-11-02');
    expect(isoLocal(new Date('2026-11-03T01:00Z'))).toBe('2026-11-02T22:00:00-03:00');
  });
  it('preserva frações de segundo em durações históricas conhecidas', () => {
    const slot = calcularSlots({ ...base, duracaoMin: 45 + 123 / 60000 })[0];
    expect(slot.fim).toBe('2026-11-02T09:45:00.123-03:00');
  });
  it('valida expediente sem sobreposição e valores positivos', () => {
    expect(() => validarConfiguracao({ ...configuracaoPadrao, intervaloSlotMin: 0 })).toThrow();
    expect(() => validarConfiguracao({ ...configuracaoPadrao, intervalos: [{ diaSemana: 1, inicio: '09:00', fim: '13:00' }, { diaSemana: 1, inicio: '12:00', fim: '18:00' }] })).toThrow();
    expect(validarConfiguracao(configuracaoPadrao)).toEqual(configuracaoPadrao);
  });
});
