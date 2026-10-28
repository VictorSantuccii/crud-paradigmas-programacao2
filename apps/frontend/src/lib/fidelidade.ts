import type { Cotacao } from '../types/agenda';
export const chaveCotacao = (pet: number | null, servico: number | null, inicio?: string, profissional?: number) => pet && servico && inicio && profissional ? `${pet}/${servico}/${inicio}/${profissional}` : '';
export const cotacaoDaSelecao = (resposta: { chave: string; cotacao: Cotacao } | null, chave: string) => chave && resposta?.chave === chave ? resposta.cotacao : null;
export const atualizarFidelidade = () => window.dispatchEvent(new Event('fidelidade:atualizada'));
export const textoBeneficio = (situacao: string | null) => situacao === 'DEVOLVIDO' ? 'Benefício devolvido' : situacao === 'CONSUMIDO' ? 'Benefício consumido' : situacao === 'RESERVADO' ? 'Benefício reservado' : '';
