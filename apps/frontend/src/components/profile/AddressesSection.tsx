import { useState, type FormEvent } from 'react';
import type { Usuario } from '@/auth/types';
import { useAuth } from '@/auth/useAuth';
import { usePrivateApi } from '@/auth/usePrivateApi';
import { dadosEndereco } from '@/auth/profile-data';
import { AddressFields } from '@/components/auth/ProfileFields';
import { FormErrors } from '@/components/forms/FormErrors';
import { formFailure, validarFormulario, type FormFailure } from '@/lib/form-validation';
import { mensagemErro } from '@/lib/api';
import { Icon } from '@/components/ui/Icon';
import { ProfilePanel, StatusMessage, DeleteAction, actionClass, secondaryClass } from './ProfileUi';
type Address = Usuario['enderecos'][number];
export function AddressesSection({ usuario }: { usuario: Usuario }) {
  const { atualizarUsuario, recarregarUsuario } = useAuth();
  const request = usePrivateApi();
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<FormFailure | null>(null);
  const [error, setError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [notice, setNotice] = useState('');
  async function sync() {
    setSyncError('');
    try { await recarregarUsuario(); } catch { setSyncError('A alteração foi salva, mas não foi possível recarregar o perfil.'); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || !editing) return;
    const invalid = validarFormulario(event.currentTarget);
    if (invalid) { setFailure(invalid); return; }
    const body = dadosEndereco(new FormData(event.currentTarget));
    setPending(true); setFailure(null); setError(''); setNotice('');
    try {
      const address = await request<Address>(editing === 'new' ? '/enderecos' : `/enderecos/${editing.id}`, { method: editing === 'new' ? 'POST' : 'PUT', body });
      atualizarUsuario({ ...usuario, enderecos: editing === 'new' ? [...usuario.enderecos, address] : usuario.enderecos.map(item => item.id === address.id ? address : item) });
      setEditing(null); setNotice('Endereço salvo.'); await sync();
    } catch (error) { setFailure(formFailure(error)); } finally { setPending(false); }
  }
  async function remove(address: Address) {
    if (pending) return;
    setPending(true); setError(''); setNotice('');
    try {
      await request(`/enderecos/${address.id}`, { method: 'DELETE' });
      atualizarUsuario({ ...usuario, enderecos: usuario.enderecos.filter(item => item.id !== address.id) });
      setNotice(`Endereço ${address.rua}, ${address.numero} excluído.`); await sync();
    } catch (error) { setError(mensagemErro(error)); } finally { setPending(false); }
  }
  return <ProfilePanel id="enderecos" title="Endereço Residencial" icon="location_city">
    <p className="text-sm text-on-surface-variant">Mantenha ao menos um endereço completo. Use número 0 para sem número.</p>
    {notice && <StatusMessage>{notice}</StatusMessage>}{error && <p role="alert" className="mb-4 rounded-xl bg-error-container p-4 text-sm text-on-error-container">{error}</p>}
    {syncError && <div className="mb-4"><p role="alert">{syncError}</p><button type="button" disabled={pending} onClick={() => void sync()} className={secondaryClass}>Recarregar perfil</button></div>}
    <div className="flex flex-col gap-3">{usuario.enderecos.map(address => <article key={address.id} className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4"><div className="flex items-start gap-2"><Icon name="home" className="mt-0.5 text-primary" /><div className="min-w-0"><h3 className="break-words font-bold text-on-surface">{address.rua}, {address.numero === 0 ? 's/n' : address.numero}{address.complemento ? ` - ${address.complemento}` : ''}</h3><p className="break-words text-sm text-on-surface-variant">{address.bairro}</p><p className="mt-0.5 font-mono text-sm text-on-surface-variant">CEP: {address.cep}</p></div></div>
      {!editing && <div className="mt-3 flex flex-wrap items-start gap-2"><button type="button" disabled={pending} className={secondaryClass} onClick={() => { setEditing(address); setFailure(null); setNotice(''); setError(''); }}>Editar <span className="sr-only">{address.rua}, {address.numero}</span></button><DeleteAction name={`${address.rua}, ${address.numero}`} pending={pending} onDelete={() => remove(address)} /></div>}
    </article>)}</div>
    {!usuario.enderecos.length && <p>Nenhum endereço cadastrado.</p>}
    {editing ? <form key={editing === 'new' ? 'new' : editing.id} id="address-form" noValidate onSubmit={save} className="space-y-4 border-t border-outline-variant pt-6" aria-busy={pending}><h3 className="font-bold">{editing === 'new' ? 'Novo endereço' : 'Editar endereço'}</h3><FormErrors failure={failure} formId="address-form" /><fieldset disabled={pending} className="space-y-4"><legend className="sr-only">Dados do endereço</legend><AddressFields address={editing === 'new' ? undefined : editing} errors={failure?.fields} /><div className="flex flex-wrap gap-2"><button type="submit" disabled={pending} className={actionClass}>{pending ? 'Salvando…' : 'Salvar endereço'}</button><button type="button" disabled={pending} className={secondaryClass} onClick={() => { setEditing(null); setFailure(null); }}>Cancelar</button></div></fieldset></form> : <button type="button" disabled={pending} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-container px-3 py-2.5 font-label-md text-primary transition-colors hover:bg-surface-container-high" onClick={() => { setEditing('new'); setFailure(null); setNotice(''); setError(''); }}><Icon name="add_location_alt" />Adicionar Novo Endereço</button>}
  </ProfilePanel>;
}
