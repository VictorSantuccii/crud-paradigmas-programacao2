import { forbidden, unauthorized } from './errors';
import type { UsuarioPublico } from '../services/authService';
export type Contexto = UsuarioPublico;
export type Recurso = 'usuario' | 'endereco' | 'animal' | 'agendamento' | 'fidelidade' | 'funcionario' | 'plano' | 'assinatura' | 'servico';
export const autorizar = (recurso: Recurso, leitura: boolean, ctx?: Contexto) => {
  if (recurso === 'servico' && leitura) return;
  if (!ctx) throw unauthorized('Sessão necessária.');
  if (ctx.role === 'ADMIN') return;
  if (ctx.role === 'CLIENTE' && (['endereco', 'animal', 'agendamento'].includes(recurso) || recurso === 'fidelidade' && leitura)) return;
  if (ctx.role === 'FUNCIONARIO' && ctx.funcionarioId && leitura && ['agendamento', 'funcionario'].includes(recurso)) return;
  throw forbidden();
};
export const escopo = (recurso: Recurso, ctx?: Contexto): { usuarioId?: number; id?: number; funcionarioId?: number } => {
  autorizar(recurso, true, ctx);
  if (!ctx || ctx.role === 'ADMIN' || recurso === 'servico') return {};
  if (recurso === 'fidelidade') return { id: ctx.fidelidadeId };
  if (recurso === 'funcionario') return { id: ctx.funcionarioId! };
  if (ctx.role === 'FUNCIONARIO') return { funcionarioId: ctx.funcionarioId! };
  return { usuarioId: ctx.id };
};
export const dono = (body: unknown, ctx?: Contexto) => {
  if (!ctx || ctx.role !== 'CLIENTE' || !body || typeof body !== 'object' || Array.isArray(body)) return body;
  const b = body as Record<string, unknown>;
  if ('usuarioId' in b && b.usuarioId !== ctx.id) throw forbidden('Não é permitido trocar o titular.');
  return { ...b, usuarioId: ctx.id };
};
