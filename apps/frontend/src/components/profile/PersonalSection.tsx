import { useState, type FormEvent } from 'react';
import type { Usuario } from '@/auth/types';
import { useAuth } from '@/auth/useAuth';
import { usePrivateApi } from '@/auth/usePrivateApi';
import { Field } from '@/components/forms/Field';
import { FormErrors } from '@/components/forms/FormErrors';
import { formFailure, validarFormulario, type FormFailure } from '@/lib/form-validation';
import { Icon } from '@/components/ui/Icon';
import { ProfilePanel, StatusMessage, actionClass, secondaryClass } from './ProfileUi';
export function PersonalSection({ usuario }: { usuario: Usuario }) {
  const { atualizarUsuario } = useAuth();
  const request = usePrivateApi();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<FormFailure | null>(null);
  const [notice, setNotice] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const invalid = validarFormulario(event.currentTarget);
    if (invalid) { setFailure(invalid); return; }
    const form = new FormData(event.currentTarget);
    setPending(true); setFailure(null); setNotice('');
    try {
      const payload = await request<{ usuario: Usuario }>('/auth/me', { method: 'PUT', body: { nome: form.get('nome'), email: form.get('email'), telefone: form.get('telefone') } });
      atualizarUsuario(payload.usuario); setEditing(false); setNotice('Dados pessoais atualizados.');
    } catch (error) { setFailure(formFailure(error)); } finally { setPending(false); }
  }
  return <ProfilePanel id="dados-pessoais" title="Dados Pessoais" icon="person_pin" action={<button type="button" aria-label="Editar dados pessoais" title="Editar dados" className="p-1 text-primary hover:text-primary-container" onClick={() => { setEditing(true); setNotice(''); }}><Icon name="edit_square" className="text-xl" /></button>}>
    {notice && <StatusMessage>{notice}</StatusMessage>}
    {editing ? <form id="personal-form" noValidate onSubmit={save} className="space-y-4" aria-busy={pending}><FormErrors failure={failure} formId="personal-form" /><fieldset disabled={pending} className="space-y-4"><legend className="sr-only">Editar dados pessoais</legend><Field label="Nome completo" name="nome" required autoComplete="name" defaultValue={usuario.nome} errors={failure?.fields} /><Field label="E-mail" name="email" type="email" required autoComplete="email" defaultValue={usuario.email || ''} errors={failure?.fields} /><Field label="Telefone com DDD" name="telefone" type="tel" required autoComplete="tel-national" defaultValue={usuario.telefone || ''} errors={failure?.fields} /><div className="flex flex-wrap gap-2"><button type="submit" disabled={pending} className={actionClass}>{pending ? 'Salvando…' : 'Salvar dados'}</button><button type="button" disabled={pending} className={secondaryClass} onClick={() => { setEditing(false); setFailure(null); }}>Cancelar</button></div></fieldset></form> : <div className="flex flex-col gap-4 break-words text-sm">{[['Nome Completo', usuario.nome], ['CPF', usuario.cpf], ['E-mail Principal', usuario.email], ['Telefone / WhatsApp', usuario.telefone]].map(([label, value]) => <div key={label}><span className="font-label-md block font-semibold text-on-surface-variant">{label}</span><p className={`mt-0.5 font-medium ${label === 'CPF' ? 'font-mono' : ''}`}>{value || 'Não informado'}</p></div>)}</div>}
    {editing && <Field name="cpf" label="CPF (somente leitura)" value={usuario.cpf} readOnly aria-describedby="cpf-help" />}
    <p id="cpf-help" className="text-xs text-on-surface-variant">O CPF não pode ser alterado aqui. Para corrigir, entre em contato com o atendimento administrativo.</p>
  </ProfilePanel>;
}
