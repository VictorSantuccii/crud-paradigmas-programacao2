import { badRequest } from './errors';

export type IntervaloSemanal = { diaSemana: number; inicio: string; fim: string };
export type Configuracao = {
  fuso: string; intervaloSlotMin: number; antecedenciaCriacaoHoras: number;
  antecedenciaCancelamentoHoras: number; antecedenciaReagendamentoHoras: number;
  intervalos: IntervaloSemanal[];
};
export const configuracaoPadrao: Configuracao = {
  fuso: 'America/Sao_Paulo', intervaloSlotMin: 30, antecedenciaCriacaoHoras: 24,
  antecedenciaCancelamentoHoras: 24, antecedenciaReagendamentoHoras: 24,
  intervalos: [1, 2, 3, 4, 5].flatMap(diaSemana => [
    { diaSemana, inicio: '09:00', fim: '12:00' }, { diaSemana, inicio: '13:00', fim: '18:00' },
  ]),
};
export function objetoEstrito(body: unknown, campos: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('Envie um objeto JSON.');
  for (const campo of Object.keys(body)) if (!campos.includes(campo)) throw badRequest(`O campo ${campo} não é permitido.`, campo);
  return body as Record<string, unknown>;
}
const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
export function validarConfiguracao(body: unknown): Configuracao {
  const b = objetoEstrito(body, Object.keys(configuracaoPadrao));
  if (b.fuso !== 'America/Sao_Paulo') throw badRequest('O fuso deve ser America/Sao_Paulo.', 'fuso');
  for (const campo of ['intervaloSlotMin', 'antecedenciaCriacaoHoras', 'antecedenciaCancelamentoHoras', 'antecedenciaReagendamentoHoras']) {
    const valor = b[campo];
    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0 || valor > (campo === 'intervaloSlotMin' ? 1440 : 8760)) throw badRequest(`Valor inválido para ${campo}.`, campo);
  }
  if (!Array.isArray(b.intervalos) || b.intervalos.length > 100) throw badRequest('Envie intervalos semanais válidos.', 'intervalos');
  const intervalos = b.intervalos.map((item: unknown) => {
    const i = objetoEstrito(item, ['diaSemana', 'inicio', 'fim']);
    if (!Number.isInteger(i.diaSemana) || Number(i.diaSemana) < 0 || Number(i.diaSemana) > 6 ||
        typeof i.inicio !== 'string' || typeof i.fim !== 'string' ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(i.inicio) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(i.fim) || i.inicio >= i.fim) throw badRequest('Intervalo de expediente inválido.', 'intervalos');
    return i as IntervaloSemanal;
  }).sort((a, b) => a.diaSemana - b.diaSemana || a.inicio.localeCompare(b.inicio));
  if (intervalos.some((i, n) => n > 0 && intervalos[n - 1].diaSemana === i.diaSemana && intervalos[n - 1].fim > i.inicio)) throw badRequest('O expediente não pode ter sobreposição.', 'intervalos');
  return { ...b, intervalos } as Configuracao;
}
const formatador = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const partesLocais = (d: Date) => formatador.format(d).replace(' ', 'T');
export const dataLocal = (d: Date) => partesLocais(d).slice(0, 10);
const offsetMin = (d: Date) => Math.round((new Date(`${partesLocais(d)}Z`).getTime() - Math.floor(d.getTime() / 1000) * 1000) / 60000);
export function isoLocal(d: Date) {
  const offset = offsetMin(d);
  const fracao = d.getUTCMilliseconds() ? `.${String(d.getUTCMilliseconds()).padStart(3, '0')}` : '';
  return `${partesLocais(d)}${fracao}${offset < 0 ? '-' : '+'}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')}:${String(Math.abs(offset) % 60).padStart(2, '0')}`;
}
export function instanteLocal(dia: string, hora: string) {
  const utc = new Date(`${dia}T${hora}:00Z`);
  let local = utc;
  for (let n = 0; n < 3; n++) local = new Date(utc.getTime() - offsetMin(local) * 60000);
  return local;
}
export const somaDias = (dia: string, quantidade: number) => new Date(new Date(`${dia}T12:00Z`).getTime() + quantidade * 86400000).toISOString().slice(0, 10);
export type Profissional = { id: number; nome: string; cargo: string };
export type Periodo = { inicio: Date; fim: Date; funcionarioId: number | null };
export type Slot = { data: string; inicio: string; fim: string; funcionario: Profissional };
export function calcularSlots({ configuracao, dataInicio, dataFim, duracaoMin, profissionais, ocupados, bloqueios, agora, antecedenciaHoras }: {
  configuracao: Configuracao; dataInicio: string; dataFim: string; duracaoMin: number; profissionais: Profissional[];
  ocupados: Periodo[]; bloqueios: Periodo[]; agora: Date; antecedenciaHoras: number;
}): Slot[] {
  const slots: Slot[] = [];
  if (!(duracaoMin > 0) || !(configuracao.intervaloSlotMin > 0)) return slots;
  const limite = agora.getTime() + antecedenciaHoras * 3600000;
  for (let dia = dataInicio; dia <= dataFim; dia = somaDias(dia, 1)) {
    const semana = new Date(`${dia}T12:00Z`).getUTCDay();
    for (const intervalo of configuracao.intervalos.filter(i => i.diaSemana === semana)) {
      for (let minuto = minutos(intervalo.inicio); minuto + duracaoMin <= minutos(intervalo.fim); minuto += configuracao.intervaloSlotMin) {
        const inicio = instanteLocal(dia, `${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`);
        const fim = new Date(inicio.getTime() + duracaoMin * 60000);
        if (inicio.getTime() < limite || inicio <= agora) continue;
        for (const funcionario of profissionais) {
          const conflito = [...ocupados, ...bloqueios].some(p => (p.funcionarioId === null || p.funcionarioId === funcionario.id) && inicio < p.fim && fim > p.inicio);
          if (!conflito) slots.push({ data: dia, inicio: isoLocal(inicio), fim: isoLocal(fim), funcionario });
        }
      }
    }
  }
  return slots;
}
