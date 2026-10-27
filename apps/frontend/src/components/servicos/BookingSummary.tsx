import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import type { Booking } from '@/booking/useBooking';
import { dataHoraFormatada, moeda } from '@/lib/booking';
import { estadosAgenda } from '@/types/agenda';
export function BookingSummary({ booking: b }: { booking: Booking }) {
  if (b.sucesso) return <div role="status"><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary"><Icon name="check_circle" className="text-3xl" /></span><h2 className="font-headline-md font-bold">{b.reagendando ? 'Agendamento atualizado' : 'Agendamento confirmado'}</h2><p className="mt-3 text-sm">{b.sucesso.animal.nome} • {b.sucesso.servico.nome}</p><p className="mt-2 font-bold text-primary">{dataHoraFormatada(b.sucesso.dataHoraIni)}</p><p className="mt-2 text-sm">{b.sucesso.funcionario.nome} • {estadosAgenda[b.sucesso.status]}</p><p className="mt-2 text-xs">Horário de São Paulo</p><Link className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary" to="/meu-perfil#agenda">Ver meus agendamentos</Link></div>;
  const linhas = [
    ['Pet', b.pet ? `${b.pet.nome} (${b.pet.especie})` : 'Selecione um pet'],
    ['Serviço', b.servico?.nome || 'Selecione um serviço'],
    ['Profissional', b.slot?.funcionario.nome || b.profissionais.find(p => p.id === b.funcionarioId)?.nome || 'Selecione um horário'],
    ['Data e horário', b.slot ? dataHoraFormatada(b.slot.inicio) : 'Selecione data e horário'],
  ];
  const preco = b.original ? b.original.precoContratado : b.servico?.preco;
  return <div><h2 className="mb-5 font-headline-md font-bold text-on-surface">Resumo do Agendamento</h2><dl className="space-y-4 text-sm">{linhas.map(([label, valor]) => <div key={label} className="flex justify-between gap-3"><dt className="text-on-surface-variant">{label}</dt><dd className="text-right font-bold text-on-surface">{valor}</dd></div>)}</dl><div className="my-5 border-t border-dashed border-outline-variant" /><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-label-md text-on-surface-variant">Valor do serviço</span><span className="font-headline-md text-xl font-bold text-secondary">{preco === undefined ? '—' : moeda(preco)}</span></div>{b.servico && <p className="mt-2 text-sm text-on-surface-variant">Duração: {b.original?.duracaoContratadaMin ?? b.servico.duracaoMin} min • Horário de São Paulo</p>}<button type="button" disabled={!b.pet || !b.servico || !b.slot || b.pending || b.horariosLoading} onClick={() => void b.confirmar()} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 font-headline-md font-bold text-on-primary shadow-lg transition hover:bg-primary-container disabled:cursor-default disabled:opacity-50"><Icon name="check_circle" />{b.pending ? 'Salvando…' : b.reagendando ? 'Confirmar Reagendamento' : 'Confirmar Agendamento'}</button>{b.submitError && <p role="alert" className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">{b.submitError}</p>}</div>;
}
