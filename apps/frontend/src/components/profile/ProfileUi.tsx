import { useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
export const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-container disabled:cursor-wait disabled:opacity-60';
export const secondaryClass = 'inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-primary ring-1 ring-outline-variant hover:bg-surface-container disabled:opacity-60';
export function ProfilePanel({ id, title, icon, children, action }: { id: string; title: string; icon: string; children: ReactNode; action?: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className="flex min-w-0 scroll-mt-28 flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm"><header className="flex items-center justify-between gap-3"><h2 id={`${id}-title`} className="flex items-center gap-2 font-headline-md font-bold text-on-surface"><Icon name={icon} className="text-primary" />{title}</h2>{action}</header>{children}</section>;
}
export function StatusMessage({ children }: { children: ReactNode }) {
  return <p role="status" className="my-4 rounded-xl bg-tertiary-fixed p-4 text-sm text-on-tertiary-fixed-variant">{children}</p>;
}
export function DeleteAction({ name, pending, onDelete }: { name: string; pending: boolean; onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <div><button ref={trigger} type="button" disabled={pending} aria-expanded={confirming} onClick={() => setConfirming(true)} className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-error hover:bg-error-container disabled:opacity-60">Excluir <span className="sr-only">{name}</span></button>
    {confirming && <div role="group" aria-label={`Confirmar exclusão de ${name}`} className="mt-3 rounded-xl bg-surface-container-low p-4"><p className="mb-3 text-sm text-on-surface">Excluir <strong>{name}</strong>? Esta ação remove o cadastro.</p><div className="flex flex-wrap gap-2"><button autoFocus type="button" disabled={pending} className={secondaryClass} onClick={() => { setConfirming(false); trigger.current?.focus(); }}>Cancelar</button><button type="button" disabled={pending} className="min-h-11 rounded-full bg-error px-4 py-2 text-sm font-bold text-on-error disabled:opacity-60" onClick={() => void onDelete().finally(() => setConfirming(false))}>{pending ? 'Excluindo…' : 'Confirmar exclusão'}</button></div></div>}
  </div>;
}
