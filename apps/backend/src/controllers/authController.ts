import { Request, Response } from "express";
import * as authService from "../services/authService";

export const COOKIE_SESSAO = "petshop_session";
const opcoesCookie = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: authService.DURACAO_SESSAO_SEGUNDOS * 1000,
});

const tokenDaRequisicao = (request: Request) => {
  const cookie = request.headers.cookie?.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_SESSAO}=`));
  return cookie?.slice(COOKIE_SESSAO.length + 1);
};

export const cadastrar = async (request: Request, response: Response) => {
  const { token, usuario } = await authService.cadastrar(request.body);
  response.cookie(COOKIE_SESSAO, token, opcoesCookie());
  response.status(201).json({ usuario });
};

export const entrar = async (request: Request, response: Response) => {
  const { token, usuario } = await authService.entrar(request.body);
  response.cookie(COOKIE_SESSAO, token, opcoesCookie());
  response.json({ usuario });
};

export const atual = async (request: Request, response: Response) => {
  const usuario = await authService.consultarSessao(tokenDaRequisicao(request));
  if (!usuario) return response.status(401).json({ message: "Sessão não encontrada ou expirada." });
  return response.json({ usuario });
};

export const sair = async (request: Request, response: Response) => {
  await authService.sair(tokenDaRequisicao(request));
  response.clearCookie(COOKIE_SESSAO, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  response.status(204).send();
};
