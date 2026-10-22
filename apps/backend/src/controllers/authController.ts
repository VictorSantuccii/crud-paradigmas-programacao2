import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { COOKIE_SESSAO, COOKIE_ONBOARDING, tokenCookie } from '../lib/session';
const opcoes = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' });
const emitir = (res: Response, result: { token: string; usuario: authService.UsuarioPublico }, status = 200) => {
  res.cookie(COOKIE_SESSAO, result.token, { ...opcoes(), maxAge: authService.DURACAO_SESSAO_SEGUNDOS * 1000 });
  return res.status(status).json({ usuario: result.usuario });
};
export const cadastrar = async (req: Request, res: Response) => emitir(res, await authService.cadastrar(req.body), 201);
export const entrar = async (req: Request, res: Response) => emitir(res, await authService.entrar(req.body));
export const entrarComGoogle = async (req: Request, res: Response) => {
  const result = await authService.entrarComGoogle(req.body);
  if ('requiresOnboarding' in result) {
    res.cookie(COOKIE_ONBOARDING, result.token, { ...opcoes(), maxAge: authService.DURACAO_ONBOARDING * 1000 });
    return res.json({ requiresOnboarding: true, camposPendentes: result.camposPendentes });
  }
  return emitir(res, result);
};
export const atual = async (req: Request, res: Response) => res.json({ usuario: req.usuario });
export const atualizar = async (req: Request, res: Response) => res.json({ usuario: await authService.atualizarPerfil(req.usuario!.id, req.body) });
export const onboarding = async (req: Request, res: Response) => res.json({ ...await authService.consultarOnboarding(tokenCookie(req, COOKIE_ONBOARDING)), requiresOnboarding: true, camposPendentes: ['cpf', 'telefone', 'endereco'] });
export const concluir = async (req: Request, res: Response) => {
  const result = await authService.concluirOnboarding(tokenCookie(req, COOKIE_ONBOARDING), req.body);
  res.clearCookie(COOKIE_ONBOARDING, opcoes());
  return emitir(res, result, 201);
};
export const sair = async (req: Request, res: Response) => {
  await authService.sair(tokenCookie(req));
  const onboardingToken = tokenCookie(req, COOKIE_ONBOARDING);
  if (onboardingToken) { const { default: redis } = await import('../lib/redis'); await redis.del(`onboarding:${onboardingToken}`); }
  res.clearCookie(COOKIE_SESSAO, opcoes()); res.clearCookie(COOKIE_ONBOARDING, opcoes());
  res.status(204).send();
};
