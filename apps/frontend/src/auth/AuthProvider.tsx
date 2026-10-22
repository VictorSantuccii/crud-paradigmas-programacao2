import { AuthContext } from '@/auth/auth-context';
import type { Usuario } from '@/auth/types';
import { api, ApiError, mensagemErro } from '@/lib/api';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroSessao, setErroSessao] = useState('');
  const versao = useRef(0);
  const recarregarUsuario = useCallback(async (signal?: AbortSignal) => {
    const atual = ++versao.current;
    try {
      const payload = await api<{ usuario: Usuario }>('/auth/me', { signal });
      if (!signal?.aborted && atual === versao.current) { setUsuario(payload.usuario); setErroSessao(''); }
      return payload.usuario;
    } catch (error) {
      if (signal?.aborted || atual !== versao.current) throw error;
      if (error instanceof ApiError && error.status === 401) {
        setUsuario(null); setErroSessao(''); return null;
      }
      setErroSessao(mensagemErro(error)); throw error;
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void recarregarUsuario(controller.signal).catch(() => undefined).finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [recarregarUsuario]);
  const atualizarUsuario = useCallback((atual: Usuario | null) => {
    ++versao.current; setUsuario(atual); setErroSessao('');
  }, []);
  const valor = useMemo(() => ({ usuario, carregando, erroSessao, atualizarUsuario, recarregarUsuario }), [usuario, carregando, erroSessao, atualizarUsuario, recarregarUsuario]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
