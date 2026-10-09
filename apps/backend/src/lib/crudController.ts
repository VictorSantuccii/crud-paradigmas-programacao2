import { asyncHandler } from "./asyncHandler";
import { parseIdParam } from "./parsers";

interface CrudService {
  list: () => Promise<unknown>;
  getById: (id: number) => Promise<unknown>;
  create: (body: unknown) => Promise<unknown>;
  update: (id: number, body: unknown) => Promise<unknown>;
  remove: (id: number) => Promise<void>;
}

export const crudController = (service: CrudService, mensagemRemocao: string) => ({
  list: asyncHandler(async (_req, res) => {
    res.status(200).json(await service.list());
  }),

  getById: asyncHandler(async (req, res) => {
    res.status(200).json(await service.getById(parseIdParam(req.params.id)));
  }),

  create: asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body));
  }),

  update: asyncHandler(async (req, res) => {
    res.status(200).json(await service.update(parseIdParam(req.params.id), req.body));
  }),

  remove: asyncHandler(async (req, res) => {
    await service.remove(parseIdParam(req.params.id));
    res.status(200).json({ message: mensagemRemocao });
  }),
});
