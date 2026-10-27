import { crudController } from '../lib/crudController';
import { asyncHandler } from '../lib/asyncHandler';
import { parseIdParam } from '../lib/parsers';
import * as service from '../services/servicoService';
export default {
  ...crudController(service, 'Serviço removido com sucesso.'),
  list: asyncHandler(async (req, res) => { res.json(await service.list(req.usuario, req.query)); }),
  administracao: asyncHandler(async (req, res) => { res.json(await service.listAdmin(req.usuario)); }),
  profissionais: asyncHandler(async (req, res) => { res.json(await service.profissionais(parseIdParam(req.params.id))); }),
};
