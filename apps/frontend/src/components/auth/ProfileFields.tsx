import type { Usuario } from '@/auth/types';
import type { FieldErrors } from '@/lib/api';
import { Field } from '@/components/forms/Field';
export function AddressFields({ address, errors = {}, prefix = '' }: { address?: Usuario['enderecos'][number]; errors?: FieldErrors; prefix?: string }) {
  return <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field name="cep" field={`${prefix}cep`} errors={errors} label="CEP" autoComplete="postal-code" inputMode="numeric" required defaultValue={address?.cep} placeholder="00000-000" />
      <Field name="numero" field={`${prefix}numero`} errors={errors} label="Número (0 para sem número)" type="number" min={0} max={2147483647} step={1} required defaultValue={address?.numero} />
    </div>
    <Field name="rua" field={`${prefix}rua`} errors={errors} label="Rua" autoComplete="address-line1" required defaultValue={address?.rua} />
    <Field name="bairro" field={`${prefix}bairro`} errors={errors} label="Bairro" required defaultValue={address?.bairro} />
    <Field name="complemento" field={`${prefix}complemento`} errors={errors} label="Complemento (opcional)" autoComplete="address-line2" defaultValue={address?.complemento || ''} />
  </>;
}
export function ProfileFields({ usuario, incluirCpf = false, errors = {} }: { usuario?: Usuario | null; incluirCpf?: boolean; errors?: FieldErrors }) {
  return <fieldset className="space-y-4"><legend className="mb-3 font-label-md text-on-surface">Dados de contato e endereço</legend>
    {incluirCpf && <Field name="cpf" label="CPF" errors={errors} required inputMode="numeric" defaultValue={usuario?.cpf} placeholder="000.000.000-00" />}
    <Field name="telefone" label="Telefone com DDD" errors={errors} type="tel" autoComplete="tel-national" required defaultValue={usuario?.telefone || ''} placeholder="(11) 99999-1234" />
    <AddressFields address={usuario?.enderecos[0]} errors={errors} prefix="endereco." />
  </fieldset>;
}
