import { Request } from 'express';
import { asyncHandler } from './asyncHandler';
import { unauthorized, forbidden } from './errors';
import { consultarSessao, UsuarioPublico } from '../services/authService';

declare module "express-serve-static-core" { interface Request { usuario?: UsuarioPublico } }
export const COOKIE_SESSAO = 'petshop_session';
export const COOKIE_ONBOARDING = 'petshop_onboarding';
export const tokenCookie = (request: Request, nome = COOKIE_SESSAO) => request.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${nome}=`))?.slice(nome.length + 1);
export const autenticar = asyncHandler(async (req, _res, next) => {
  const user = await consultarSessao(tokenCookie(req));
  if (!user) throw unauthorized('Sessão não encontrada ou expirada.');
  req.usuario = user;
  next();
});
export const exigirCompleto = asyncHandler(async (req, _res, next) => {
  if (req.usuario?.role === 'CLIENTE' && !req.usuario.perfilCompleto) throw forbidden('Conclua seu perfil para continuar.', 'PERFIL_INCOMPLETO');
  next();
});
