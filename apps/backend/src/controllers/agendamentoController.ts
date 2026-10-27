import { asyncHandler } from '../lib/asyncHandler';
import { parseIdParam } from '../lib/parsers';
import * as service from '../services/agendamentoService';
export default {
  list: asyncHandler(async (req, res) => { res.json(await service.list(req.usuario, req.query)); }),
  getById: asyncHandler(async (req, res) => { res.json(await service.getById(parseIdParam(req.params.id), req.usuario)); }),
  create: asyncHandler(async (req, res) => { res.status(201).json(await service.create(req.body, req.usuario)); }),
  update: asyncHandler(async (req, res) => { res.json(await service.update(parseIdParam(req.params.id), req.body, req.usuario)); }),
  status: asyncHandler(async (req, res) => { res.json(await service.status(parseIdParam(req.params.id), req.body, req.usuario)); }),
  disponibilidade: asyncHandler(async (req, res) => { res.json(await service.disponibilidadeReagendamento(parseIdParam(req.params.id), req.query, req.usuario)); }),
};
