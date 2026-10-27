import { expect, it } from 'vitest';
import { diasDoMes, mesSeguinte, dataDaOperacao, chaveSlot } from '../../frontend/src/lib/booking';
it('alinha novembro e fevereiro e navega na virada de ano', () => {
  expect(diasDoMes('2026-11')).toMatchObject({ vazios: 0, dias: 30 });
  expect(diasDoMes('2028-02')).toMatchObject({ vazios: 2, dias: 29 });
  expect(mesSeguinte('2026-12', 1)).toBe('2027-01');
  expect(mesSeguinte('2026-01', -1)).toBe('2025-12');
});
it('define data no fuso da operação e distingue profissionais no mesmo horário', () => {
  expect(dataDaOperacao(new Date('2026-11-03T01:00Z'))).toBe('2026-11-02');
  expect(chaveSlot({ inicio: '2026-11-03T09:00:00-03:00', funcionario: { id: 1 } })).not.toBe(chaveSlot({ inicio: '2026-11-03T09:00:00-03:00', funcionario: { id: 2 } }));
});
