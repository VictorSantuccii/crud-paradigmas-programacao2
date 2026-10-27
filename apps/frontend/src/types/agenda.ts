export type Categoria = 'BANHO_TOSA' | 'CONSULTA';
export type PetAgenda = { id: number; nome: string; especie: string; idade: number; raca: string | null };
export type Profissional = { id: number; nome: string; cargo: string };
export type ServicoAgenda = { id: number; nome: string; descricao: string | null; categoria: Categoria | null; preco: number | null; duracaoMin: number; ativo: boolean };
export type Slot = { data: string; inicio: string; fim: string; funcionario: Profissional; preco: number | null; duracaoMin: number };
export type Disponibilidade = { fuso: string; preco: number | null; duracaoMin: number; slots: Slot[] };
export type Agendamento = {
  id: number; animalId: number; servicoId: number; funcionarioId: number; dataHoraIni: string; dataHoraFim: string;
  status: 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO' | 'NAO_COMPARECEU'; observacoes: string | null;
  precoContratado: number | null; duracaoContratadaMin: number;
  animal: Pick<PetAgenda, 'id' | 'nome' | 'especie'>;
  servico: Pick<ServicoAgenda, 'id' | 'nome' | 'categoria'>; funcionario: Profissional;
  podeCancelar: boolean; podeReagendar: boolean;
};
export const estadosAgenda = { AGENDADO: 'Agendado', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', NAO_COMPARECEU: 'Não compareceu' };
