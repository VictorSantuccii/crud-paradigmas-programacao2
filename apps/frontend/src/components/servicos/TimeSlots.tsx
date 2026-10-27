import type { Slot } from '@/types/agenda';
import { chaveSlot, horaFormatada } from '@/lib/booking';
import { cn } from '@/lib/cn';
export function TimeSlots({ slots, selectedTime, onSelectTime, disabled }: { slots: Slot[]; selectedTime: string; onSelectTime: (id: string) => void; disabled?: boolean }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{slots.map(slot => {
    const id = chaveSlot(slot);
    return <button key={id} type="button" disabled={disabled} aria-pressed={selectedTime === id} onClick={() => onSelectTime(id)} className={cn('min-h-11 rounded-lg border px-2 py-2 text-center font-body-md transition-colors', selectedTime === id ? 'border-2 border-primary bg-primary-fixed font-bold text-primary shadow-sm' : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary')}><span className="block">{horaFormatada(slot.inicio)}</span><span className="block break-words text-xs">{slot.funcionario.nome}</span></button>;
  })}</div>;
}
