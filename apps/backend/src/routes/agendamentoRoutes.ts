import { Router } from "express";
import controller from "../controllers/agendamentoController";

const router = Router();

/**
 * @swagger
 * /agendamentos:
 *   post:
 *     summary: Cria um agendamento
 *     description: >
 *       O fim precisa ser posterior ao início e o animal precisa pertencer ao usuário informado.
 *     tags: [Agendamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AgendamentoInput' }
 *     responses:
 *       201:
 *         description: Agendamento criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Agendamento' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   get:
 *     summary: Lista os agendamentos
 *     tags: [Agendamentos]
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Agendamento' }
 */
router.post("/", controller.create);
router.get("/", controller.list);

/**
 * @swagger
 * /agendamentos/{id}:
 *   get:
 *     summary: Busca um agendamento por ID
 *     tags: [Agendamentos]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Agendamento encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Agendamento' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   put:
 *     summary: Atualiza os campos enviados de um agendamento
 *     description: As regras de horário e de dono do animal valem para o resultado final.
 *     tags: [Agendamentos]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AgendamentoUpdate' }
 *     responses:
 *       200:
 *         description: Agendamento atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Agendamento' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   delete:
 *     summary: Remove um agendamento
 *     tags: [Agendamentos]
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
