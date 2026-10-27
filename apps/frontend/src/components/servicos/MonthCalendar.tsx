import { Icon } from '@/components/ui/Icon';
import { diasDoMes, mesSeguinte } from '@/lib/booking';
import { cn } from '@/lib/cn';
type Props = { mes: string; selectedDay: string; disponiveis: Set<string>; onSelectDay: (dia: string) => void; onChangeMonth: (mes: string) => void; disabled?: boolean };
export function MonthCalendar({ mes, selectedDay, disponiveis, onSelectDay, onChangeMonth, disabled }: Props) {
  const { vazios, dias } = diasDoMes(mes);
  const titulo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-01T12:00Z`));
  return <div><span className="mb-4 block font-label-md text-on-surface-variant">Escolha a data</span><div className="rounded-xl border border-outline-variant bg-surface p-4">
    <div className="mb-4 flex items-center justify-between"><button type="button" disabled={disabled} className="min-h-11 min-w-11 text-on-surface-variant hover:text-primary" aria-label="Mês anterior" onClick={() => onChangeMonth(mesSeguinte(mes, -1))}><Icon name="chevron_left" /></button><span aria-live="polite" className="font-label-md font-bold capitalize text-on-surface">{titulo}</span><button type="button" disabled={disabled} className="min-h-11 min-w-11 text-on-surface-variant hover:text-primary" aria-label="Próximo mês" onClick={() => onChangeMonth(mesSeguinte(mes, 1))}><Icon name="chevron_right" /></button></div>
    <div className="mb-2 grid grid-cols-7 gap-1 text-center">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <span key={d} className="text-xs font-label-md text-outline">{d}</span>)}</div>
    <div className="grid grid-cols-7 gap-1 text-center font-body-md md:gap-2">{Array.from({ length: vazios }, (_, i) => <span key={`vazio-${i}`} aria-hidden="true" />)}{Array.from({ length: dias }, (_, i) => {
      const dia = `${mes}-${String(i + 1).padStart(2, '0')}`, disponivel = disponiveis.has(dia);
      return <button key={dia} type="button" disabled={disabled || !disponivel} onClick={() => onSelectDay(dia)} aria-label={`${i + 1} de ${titulo}${disponivel ? ', com horários' : ', sem horários'}`} aria-pressed={selectedDay === dia} className={cn('relative min-h-10 rounded-full py-2 transition-colors disabled:cursor-default', !disponivel && 'text-outline-variant', disponivel && selectedDay !== dia && 'hover:bg-surface-container-high', selectedDay === dia && 'bg-primary font-bold text-on-primary shadow-md')}>{i + 1}{disponivel && <span aria-hidden="true" className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-secondary-container" />}</button>;
    })}</div>
  </div></div>;
}
