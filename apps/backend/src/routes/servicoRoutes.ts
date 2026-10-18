import { Router } from "express";
import controller from "../controllers/servicoController";

const router = Router();

/**
 * @swagger
 * /servicos:
 *   post:
 *     summary: Cria um serviço
 *     tags: [Servicos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ServicoInput' }
 *     responses:
 *       201:
 *         description: Serviço criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Servico' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *   get:
 *     summary: Lista os serviços
 *     tags: [Servicos]
 *     responses:
 *       200:
 *         description: Lista de serviços
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Servico' }
 */
router.post("/", controller.create);
router.get("/", controller.list);

/**
 * @swagger
 * /servicos/{id}:
 *   get:
 *     summary: Busca um serviço por ID
 *     tags: [Servicos]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Serviço encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Servico' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   put:
 *     summary: Atualiza os campos enviados de um serviço
 *     tags: [Servicos]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ServicoUpdate' }
 *     responses:
 *       200:
 *         description: Serviço atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Servico' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   delete:
 *     summary: Remove um serviço sem agendamentos
 *     tags: [Servicos]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { $ref: '#/components/responses/Removido' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 */
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
