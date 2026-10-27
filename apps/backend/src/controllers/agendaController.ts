import { asyncHandler } from '../lib/asyncHandler';
import { parseIdParam } from '../lib/parsers';
import * as service from '../services/agendaService';
export default {
  disponibilidade: asyncHandler(async (req, res) => { res.json(await service.getDisponibilidade(req.query)); }),
  configuracao: asyncHandler(async (req, res) => { res.json(await service.getConfiguracao(req.usuario)); }),
  configurar: asyncHandler(async (req, res) => { res.json(await service.putConfiguracao(req.body, req.usuario)); }),
  bloqueios: asyncHandler(async (req, res) => { res.json(await service.listBloqueios(req.usuario)); }),
  bloquear: asyncHandler(async (req, res) => { res.status(201).json(await service.createBloqueio(req.body, req.usuario)); }),
  removerBloqueio: asyncHandler(async (req, res) => { await service.removeBloqueio(parseIdParam(req.params.id), req.usuario); res.sendStatus(204); }),
};
