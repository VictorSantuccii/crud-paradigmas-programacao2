import { useCallback, useEffect, useState } from 'react';
import { usePrivateApi } from '@/auth/usePrivateApi';
import { mensagemErro } from '@/lib/api';
import type { Fidelidade } from '@/types/agenda';
export function useFidelidade() {
  const request = usePrivateApi();
  const [dados, setDados] = useState<Fidelidade | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao(v => v + 1), []);
  useEffect(() => {
    window.addEventListener('fidelidade:atualizada', recarregar);
    window.addEventListener('focus', recarregar);
    return () => { window.removeEventListener('fidelidade:atualizada', recarregar); window.removeEventListener('focus', recarregar); };
  }, [recarregar]);
  useEffect(() => {
    const controller = new AbortController(), signal = controller.signal;
    setLoading(true); setError('');
    void request<Fidelidade>('/fidelidades/me', { signal }).then(data => { if (!signal.aborted) setDados(data); })
      .catch(error => { if (!signal.aborted) { setDados(null); setError(mensagemErro(error)); } })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [request, versao]);
  return { dados, loading, error, recarregar };
}
