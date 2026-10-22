import { dadosContato } from '@/auth/profile-data';
import { useAuth } from '@/auth/useAuth';
import { usePrivateApi } from '@/auth/usePrivateApi';
import type { Usuario } from '@/auth/types';
import { recuperarDestino } from '@/auth/destination';
import { ProfileFields } from '@/components/auth/ProfileFields';
import { Field } from '@/components/forms/Field';
import { FormErrors } from '@/components/forms/FormErrors';
import { formFailure, validarFormulario, type FormFailure } from '@/lib/form-validation';
import { api, ApiError, mensagemErro } from '@/lib/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
export function GoogleCpfPage() {
  const { usuario, carregando, erroSessao, recarregarUsuario, atualizarUsuario } = useAuth();
  const privateApi = usePrivateApi();
  const location = useLocation();
  const navigate = useNavigate();
  const [identidade, setIdentidade] = useState<{ nome: string; email: string } | null>(null);
  const [erroCarga, setErroCarga] = useState('');
  const [expirado, setExpirado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [failure, setFailure] = useState<FormFailure | null>(null);
  const [salvando, setSalvando] = useState(false);
  const from = (location.state as { from?: string } | null)?.from;
  useEffect(() => {
    if (carregando || usuario || erroSessao) return;
    const controller = new AbortController();
    api<{ nome: string; email: string }>('/auth/onboarding', { signal: controller.signal }).then(setIdentidade).catch(error => {
      if (!controller.signal.aborted) { setErroCarga(mensagemErro(error)); setExpirado(error instanceof ApiError && error.status === 401); }
    });
    return () => controller.abort();
  }, [carregando, usuario, erroSessao, tentativa]);
  const incluirCpf = !usuario || usuario.camposPendentes.includes('cpf');
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (salvando) return;
    const invalid = validarFormulario(event.currentTarget);
    if (invalid) { setFailure(invalid); return; }
    const form = new FormData(event.currentTarget);
    setSalvando(true); setFailure(null);
    try {
      const body = { ...dadosContato(form, usuario?.enderecos[0]?.id), ...(incluirCpf ? { cpf: form.get('cpf') } : {}), ...(usuario ? { nome: form.get('nome'), email: form.get('email') } : {}) };
      const payload = await (usuario ? privateApi : api)<{ usuario: Usuario }>(`/auth/${usuario ? 'me' : 'onboarding'}`, { method: 'PUT', body });
      atualizarUsuario(payload.usuario);
      if (!payload.usuario.perfilCompleto) throw new Error('Preencha todos os dados obrigatórios para continuar.');
      navigate(recuperarDestino(from), { replace: true, state: { notice: 'Cadastro atualizado com sucesso.' } }); sessionStorage.removeItem('petexpress-destino');
    } catch (error) { setFailure(formFailure(error)); } finally { setSalvando(false); }
  }
  const pronto = !carregando && !erroSessao && (usuario || identidade);
  return <main className="min-h-screen bg-surface-container-low px-margin-mobile py-10 md:px-margin-desktop"><section className="mx-auto w-full max-w-lg rounded-2xl bg-surface-container-lowest p-7 text-on-surface shadow-xl sm:p-10">
    <Link to="/" className="mb-8 inline-block font-headline-md font-bold text-primary">PetExpress</Link><h1 className="font-headline-lg text-3xl font-bold">Conclua seu cadastro</h1><p className="mt-2 text-on-surface-variant">Confirme seus dados de contato e endereço para acessar sua área de tutor.</p>
    {!pronto && !erroCarga && !erroSessao && <p role="status" className="mt-6">Carregando cadastro…</p>}
    {(erroCarga || erroSessao) && <div className="mt-6"><p role="alert">{erroSessao || erroCarga}</p>{!expirado && <button type="button" className="mt-3 text-primary underline" onClick={() => { setErroCarga(''); if (erroSessao) void recarregarUsuario().catch(() => undefined); else setTentativa(value => value + 1); }}>Tentar novamente</button>}</div>}
    {pronto && <form id="onboarding-form" noValidate onSubmit={enviar} className="mt-8 space-y-5" aria-busy={salvando}><FormErrors failure={failure} formId="onboarding-form" /><fieldset disabled={salvando} className="space-y-4"><legend className="sr-only">Dados para concluir cadastro</legend>
      {usuario ? <><Field name="nome" label="Nome completo" autoComplete="name" required defaultValue={usuario.nome} errors={failure?.fields} /><Field name="email" label="E-mail" type="email" required defaultValue={usuario.email || ''} errors={failure?.fields} /></> : <p className="text-sm text-on-surface-variant">{identidade?.nome} · {identidade?.email}</p>}
      <ProfileFields usuario={usuario} incluirCpf={incluirCpf} errors={failure?.fields} />
      <button disabled={salvando} className="w-full rounded-full bg-primary px-5 py-3.5 font-bold text-on-primary disabled:opacity-60">{salvando ? 'Salvando…' : 'Concluir cadastro'}</button>
    </fieldset></form>}
    <Link to="/login" state={{ from: recuperarDestino(from) }} className="mt-6 inline-block text-primary underline">Voltar ao acesso</Link>
  </section></main>;
}
