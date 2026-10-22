import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { usePrivateApi } from '@/auth/usePrivateApi';
import { Field, inputClass } from '@/components/forms/Field';
import { FormErrors } from '@/components/forms/FormErrors';
import { formFailure, validarFormulario, type FormFailure } from '@/lib/form-validation';
import { Icon } from '@/components/ui/Icon';
import { mensagemErro } from '@/lib/api';
import { StatusMessage, DeleteAction, actionClass, secondaryClass } from './ProfileUi';
type Pet = { id: number; nome: string; especie: string; idade: number; porte: 'PEQUENO' | 'MEDIO' | 'GRANDE'; raca: string | null };
const portes = { PEQUENO: 'Pequeno', MEDIO: 'Médio', GRANDE: 'Grande' };
function PetForm({ pet, pending, failure, onSave, onCancel }: { pet?: Pet; pending: boolean; failure: FormFailure | null; onSave: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const porteId = useId();
  return <form id="pet-form" noValidate onSubmit={onSave} className="mt-6 space-y-4 rounded-xl bg-surface-container-low p-5" aria-busy={pending}><h3 className="font-headline-md font-bold">{pet ? `Editar ${pet.nome}` : 'Novo pet'}</h3><FormErrors failure={failure} formId="pet-form" /><fieldset disabled={pending} className="space-y-4"><legend className="sr-only">Dados do pet</legend>
    <Field name="nome" label="Nome do pet" required defaultValue={pet?.nome} errors={failure?.fields} /><Field name="especie" label="Espécie" required defaultValue={pet?.especie} placeholder="Ex.: Cão, gato, coelho" errors={failure?.fields} />
    <div className="grid gap-4 sm:grid-cols-2"><Field name="idade" label="Idade (anos completos)" type="number" min={0} max={2147483647} step={1} required defaultValue={pet?.idade} errors={failure?.fields} />
      <div><label htmlFor={porteId} className="mb-1.5 block font-label-md">Porte</label><select id={porteId} name="porte" required defaultValue={pet?.porte || ''} className={inputClass} aria-invalid={!!failure?.fields.porte} aria-describedby={failure?.fields.porte ? `${porteId}-error` : undefined}><option value="" disabled>Selecione</option>{Object.entries(portes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{failure?.fields.porte && <p id={`${porteId}-error`} className="mt-1.5 text-sm text-error">{failure.fields.porte}</p>}</div>
    </div>
    <Field name="raca" label="Raça (opcional)" defaultValue={pet?.raca || ''} errors={failure?.fields} />
    <div className="flex flex-wrap gap-2"><button type="submit" disabled={pending} className={actionClass}>{pending ? 'Salvando…' : 'Salvar pet'}</button><button type="button" disabled={pending} className={secondaryClass} onClick={onCancel}>Cancelar</button></div>
  </fieldset></form>;
}
export function PetsSection({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const request = usePrivateApi();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Pet | 'new' | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<FormFailure | null>(null);
  useEffect(() => { if (pets) onCountChange?.(pets.length); }, [onCountChange, pets]);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setLoadError('');
    try { const data = await request<Pet[]>('/animais', { signal }); if (!signal?.aborted) setPets(data); }
    catch (error) { if (!signal?.aborted) setLoadError(mensagemErro(error)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [request]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || !editing) return;
    const invalid = validarFormulario(event.currentTarget);
    if (invalid) { setFailure(invalid); return; }
    const form = new FormData(event.currentTarget);
    const body = { nome: form.get('nome'), especie: form.get('especie'), idade: Number(form.get('idade')), porte: form.get('porte'), raca: String(form.get('raca') || '').trim() || null };
    setPending(true); setFailure(null); setNotice(''); setError('');
    try {
      const pet = await request<Pet>(editing === 'new' ? '/animais' : `/animais/${editing.id}`, { method: editing === 'new' ? 'POST' : 'PUT', body });
      setPets(current => editing === 'new' ? [pet, ...(current || [])] : (current || []).map(item => item.id === pet.id ? pet : item));
      setEditing(null); setNotice(`${pet.nome}: cadastro salvo.`);
    } catch (error) { setFailure(formFailure(error)); } finally { setPending(false); }
  }
  async function remove(pet: Pet) {
    if (pending) return;
    setPending(true); setError(''); setNotice('');
    try { await request(`/animais/${pet.id}`, { method: 'DELETE' }); setPets(current => current?.filter(item => item.id !== pet.id) || []); setNotice(`${pet.nome} foi excluído.`); }
    catch (error) { setError(mensagemErro(error)); } finally { setPending(false); }
  }
  return <section id="pets" aria-labelledby="pets-title" className="flex min-w-0 scroll-mt-28 flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
    <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><h2 id="pets-title" className="flex items-center gap-2 font-headline-md font-bold text-on-surface"><Icon name="badge" filled className="text-primary" />Carteirinha Digital dos Pets{pets && <span className="text-on-surface-variant">({pets.length})</span>}</h2><p className="text-sm text-on-surface-variant">Informações essenciais dos seus companheiros</p></div>{!editing && <button type="button" disabled={pending} onClick={() => { setEditing('new'); setFailure(null); setNotice(''); setError(''); }} className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-2 font-label-md font-bold text-on-primary-fixed hover:bg-primary hover:text-on-primary disabled:opacity-60"><Icon name="add" />Adicionar Pet</button>}</header>
    {notice && <StatusMessage>{notice}</StatusMessage>}{error && <p role="alert" className="rounded-xl bg-error-container p-4 text-sm text-on-error-container">{error}</p>}
    {loading && <p role="status" className="py-6">Carregando pets…</p>}
    {loadError && <div><p role="alert">{loadError}</p><button type="button" onClick={() => void load()} className={`${secondaryClass} mt-3`}>Tentar novamente</button></div>}
    {!loading && !loadError && pets?.length === 0 && <div className="rounded-xl bg-surface-container-low p-7 text-center"><Icon name="pets" className="text-4xl text-primary" /><h3 className="mt-3 font-bold">Nenhum pet cadastrado</h3><p className="mt-2 text-sm text-on-surface-variant">Adicione seu primeiro companheiro para começar.</p></div>}
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">{pets?.map(pet => <article key={pet.id} className="group relative flex min-w-0 flex-col justify-between gap-4 overflow-hidden rounded-xl bg-surface-container-low p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container text-primary shadow-sm"><Icon name="pets" filled className="text-4xl transition-transform duration-300 group-hover:scale-110" /></div><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-headline-md font-bold text-on-surface">{pet.nome}</h3><span className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-bold uppercase text-on-primary-fixed-variant">{pet.especie}</span></div><p className="mt-1 truncate text-sm font-medium text-on-surface-variant">{pet.raca || 'Raça não informada'}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant"><span>{pet.idade} {pet.idade === 1 ? 'ano' : 'anos'}</span><span aria-hidden="true">•</span><span>Porte {portes[pet.porte]}</span></div></div></div>
      {!editing && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/50 pt-3"><button type="button" disabled={pending} onClick={() => { setEditing(pet); setFailure(null); setNotice(''); setError(''); }} className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-primary hover:bg-primary-fixed"><Icon name="edit" />Editar <span className="sr-only">{pet.nome}</span></button><DeleteAction name={pet.nome} pending={pending} onDelete={() => remove(pet)} /></div>}
    </article>)}</div>
    {editing && <PetForm key={editing === 'new' ? 'new' : editing.id} pet={editing === 'new' ? undefined : editing} pending={pending} failure={failure} onSave={save} onCancel={() => { setEditing(null); setFailure(null); }} />}
  </section>;
}
