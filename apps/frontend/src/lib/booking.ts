export const dataDaOperacao = (agora = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(agora);
export const diasDoMes = (mes: string) => {
  const [ano, numero] = mes.split('-').map(Number);
  return { vazios: new Date(Date.UTC(ano, numero - 1, 1)).getUTCDay(), dias: new Date(Date.UTC(ano, numero, 0)).getUTCDate() };
};
export const mesSeguinte = (mes: string, delta: number) => {
  const [ano, numero] = mes.split('-').map(Number);
  return new Date(Date.UTC(ano, numero - 1 + delta, 1)).toISOString().slice(0, 7);
};
export const chaveSlot = (slot: { inicio: string; funcionario: { id: number } }) => `${slot.inicio}/${slot.funcionario.id}`;
export const moeda = (preco: number | null) => preco === null ? 'Valor histórico não registrado' : preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dataHoraFormatada = (data: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(data));
export const horaFormatada = (data: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(data));
