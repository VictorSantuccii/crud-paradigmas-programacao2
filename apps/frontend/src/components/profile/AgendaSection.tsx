import { Link } from 'react-router-dom';
import type { useAppointments } from '@/booking/useAppointments';
import { AppointmentCard } from '@/components/meus-pets/AppointmentCard';
import { HistoryList } from '@/components/meus-pets/HistoryList';
import { ProfilePanel, secondaryClass, StatusMessage } from './ProfileUi';
export function AgendaSection({ agenda }: { agenda: ReturnType<typeof useAppointments> }) {
  const proximos = agenda.itens.filter(i => i.status === 'AGENDADO' && new Date(i.dataHoraIni).getTime() > Date.now());
  const historico = agenda.itens.filter(i => !proximos.includes(i)).reverse();
  return <><ProfilePanel id="agenda" title="Próximos agendamentos" icon="calendar_month" action={<Link to="/consultas" className="text-sm font-bold text-primary">Agendar consulta</Link>}>
    {agenda.notice && <StatusMessage>{agenda.notice}</StatusMessage>}{agenda.loading && <p role="status">Carregando agendamentos…</p>}{agenda.error && <div><p role="alert" className="text-sm text-error">{agenda.error}</p><button type="button" className={`${secondaryClass} mt-3`} onClick={() => void agenda.load()}>Tentar novamente</button></div>}
    {!agenda.loading && !agenda.error && !proximos.length && <p className="rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">Nenhum agendamento futuro. <Link to="/servicos" className="font-bold text-primary">Agendar um serviço</Link></p>}
    {proximos.map(item => <AppointmentCard key={item.id} item={item} pending={agenda.pending !== null} onCancel={agenda.cancelar} />)}
    <p className="text-xs text-on-surface-variant">Horários de São Paulo. Cancelamento e reagendamento seguem o prazo da agenda; as ações disponíveis aparecem em cada atendimento.</p>
  </ProfilePanel><ProfilePanel id="historico" title="Histórico de atendimentos" icon="history">{!agenda.loading && !agenda.error && <HistoryList itens={historico} />}</ProfilePanel></>;
}
