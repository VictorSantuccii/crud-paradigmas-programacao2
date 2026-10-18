import { Prisma } from "@prisma/client";
import { badRequest } from "./errors";

type Parser<T> = (valor: unknown, campo: string) => T;

export interface Campo<T> {
  parse: Parser<T>;
  obrigatorio: boolean;
}

type Schema = Record<string, Campo<unknown>>;

export type DadosCriacao<S extends Schema> = {
  [K in keyof S]: S[K] extends Campo<infer T> ? T : never;
};

export type DadosAtualizacao<S extends Schema> = Partial<DadosCriacao<S>>;

export const texto: Parser<string> = (valor, campo) => {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw badRequest(`O campo ${campo} deve ser um texto não vazio.`);
  }
  return valor.trim();
};

const INT_MAX = 2147483647;

export const inteiro =
  (minimo = 0): Parser<number> =>
  (valor, campo) => {
    if (
      typeof valor !== "number" ||
      !Number.isInteger(valor) ||
      valor < minimo ||
      valor > INT_MAX
    ) {
      throw badRequest(
        `O campo ${campo} deve ser um inteiro entre ${minimo} e ${INT_MAX}.`,
      );
    }
    return valor;
  };

export const idReferencia = inteiro(1);

export const booleano: Parser<boolean> = (valor, campo) => {
  if (typeof valor !== "boolean") {
    throw badRequest(`O campo ${campo} deve ser true ou false.`);
  }
  return valor;
};

export const enumeracao =
  <T extends string>(valores: Record<string, T>): Parser<T> =>
  (valor, campo) => {
    const aceitos = Object.values(valores);
    if (typeof valor !== "string" || !aceitos.includes(valor as T)) {
      throw badRequest(`O campo ${campo} deve ser um de: ${aceitos.join(", ")}.`);
    }
    return valor as T;
  };

export const preco: Parser<number> = (valor, campo) => {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
    throw badRequest(`O campo ${campo} deve ser um número maior ou igual a zero.`);
  }
  if (Math.round(valor * 100) / 100 !== valor) {
    throw badRequest(`O campo ${campo} aceita no máximo duas casas decimais.`);
  }
  if (valor >= 1e8) {
    throw badRequest(`O campo ${campo} deve ser menor que 100000000.`);
  }
  return valor;
};

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const data: Parser<Date> = (valor, campo) => {
  if (typeof valor !== "string" || !DATA_REGEX.test(valor)) {
    throw badRequest(`O campo ${campo} deve estar no formato YYYY-MM-DD.`);
  }
  const resultado = new Date(`${valor}T00:00:00.000Z`);
  if (Number.isNaN(resultado.getTime()) || resultado.toISOString().slice(0, 10) !== valor) {
    throw badRequest(`O campo ${campo} não é uma data válida.`);
  }
  return resultado;
};

const DATA_HORA_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export const dataHora: Parser<Date> = (valor, campo) => {
  if (typeof valor !== "string" || !DATA_HORA_REGEX.test(valor)) {
    throw badRequest(
      `O campo ${campo} deve estar em ISO 8601 com fuso, por exemplo 2026-10-01T14:00:00Z.`,
    );
  }
  const resultado = new Date(valor);
  if (Number.isNaN(resultado.getTime())) {
    throw badRequest(`O campo ${campo} não é uma data e hora válida.`);
  }
  return resultado;
};

export const json: Parser<Prisma.InputJsonValue> = (valor) =>
  valor as Prisma.InputJsonValue;

export const obrigatorio = <T>(parse: Parser<T>): Campo<T> => ({
  parse,
  obrigatorio: true,
});

export const opcional = <T>(parse: Parser<T>): Campo<T | null> => ({
  parse: (valor, campo) => (valor === null ? null : parse(valor, campo)),
  obrigatorio: false,
});

const comoObjeto = (body: unknown): Record<string, unknown> => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw badRequest("O corpo da requisição deve ser um objeto JSON.");
  }
  return body as Record<string, unknown>;
};

export const parseCriacao = <S extends Schema>(schema: S, body: unknown): DadosCriacao<S> => {
  const entrada = comoObjeto(body);
  const saida: Record<string, unknown> = {};

  for (const [campo, regra] of Object.entries(schema)) {
    const valor = entrada[campo];
    if (valor === undefined) {
      if (regra.obrigatorio) {
        throw badRequest(`O campo ${campo} é obrigatório.`);
      }
      saida[campo] = null;
      continue;
    }
    if (valor === null && regra.obrigatorio) {
      throw badRequest(`O campo ${campo} é obrigatório.`);
    }
    saida[campo] = regra.parse(valor, campo);
  }

  return saida as DadosCriacao<S>;
};

export const parseAtualizacao = <S extends Schema>(
  schema: S,
  body: unknown,
): DadosAtualizacao<S> => {
  const entrada = comoObjeto(body);
  const saida: Record<string, unknown> = {};

  for (const [campo, regra] of Object.entries(schema)) {
    if (!(campo in entrada) || entrada[campo] === undefined) continue;
    const valor = entrada[campo];
    if (valor === null && regra.obrigatorio) {
      throw badRequest(`O campo ${campo} não pode ser nulo.`);
    }
    saida[campo] = regra.parse(valor, campo);
  }

  if (Object.keys(saida).length === 0) {
    throw badRequest(
      `Envie ao menos um destes campos para atualizar: ${Object.keys(schema).join(", ")}.`,
    );
  }

  return saida as DadosAtualizacao<S>;
};

export const parseIdParam = (valor: string): number => {
  if (!/^\d+$/.test(valor)) {
    throw badRequest("O id deve ser um inteiro positivo.");
  }
  const id = Number(valor);
  if (id < 1 || id > INT_MAX) {
    throw badRequest("O id deve ser um inteiro positivo.");
  }
  return id;
};

export const precoSaida = (valor: Prisma.Decimal) => Number(valor.toFixed(2));

export const dataSaida = (valor: Date) => valor.toISOString().slice(0, 10);
