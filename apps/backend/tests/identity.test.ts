import { describe, expect, it } from 'vitest';
import { cpf, email, telefone, endereco, perfilCompleto } from '../src/lib/identity';

describe('identidade canônica', () => {
  it('normaliza CPF com máscara e verifica dígitos', () => {
    expect(cpf('529.982.247-25')).toBe('52998224725');
    for (const value of ['11111111111', '52998224724', '', 'abc52998224725', '529.982.247.25']) expect(() => cpf(value)).toThrow();
  });
  it('normaliza e-mail e telefone brasileiro', () => {
    expect(email(' ANA@EXAMPLE.COM ')).toBe('ana@example.com');
    expect(telefone('+55 (11) 99999-1234')).toBe('11999991234');
    expect(telefone('(11) 3333-1234')).toBe('1133331234');
    expect(() => telefone('123')).toThrow();
    expect(() => telefone('(10) 99999-1234')).toThrow();
  });
  it('exige endereço completo e número inteiro', () => {
    expect(endereco({ cep: '12345-678', rua: ' Rua ', bairro: 'Centro', numero: 0 }).cep).toBe('12345678');
    expect(() => endereco({ cep: '12345678', rua: '', bairro: 'Centro', numero: 1 })).toThrow();
    expect(() => endereco({ cep: '12345678', rua: 'Rua', bairro: 'Centro', numero: 1.5 })).toThrow();
  });
  it('deriva completude dos dados atuais', () => {
    const user = { nome: 'Ana', email: 'ana@example.com', cpf: '52998224725', telefone: '11999991234', enderecos: [{ cep: '12345678', rua: 'Rua', bairro: 'Centro', numero: 1 }] };
    expect(perfilCompleto(user)).toBe(true);
    expect(perfilCompleto({ ...user, telefone: null })).toBe(false);
    expect(perfilCompleto({ ...user, enderecos: [] })).toBe(false);
  });
});
