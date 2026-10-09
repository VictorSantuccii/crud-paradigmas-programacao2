import { Router } from "express";
import controller from "../controllers/animalController";

const router = Router();

/**
 * @swagger
 * /animais:
 *   post:
 *     summary: Cria um animal para um usuário
 *     tags: [Animais]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AnimalInput' }
 *     responses:
 *       201:
 *         description: Animal criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Animal' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   get:
 *     summary: Lista os animais
 *     tags: [Animais]
 *     responses:
 *       200:
 *         description: Lista de animais
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Animal' }
 */
router.post("/", controller.create);
router.get("/", controller.list);

/**
 * @swagger
 * /animais/{id}:
 *   get:
 *     summary: Busca um animal por ID
 *     tags: [Animais]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Animal encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Animal' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   put:
 *     summary: Atualiza os campos enviados de um animal
 *     description: Trocar o dono é bloqueado se o animal tiver agendamentos.
 *     tags: [Animais]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AnimalUpdate' }
 *     responses:
 *       200:
 *         description: Animal atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Animal' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *       409: { $ref: '#/components/responses/Conflito' }
 *   delete:
 *     summary: Remove um animal sem agendamentos
 *     tags: [Animais]
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
