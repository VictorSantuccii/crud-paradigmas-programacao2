import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAppointments } from '@/booking/useAppointments';
import { AgendaSection } from '@/components/profile/AgendaSection';
import { dataHoraFormatada } from '@/lib/booking';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { PageShell } from '@/components/layout/PageShell';
import { Icon } from '@/components/ui/Icon';
import { PersonalSection } from '@/components/profile/PersonalSection';
import { AddressesSection } from '@/components/profile/AddressesSection';
import { PetsSection } from '@/components/profile/PetsSection';
import { secondaryClass } from '@/components/profile/ProfileUi';
import { mensagemErro } from '@/lib/api';

const tabs = [
  { id: 'geral', label: 'Visão Geral & Dados', icon: 'dashboard', target: 'resumo' },
  { id: 'pets', label: 'Meus Pets & Carteirinhas', icon: 'pets', target: 'pets' },
  { id: 'agenda', label: 'Agenda & Histórico', icon: 'calendar_month', target: 'agenda' },
  { id: 'dados', label: 'Dados Pessoais', icon: 'person', target: 'dados-pessoais' },
  { id: 'enderecos', label: 'Endereços', icon: 'home_pin', target: 'enderecos' },
];

function Panel({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rounded-xl bg-surface-container-lowest p-5 shadow-sm ${className}`}>{children}</section>;
}

export function MeusPetsPage() {
  const { usuario, recarregarUsuario } = useAuth();
  const location = useLocation();
  const agenda = useAppointments();
  const proximaConsulta = agenda.itens.find(i => i.status === 'AGENDADO' && i.servico.categoria === 'CONSULTA' && new Date(i.dataHoraIni).getTime() > Date.now());
  const pageNotice = (location.state as { notice?: string } | null)?.notice;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('geral');
  const [petCount, setPetCount] = useState<number | null>(null);
  const enderecoPrincipal = usuario?.enderecos[0];
  const onPetCountChange = useCallback((count: number) => setPetCount(count), []);

  useEffect(() => {
    let active = true;
    void recarregarUsuario().catch(error => { if (active) setError(mensagemErro(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [recarregarUsuario]);

  useEffect(() => { if (!loading && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' }); }, [loading, location.hash]);

  async function retry() {
    setLoading(true); setError('');
    try { await recarregarUsuario(); } catch (error) { setError(mensagemErro(error)); }
    finally { setLoading(false); }
  }

  function goToTab(id: string, target: string) {
    setActiveTab(id);
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return <PageShell><main className="text-on-surface">
    <section className="relative overflow-hidden bg-gradient-to-r from-primary-fixed via-surface-container to-surface-container-high px-margin-mobile py-10 md:px-margin-desktop">
      <div className="mx-auto flex max-w-container-max flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-surface-container-lowest text-primary shadow-md">{usuario?.fotoURL ? <img src={usuario.fotoURL} alt={`Foto de ${usuario.nome}`} referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <span aria-label={`Foto de ${usuario?.nome ?? 'usuário'}`} className="font-headline-lg text-4xl font-bold">{usuario?.nome.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?'}</span>}</div><span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-tertiary text-on-tertiary"><Icon name="verified" className="text-sm" /></span></div>
          <div><div className="flex flex-wrap items-center gap-3"><h1 className="font-headline-lg text-3xl font-bold tracking-tight text-on-surface">{usuario?.nome || 'Meu perfil'}</h1><span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed-dim px-3 py-1 text-sm font-semibold text-on-primary-fixed-variant"><Icon name="stars" filled />Tutor PetExpress</span></div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-on-surface-variant"><span className="flex items-center gap-1"><Icon name="mail" className="text-primary" />{usuario?.email || 'E-mail não informado'}</span><span className="flex items-center gap-1"><Icon name="phone_iphone" className="text-primary" />{usuario?.telefone || 'Telefone não informado'}</span><span className="flex items-center gap-1"><Icon name="location_on" className="text-primary" />{enderecoPrincipal ? `${enderecoPrincipal.bairro}, ${enderecoPrincipal.cep}` : 'Endereço não informado'}</span></div>
          </div>
        </div>
        <button type="button" onClick={() => goToTab('dados', 'dados-pessoais')} className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 font-label-md font-bold text-primary shadow-sm transition hover:bg-surface-container-low"><Icon name="edit" />Editar Perfil</button>
      </div>
    </section>

    <div className="mx-auto flex w-full max-w-container-max flex-col gap-8 px-margin-mobile py-8 md:px-margin-desktop">
      {pageNotice && <p role="status" className="rounded-xl bg-tertiary-fixed p-4 text-sm text-on-tertiary-fixed-variant">{pageNotice}</p>}
      {loading && <p role="status" className="rounded-xl bg-surface-container-lowest p-4 text-sm">Carregando dados do perfil…</p>}
      {error && <div className="rounded-xl bg-error-container p-4 text-sm text-on-error-container"><p role="alert">{error}</p><button type="button" onClick={() => void retry()} className={`${secondaryClass} mt-3`}>Tentar novamente</button></div>}
      <nav aria-label="Seções do perfil" className="flex items-center gap-2 overflow-x-auto pb-2">{tabs.map(tab => <button key={tab.id} type="button" onClick={() => goToTab(tab.id, tab.target)} aria-current={activeTab === tab.id ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-6 py-3 font-label-md transition-colors ${activeTab === tab.id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}><Icon name={tab.icon} />{tab.label}</button>)}</nav>

      <section id="resumo" aria-label="Resumo rápido" className="grid scroll-mt-28 grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="flex flex-col justify-between transition-shadow hover:shadow-md"><div className="flex items-center justify-between"><span className="font-label-md text-on-surface-variant">Pets cadastrados</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary"><Icon name="pets" filled /></span></div><div className="mt-4 flex items-baseline gap-2"><strong className="font-display-lg leading-none text-on-surface">{petCount === null ? '—' : petCount}</strong><span className="text-on-surface-variant">{petCount === 1 ? 'pet' : 'pets'}</span></div><button type="button" onClick={() => goToTab('pets', 'pets')} className="mt-3 flex items-center gap-1.5 text-left font-label-md text-primary hover:underline">Abrir carteirinhas <Icon name="arrow_forward" className="text-base" /></button></Panel>
        <Panel className="flex flex-col justify-between transition-shadow hover:shadow-md"><div className="flex items-center justify-between"><span className="font-label-md text-on-surface-variant">Próxima Consulta</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-secondary"><Icon name="calendar_month" filled /></span></div><div className="mt-4"><strong className="block font-headline-md text-on-surface">{agenda.loading ? 'Carregando…' : agenda.error ? 'Agenda indisponível' : proximaConsulta ? dataHoraFormatada(proximaConsulta.dataHoraIni) : 'Nenhuma agendada'}</strong>{proximaConsulta && <span className="text-sm text-on-surface-variant">{proximaConsulta.animal.nome} • {proximaConsulta.servico.nome}</span>}</div><button type="button" onClick={() => goToTab('agenda', 'agenda')} className="mt-3 flex items-center gap-1.5 text-left font-label-md text-primary hover:underline">Ver minha agenda <Icon name="arrow_forward" className="text-base" /></button></Panel>
        <Panel className="flex flex-col justify-between transition-shadow hover:shadow-md"><div className="flex items-center justify-between"><span className="font-label-md text-on-surface-variant">Dados do perfil</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary"><Icon name="shield" filled /></span></div><div className="mt-4"><strong className="block font-headline-md text-tertiary">{usuario?.perfilCompleto ? 'Completo' : usuario ? 'Pendente' : '—'}</strong><span className="text-sm text-on-surface-variant">{usuario?.perfilCompleto ? 'Informações preenchidas' : 'Revise seus dados'}</span></div><button type="button" onClick={() => goToTab('dados', 'dados-pessoais')} className="mt-3 flex items-center gap-1.5 text-left font-label-md text-primary hover:underline">Revisar dados <Icon name="arrow_forward" className="text-base" /></button></Panel>
        <Panel className="flex flex-col justify-between transition-shadow hover:shadow-md"><div className="flex items-center justify-between"><span className="font-label-md text-on-surface-variant">Conta</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container"><Icon name="verified_user" filled /></span></div><div className="mt-4"><strong className="block font-headline-md capitalize text-on-surface">{usuario?.role || '—'}</strong><span className="text-sm text-on-surface-variant">Acesso PetExpress</span></div><div className="mt-3 truncate font-label-md text-on-surface-variant">{usuario?.email || 'E-mail não informado'}</div></Panel>
      </section>

      <div className="profile-columns grid grid-cols-1 items-start gap-gutter">
        <div className="profile-columns-main flex min-w-0 flex-col gap-8"><PetsSection onCountChange={onPetCountChange} /><AgendaSection agenda={agenda} /></div>
        <aside className="profile-columns-side flex min-w-0 flex-col gap-8">{usuario && <><PersonalSection usuario={usuario} /><AddressesSection usuario={usuario} /></>}</aside>
      </div>
    </div>
  </main></PageShell>;
}
