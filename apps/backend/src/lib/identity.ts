import { badRequest } from './errors';
import { inteiro, texto } from './parsers';

export const objeto = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw badRequest('Envie um objeto JSON.');
  return value as Record<string, unknown>;
};
export const permitirCampos = (body: Record<string, unknown>, campos: string[]) => {
  if (Object.keys(body).some(key => !campos.includes(key))) throw badRequest('Campo não permitido.');
};
export const cpf = (value: unknown) => {
  if (typeof value !== 'string') throw badRequest('CPF inválido.');
  const raw = value.trim();
  if (!/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(raw)) throw badRequest('CPF inválido.');
  const n = raw.replace(/\D/g, '');
  if (!/^\d{11}$/.test(n) || /^(\d)\1+$/.test(n)) throw badRequest('CPF inválido.');
  for (let size = 9; size <= 10; size++) {
    const sum = [...n.slice(0, size)].reduce((acc, digit, index) => acc + Number(digit) * (size + 1 - index), 0);
    const digit = (sum * 10) % 11 % 10;
    if (digit !== Number(n[size])) throw badRequest('CPF inválido.');
  }
  return n;
};
export const email = (value: unknown) => {
  const result = texto(value, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw badRequest('E-mail inválido.');
  return result;
};
export const telefone = (value: unknown) => {
  const raw = texto(value, 'telefone');
  if (!/^[+\d\s()-]+$/.test(raw)) throw badRequest('Telefone inválido.');
  let n = raw.replace(/\D/g, '');
  if (n.length === 12 || n.length === 13) {
    if (!n.startsWith('55')) throw badRequest('Use um telefone brasileiro.');
    n = n.slice(2);
  }
  if (!/^[1-9]\d{9,10}$/.test(n)) throw badRequest('Informe telefone com DDD e 10 ou 11 dígitos.');
  if (Number(n.slice(0, 2)) < 11) throw badRequest('Informe um DDD brasileiro válido.');
  return n;
};
export const senha = (value: unknown) => {
  if (typeof value !== 'string' || value.length < 8) throw badRequest('A senha deve ter pelo menos 8 caracteres.');
  return value;
};
export const cep = (value: unknown) => {
  const raw = texto(value, 'cep');
  if (!/^\d{5}-?\d{3}$/.test(raw)) throw badRequest('CEP inválido.');
  return raw.replace('-', '');
};
export const endereco = (value: unknown) => {
  const b = objeto(value);
  permitirCampos(b, ['cep', 'rua', 'bairro', 'numero', 'complemento', 'id']);
  return { cep: cep(b.cep), rua: texto(b.rua, 'rua'), bairro: texto(b.bairro, 'bairro'), numero: inteiro(0)(b.numero, 'numero'), complemento: b.complemento == null || b.complemento === '' ? null : texto(b.complemento, 'complemento') };
};
export const valido = (parse: (value: unknown) => unknown, value: unknown) => {
  try { parse(value); return true; } catch { return false; }
};
export const camposPendentes = (user: { nome: string; email: string | null; cpf: string; telefone: string | null; enderecos: unknown[] }) => [
  ...(!user.nome.trim() ? ['nome'] : []),
  ...(!valido(email, user.email) ? ['email'] : []),
  ...(!valido(cpf, user.cpf) ? ['cpf'] : []),
  ...(!valido(telefone, user.telefone) ? ['telefone'] : []),
  ...(!user.enderecos.some(e => { const b = objeto(e); return valido(endereco, { cep: b.cep, rua: b.rua, bairro: b.bairro, numero: b.numero, complemento: b.complemento }); }) ? ['endereco'] : []),
];
export const perfilCompleto = (user: Parameters<typeof camposPendentes>[0]) => camposPendentes(user).length === 0;
