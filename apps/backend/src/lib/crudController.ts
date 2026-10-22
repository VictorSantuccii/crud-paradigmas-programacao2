import { Contexto } from "./authorization";
import { asyncHandler } from "./asyncHandler";
import { parseIdParam } from "./parsers";

interface CrudService {
  list: (ctx?: Contexto) => Promise<unknown>;
  getById: (id: number, ctx?: Contexto) => Promise<unknown>;
  create: (body: unknown, ctx?: Contexto) => Promise<unknown>;
  update: (id: number, body: unknown, ctx?: Contexto) => Promise<unknown>;
  remove: (id: number, ctx?: Contexto) => Promise<void>;
}

export const crudController = (service: CrudService, mensagemRemocao: string) => ({
  list: asyncHandler(async (req, res) => {
    res.status(200).json(await service.list(req.usuario));
  }),

  getById: asyncHandler(async (req, res) => {
    res.status(200).json(await service.getById(parseIdParam(req.params.id), req.usuario));
  }),

  create: asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body, req.usuario));
  }),

  update: asyncHandler(async (req, res) => {
    res.status(200).json(await service.update(parseIdParam(req.params.id), req.body, req.usuario));
  }),

  remove: asyncHandler(async (req, res) => {
    await service.remove(parseIdParam(req.params.id), req.usuario);
    res.status(200).json({ message: mensagemRemocao });
  }),
});
