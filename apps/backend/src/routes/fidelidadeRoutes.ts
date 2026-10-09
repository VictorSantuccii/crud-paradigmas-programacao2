import { Router } from "express";
import controller from "../controllers/fidelidadeController";

const router = Router();

/**
 * @swagger
 * /fidelidades:
 *   post:
 *     summary: Cria uma fidelidade
 *     tags: [Fidelidades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FidelidadeInput' }
 *     responses:
 *       201:
 *         description: Fidelidade criada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Fidelidade' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *   get:
 *     summary: Lista as fidelidades
 *     tags: [Fidelidades]
 *     responses:
 *       200:
 *         description: Lista de fidelidades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Fidelidade' }
 */
router.post("/", controller.create);
router.get("/", controller.list);

/**
 * @swagger
 * /fidelidades/{id}:
 *   get:
 *     summary: Busca uma fidelidade por ID
 *     tags: [Fidelidades]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Fidelidade encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Fidelidade' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   put:
 *     summary: Atualiza os campos enviados de uma fidelidade
 *     tags: [Fidelidades]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FidelidadeUpdate' }
 *     responses:
 *       200:
 *         description: Fidelidade atualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Fidelidade' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   delete:
 *     summary: Remove uma fidelidade que não esteja ligada a um usuário
 *     tags: [Fidelidades]
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
