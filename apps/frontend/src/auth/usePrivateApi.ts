import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { guardarDestino } from './destination';
import { api, ApiError } from '@/lib/api';
export function usePrivateApi() {
  const { atualizarUsuario, recarregarUsuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.pathname + location.search + location.hash;
  return useCallback(async <T,>(...args: Parameters<typeof api>): Promise<T> => {
    try { return await api<T>(...args); } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          atualizarUsuario(null);
          navigate('/login', { replace: true, state: { from: guardarDestino(from) } });
        }
        if (error.code === 'PERFIL_INCOMPLETO') {
          const current = await recarregarUsuario();
          navigate(current ? '/cadastro/google/cpf' : '/login', { replace: true, state: { from: guardarDestino(from) } });
        }
      }
      throw error;
    }
  }, [atualizarUsuario, recarregarUsuario, navigate, from]);
}
