import { asyncHandler } from '../lib/asyncHandler';
import { parseIdParam } from '../lib/parsers';
import * as service from '../services/fidelidadeService';
export default {
  list: asyncHandler(async (req, res) => { res.json(await service.list(req.usuario)); }),
  me: asyncHandler(async (req, res) => { res.json(await service.me(req.usuario)); }),
  getById: asyncHandler(async (req, res) => { res.json(await service.getById(parseIdParam(req.params.id), req.usuario)); }),
  ajustar: asyncHandler(async (req, res) => { res.json(await service.ajustar(parseIdParam(req.params.id), req.body, req.usuario)); }),
};
