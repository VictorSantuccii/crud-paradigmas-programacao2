import { Router } from "express";
import controller from "../controllers/assinaturaController";

const router = Router();

/**
 * @swagger
 * /assinaturas:
 *   post:
 *     summary: Cria uma assinatura de um usuário em um plano
 *     tags: [Assinaturas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AssinaturaInput' }
 *     responses:
 *       201:
 *         description: Assinatura criada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Assinatura' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   get:
 *     summary: Lista as assinaturas
 *     tags: [Assinaturas]
 *     responses:
 *       200:
 *         description: Lista de assinaturas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Assinatura' }
 */
router.post("/", controller.create);
router.get("/", controller.list);

/**
 * @swagger
 * /assinaturas/{id}:
 *   get:
 *     summary: Busca uma assinatura por ID
 *     tags: [Assinaturas]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Assinatura encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Assinatura' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   put:
 *     summary: Atualiza os campos enviados de uma assinatura
 *     tags: [Assinaturas]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AssinaturaUpdate' }
 *     responses:
 *       200:
 *         description: Assinatura atualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Assinatura' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   delete:
 *     summary: Remove uma assinatura
 *     tags: [Assinaturas]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { $ref: '#/components/responses/Removido' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 */
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
