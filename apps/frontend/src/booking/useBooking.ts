import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePrivateApi } from '@/auth/usePrivateApi';
import { ApiError, mensagemErro } from '@/lib/api';
import { chaveSlot, dataDaOperacao, diasDoMes } from '@/lib/booking';
import type { Agendamento, Categoria, Disponibilidade, PetAgenda, Profissional, ServicoAgenda } from '@/types/agenda';

export function useBooking(categoria: Categoria) {
  const request = usePrivateApi();
  const [params] = useSearchParams();
  const reagendarId = params.get('reagendar');
  const [pets, setPets] = useState<PetAgenda[]>([]);
  const [servicos, setServicos] = useState<ServicoAgenda[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [original, setOriginal] = useState<Agendamento | null>(null);
  const [petId, setPetId] = useState<number | null>(null);
  const [servicoId, setServicoId] = useState<number | null>(null);
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null);
  const [mes, setMes] = useState(() => dataDaOperacao().slice(0, 7));
  const [dia, setDia] = useState('');
  const [horario, setHorario] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [horariosLoading, setHorariosLoading] = useState(false), [horariosError, setHorariosError] = useState('');
  const [profissionaisLoading, setProfissionaisLoading] = useState(false), [profissionaisError, setProfissionaisError] = useState('');
  const [pending, setPending] = useState(false), [submitError, setSubmitError] = useState('');
  const [sucesso, setSucesso] = useState<Agendamento | null>(null);
  const [tentativa, setTentativa] = useState(0), [versaoHorarios, setVersaoHorarios] = useState(0), [versaoProfissionais, setVersaoProfissionais] = useState(0);
  const enviando = useRef(false);

  useEffect(() => {
    const controller = new AbortController(); const signal = controller.signal;
    setLoading(true); setError(''); setOriginal(null); setSucesso(null);
    void (async () => {
      try {
        if (reagendarId && !/^[1-9]\d*$/.test(reagendarId)) throw new Error('Agendamento inválido.');
        const [animais, catalogo, atual] = await Promise.all([
          request<PetAgenda[]>('/animais', { signal }), request<ServicoAgenda[]>(`/servicos?categoria=${categoria}`, { signal }),
          reagendarId ? request<Agendamento>(`/agendamentos/${reagendarId}`, { signal }) : Promise.resolve(null),
        ]);
        if (signal.aborted) return;
        if (atual && (atual.servico.categoria !== categoria || atual.status !== 'AGENDADO')) throw new Error('Este agendamento não pode ser reagendado nesta tela.');
        setPets(animais); setOriginal(atual);
        setServicos(atual && !catalogo.some(s => s.id === atual.servicoId) ? [...catalogo, { ...atual.servico, descricao: null, preco: atual.precoContratado, duracaoMin: atual.duracaoContratadaMin, ativo: false }] : catalogo);
        setPetId(atual?.animalId ?? null); setServicoId(atual?.servicoId ?? null);
        setFuncionarioId(atual?.funcionarioId ?? null); setObservacoes(atual?.observacoes ?? '');
        setDia(''); setHorario(''); setDisponibilidade(null);
      } catch (error) { if (!signal.aborted) setError(mensagemErro(error)); }
      finally { if (!signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [request, categoria, reagendarId, tentativa]);

  useEffect(() => {
    const controller = new AbortController(); const signal = controller.signal;
    setProfissionais([]); setProfissionaisError('');
    if (!servicoId || loading || error) return () => controller.abort();
    setProfissionaisLoading(true);
    void request<Profissional[]>(`/servicos/${servicoId}/profissionais`, { signal }).then(data => {
      if (!signal.aborted) { setProfissionais(data); setFuncionarioId(current => current && data.some(p => p.id === current) ? current : null); }
    }).catch(error => { if (!signal.aborted) setProfissionaisError(mensagemErro(error)); }).finally(() => { if (!signal.aborted) setProfissionaisLoading(false); });
    return () => controller.abort();
  }, [request, servicoId, loading, error, versaoProfissionais]);

  const filtroProfissional = categoria === 'CONSULTA' ? funcionarioId : null;
  useEffect(() => {
    const controller = new AbortController(); const signal = controller.signal;
    setDisponibilidade(null); setHorariosError('');
    if (!servicoId || loading || error) return () => controller.abort();
    setHorariosLoading(true);
    const query = new URLSearchParams({ dataInicio: `${mes}-01`, dataFim: `${mes}-${diasDoMes(mes).dias}`, ...(filtroProfissional ? { funcionarioId: String(filtroProfissional) } : {}) });
    const url = original ? `/agendamentos/${original.id}/disponibilidade?${query}` : `/disponibilidade?${query}&servicoId=${servicoId}`;
    void request<Disponibilidade>(url, { signal }).then(data => {
      if (signal.aborted) return;
      setDisponibilidade(data);
      setHorario(current => data.slots.some(s => chaveSlot(s) === current) ? current : '');
    }).catch(error => { if (!signal.aborted) setHorariosError(mensagemErro(error)); }).finally(() => { if (!signal.aborted) setHorariosLoading(false); });
    return () => controller.abort();
  }, [request, servicoId, filtroProfissional, mes, original, versaoHorarios, loading, error]);

  const trocarServico = (id: number) => { if (original || pending) return; setServicoId(id); setFuncionarioId(null); setDia(''); setHorario(''); setDisponibilidade(null); setSubmitError(''); };
  const trocarProfissional = (id: number | null) => { setFuncionarioId(id); setHorario(''); setDisponibilidade(null); setSubmitError(''); };
  const trocarMes = (novo: string) => { setMes(novo); setDia(''); setHorario(''); setDisponibilidade(null); setSubmitError(''); };
  const trocarDia = (novo: string) => { setDia(novo); setHorario(''); setSubmitError(''); };
  const selecionarHorario = (valor: string) => {
    setHorario(valor); setSubmitError('');
    if (categoria === 'BANHO_TOSA') {
      const profissional = disponibilidade?.slots.find(s => chaveSlot(s) === valor)?.funcionario;
      if (profissional) setFuncionarioId(profissional.id);
    }
  };
  const slot = disponibilidade?.slots.find(s => chaveSlot(s) === horario && s.data === dia);
  const pet = pets.find(p => p.id === petId), servico = servicos.find(s => s.id === servicoId);
  const refreshHorarios = useCallback(() => setVersaoHorarios(v => v + 1), []);
  async function confirmar() {
    if (enviando.current || !pet || !servico || !slot || horariosLoading || sucesso) return;
    enviando.current = true; setPending(true); setSubmitError('');
    try {
      const body = original ? { funcionarioId: slot.funcionario.id, dataHoraIni: slot.inicio, observacoes: observacoes.trim() || null } : { animalId: pet.id, servicoId: servico.id, funcionarioId: slot.funcionario.id, dataHoraIni: slot.inicio, ...(categoria === 'CONSULTA' ? { observacoes: observacoes.trim() || null } : {}) };
      const r = await request<Agendamento>(original ? `/agendamentos/${original.id}` : '/agendamentos', { method: original ? 'PUT' : 'POST', body });
      setSucesso(r);
    } catch (error) {
      setSubmitError(mensagemErro(error));
      if (error instanceof ApiError && error.status === 409) { setHorario(''); refreshHorarios(); }
    } finally { enviando.current = false; setPending(false); }
  }
  return { pets, servicos, profissionais, original, reagendando: !!reagendarId, petId, servicoId, funcionarioId, mes, dia, horario, observacoes, disponibilidade, pet, servico, slot, loading, error, horariosLoading, horariosError, profissionaisLoading, profissionaisError, pending, submitError, sucesso,
    trocarServico, trocarProfissional, trocarMes, trocarDia, setHorario: selecionarHorario, setObservacoes, setPetId, confirmar, refreshHorarios,
    retry: () => setTentativa(v => v + 1), retryProfissionais: () => setVersaoProfissionais(v => v + 1),
  };
}
export type Booking = ReturnType<typeof useBooking>;
