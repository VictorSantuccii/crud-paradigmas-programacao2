import bcrypt from "bcryptjs";

const CUSTO = 10;

export const hashSenha = (senha: string) => bcrypt.hash(senha, CUSTO);
export const verificarSenha = (senha: string, hash: string) => bcrypt.compare(senha, hash);
