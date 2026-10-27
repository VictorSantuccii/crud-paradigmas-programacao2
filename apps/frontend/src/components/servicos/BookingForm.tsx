import type { Booking } from '@/booking/useBooking';
import { BookingSummary } from './BookingSummary';
import { MonthCalendar } from './MonthCalendar';
import { TimeSlots } from './TimeSlots';
import { Icon } from '@/components/ui/Icon';
export function ScheduleFields({ booking: b }: { booking: Booking }) {
  const slots = b.disponibilidade?.slots || [];
  return <div aria-busy={b.horariosLoading}><MonthCalendar mes={b.mes} selectedDay={b.dia} disponiveis={new Set(slots.map(s => s.data))} onSelectDay={b.trocarDia} onChangeMonth={b.trocarMes} disabled={b.pending || !!b.sucesso} />
    {!b.servicoId && <p className="mt-5 text-sm text-on-surface-variant">Selecione um serviço para consultar a agenda.</p>}
    {b.horariosLoading && <p role="status" className="mt-5 text-sm">Carregando horários…</p>}
    {b.horariosError && <div className="mt-5"><p role="alert" className="text-sm text-error">{b.horariosError}</p><button type="button" className="mt-3 min-h-11 text-sm font-bold text-primary" onClick={b.refreshHorarios}>Tentar novamente</button></div>}
    {b.servicoId && !b.horariosLoading && !b.horariosError && !slots.length && <p role="status" className="mt-5 text-sm text-on-surface-variant">Nenhum horário disponível neste mês. Tente outro mês{b.funcionarioId ? ' ou profissional' : ''}.</p>}
    {b.dia && !b.horariosLoading && !b.horariosError && <div className="mt-6"><h3 className="mb-3 font-label-md text-on-surface-variant">Horários disponíveis para {b.dia.split('-').reverse().join('/')}</h3><TimeSlots slots={slots.filter(s => s.data === b.dia)} selectedTime={b.horario} onSelectTime={b.setHorario} disabled={b.pending || !!b.sucesso} /></div>}
  </div>;
}

export function BookingForm({ booking: b }: { booking: Booking }) {
  return <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-5"><section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_rgba(0,93,167,0.08)] sm:p-8"><h2 className="mb-5 flex items-center gap-2 font-headline-md font-bold text-on-surface"><Icon name="calendar_month" className="text-primary" />Data &amp; Horário</h2><ScheduleFields booking={b} /></section><section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_10px_25px_rgba(0,93,167,0.08)] sm:p-8"><BookingSummary booking={b} /></section></aside>;
}
