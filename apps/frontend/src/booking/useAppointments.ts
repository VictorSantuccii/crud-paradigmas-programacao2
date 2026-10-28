import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrivateApi } from '@/auth/usePrivateApi';
import { atualizarFidelidade } from '@/lib/fidelidade';
import { mensagemErro } from '@/lib/api';
import type { Agendamento } from '@/types/agenda';
export function useAppointments() {
  const request = usePrivateApi();
  const [itens, setItens] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [pending, setPending] = useState<number | null>(null), [notice, setNotice] = useState('');
  const cancelando = useRef(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try { const data = await request<Agendamento[]>('/agendamentos', { signal }); if (!signal?.aborted) setItens(data); }
    catch (error) { if (!signal?.aborted) setError(mensagemErro(error)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [request]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  async function cancelar(id: number, motivo: string) {
    if (cancelando.current) return;
    cancelando.current = true; setPending(id); setError(''); setNotice('');
    try {
      await request(`/agendamentos/${id}/status`, { method: 'PATCH', body: { status: 'CANCELADO', motivo: motivo.trim() || null } });
      atualizarFidelidade(); setNotice('Agendamento cancelado.'); await load();
    } catch (error) { setError(mensagemErro(error)); }
    finally { cancelando.current = false; setPending(null); }
  }
  return { itens, loading, error, pending, notice, load, cancelar };
}
