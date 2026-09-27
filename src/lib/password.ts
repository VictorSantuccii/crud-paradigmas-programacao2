import bcrypt from "bcryptjs";

const CUSTO = 10;

export const hashSenha = (senha: string) => bcrypt.hash(senha, CUSTO);
