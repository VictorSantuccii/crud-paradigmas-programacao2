import { Router } from "express";
import controller from "../controllers/planoController";

const router = Router();

/**
 * @swagger
 * /planos:
 *   post:
 *     summary: Cria um plano
 *     tags: [Planos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PlanoInput' }
 *     responses:
 *       201:
 *         description: Plano criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Plano' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *   get:
 *     summary: Lista os planos
 *     tags: [Planos]
 *     responses:
 *       200:
 *         description: Lista de planos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Plano' }
 */
router.post("/", controller.create);
router.get("/", controller.list);

/**
 * @swagger
 * /planos/{id}:
 *   get:
 *     summary: Busca um plano por ID
 *     tags: [Planos]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Plano encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Plano' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   put:
 *     summary: Atualiza os campos enviados de um plano
 *     tags: [Planos]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PlanoUpdate' }
 *     responses:
 *       200:
 *         description: Plano atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Plano' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   delete:
 *     summary: Remove um plano sem assinaturas
 *     tags: [Planos]
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
