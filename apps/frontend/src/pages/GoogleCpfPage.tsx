import { dadosContato } from "@/auth/profile-data";
import { useAuth } from '@/auth/useAuth';
import type { Usuario } from '@/auth/types';
import { recuperarDestino } from '@/auth/destination';
import { ProfileFields } from '@/components/auth/ProfileFields';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
const api = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function GoogleCpfPage() {
  const { usuario, carregando, atualizarUsuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [identidade, setIdentidade] = useState<{ nome: string; email: string } | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const from = (location.state as { from?: string } | null)?.from;
  useEffect(() => {
    if (carregando || usuario) return;
    const controller = new AbortController();
    fetch(`${api}/auth/onboarding`, { credentials: 'include', signal: controller.signal }).then(async res => {
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'Sessão expirada. Entre novamente.');
      setIdentidade(payload);
    }).catch(error => { if (!controller.signal.aborted) setErro(error instanceof Error ? error.message : 'Falha de rede. Tente novamente.'); });
    return () => controller.abort();
  }, [carregando, usuario]);
  const incluirCpf = !usuario || usuario.camposPendentes.includes('cpf');
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;
    const form = new FormData(event.currentTarget);
    setSalvando(true); setErro('');
    try {
      const body = { ...dadosContato(form, usuario?.enderecos[0]?.id), ...(incluirCpf ? { cpf: form.get('cpf') } : {}), ...(usuario ? { nome: form.get('nome'), email: form.get('email') } : {}) };
      const res = await fetch(`${api}/auth/${usuario ? 'me' : 'onboarding'}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await res.json() as { usuario?: Usuario; message?: string };
      if (!res.ok || !payload.usuario) throw new Error(payload.message || 'Não foi possível salvar o perfil.');
      atualizarUsuario(payload.usuario);
      if (!payload.usuario.perfilCompleto) throw new Error('Preencha todos os dados obrigatórios para continuar.');
      navigate(recuperarDestino(from), { replace: true });
      sessionStorage.removeItem('petexpress-destino');
    } catch (error) { setErro(error instanceof Error ? error.message : 'Falha de rede. Tente novamente.'); } finally { setSalvando(false); }
  }
  const pronto = !carregando && (usuario || identidade);
  return <main className="min-h-screen bg-surface-container-low px-margin-mobile py-10 md:px-margin-desktop">
    <section className="mx-auto w-full max-w-lg rounded-2xl bg-surface-container-lowest p-7 text-on-surface shadow-xl sm:p-10">
      <Link to="/" className="mb-8 inline-block font-headline-md font-bold text-primary">PetExpress</Link>
      <h1 className="font-headline-lg text-3xl font-bold">Conclua seu cadastro</h1>
      <p className="mt-2 text-on-surface-variant">Confirme seus dados de contato e endereço para acessar sua área de tutor.</p>
      {!pronto && !erro && <p role="status" className="mt-6">Carregando cadastro…</p>}
      {pronto && <form onSubmit={enviar} className="mt-8 space-y-5">
        {usuario ? <>
          <div><label htmlFor="nome" className="mb-1 block">Nome completo</label><input id="nome" name="nome" required defaultValue={usuario.nome} className="w-full rounded-lg p-3 ring-1 ring-outline-variant focus:ring-2 focus:ring-primary" /></div>
          <div><label htmlFor="email" className="mb-1 block">E-mail</label><input id="email" name="email" type="email" required defaultValue={usuario.email || ''} className="w-full rounded-lg p-3 ring-1 ring-outline-variant focus:ring-2 focus:ring-primary" /></div>
        </> : <p className="text-sm text-on-surface-variant">{identidade?.nome} · {identidade?.email}</p>}
        <ProfileFields usuario={usuario} incluirCpf={incluirCpf} />
        <button disabled={salvando} className="w-full rounded-full bg-primary px-5 py-3.5 font-bold text-on-primary disabled:opacity-60">{salvando ? 'Salvando…' : 'Concluir cadastro'}</button>
      </form>}
      {erro && <p role="alert" className="mt-4 rounded-lg bg-error-container p-3 text-on-error-container">{erro}</p>}
      <Link to="/login" className="mt-6 inline-block text-primary underline">Voltar ao acesso</Link>
    </section>
  </main>;
}
