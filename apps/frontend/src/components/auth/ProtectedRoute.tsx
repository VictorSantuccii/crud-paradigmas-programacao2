import { useAuth } from '@/auth/useAuth';
import { guardarDestino } from '@/auth/destination';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando, erroSessao, recarregarUsuario } = useAuth();
  const location = useLocation();
  const from = location.pathname + location.search + location.hash;
  if (carregando) return <main className="p-10" role="status">Carregando sessão…</main>;
  if (!usuario && erroSessao) return <main className="mx-auto max-w-lg p-10"><p role="alert">{erroSessao}</p><button type="button" onClick={() => void recarregarUsuario().catch(() => undefined)} className="mt-4 rounded-full bg-primary px-5 py-3 text-on-primary">Tentar novamente</button></main>;
  if (!usuario) return <Navigate to="/login" replace state={{ from }} />;
  if (usuario.role === 'CLIENTE' && !usuario.perfilCompleto) return <Navigate to="/cadastro/google/cpf" replace state={{ from: guardarDestino(from) }} />;
  return children;
}
