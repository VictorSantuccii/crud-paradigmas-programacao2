import type { Usuario } from '@/auth/types';
const inputClass = 'w-full rounded-lg bg-surface-container-lowest px-3.5 py-3 text-on-surface shadow-sm ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary';
export function ProfileFields({ usuario, incluirCpf = false }: { usuario?: Usuario | null; incluirCpf?: boolean }) {
  const address = usuario?.enderecos[0];
  return <fieldset className="space-y-3.5">
    <legend className="mb-3 font-label-md text-on-surface">Dados de contato e endereço</legend>
    {incluirCpf && <div><label htmlFor="perfil-cpf" className="mb-1 block font-label-md">CPF</label><input className={inputClass} id="perfil-cpf" name="cpf" required inputMode="numeric" defaultValue={usuario?.cpf} placeholder="000.000.000-00" /></div>}
    <div><label htmlFor="telefone" className="mb-1 block font-label-md">Telefone com DDD</label><input className={inputClass} id="telefone" name="telefone" type="tel" autoComplete="tel-national" required defaultValue={usuario?.telefone || ''} placeholder="(11) 99999-1234" /></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div><label htmlFor="cep" className="mb-1 block font-label-md">CEP</label><input className={inputClass} id="cep" name="cep" autoComplete="postal-code" inputMode="numeric" required defaultValue={address?.cep} placeholder="00000-000" /></div>
      <div><label htmlFor="numero" className="mb-1 block font-label-md">Número</label><input className={inputClass} id="numero" name="numero" type="number" min={0} max={2147483647} step={1} required defaultValue={address?.numero} placeholder="0 para sem número" /></div>
    </div>
    <div><label htmlFor="rua" className="mb-1 block font-label-md">Rua</label><input className={inputClass} id="rua" name="rua" autoComplete="address-line1" required defaultValue={address?.rua} /></div>
    <div><label htmlFor="bairro" className="mb-1 block font-label-md">Bairro</label><input className={inputClass} id="bairro" name="bairro" required defaultValue={address?.bairro} /></div>
    <div><label htmlFor="complemento" className="mb-1 block font-label-md">Complemento (opcional)</label><input className={inputClass} id="complemento" name="complemento" autoComplete="address-line2" defaultValue={address?.complemento || ''} /></div>
  </fieldset>;
}
