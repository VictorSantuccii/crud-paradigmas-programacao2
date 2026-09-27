import { Router } from "express";
import controller from "../controllers/funcionarioController";

const router = Router();

/**
 * @swagger
 * /funcionarios:
 *   post:
 *     summary: Cria um funcionário
 *     tags: [Funcionarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FuncionarioInput' }
 *     responses:
 *       201:
 *         description: Funcionário criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Funcionario' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *   get:
 *     summary: Lista os funcionários
 *     tags: [Funcionarios]
 *     responses:
 *       200:
 *         description: Lista de funcionários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Funcionario' }
 */
router.post("/", controller.create);
router.get("/", controller.list);

/**
 * @swagger
 * /funcionarios/{id}:
 *   get:
 *     summary: Busca um funcionário por ID
 *     tags: [Funcionarios]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200:
 *         description: Funcionário encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Funcionario' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   put:
 *     summary: Atualiza os campos enviados de um funcionário
 *     tags: [Funcionarios]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FuncionarioUpdate' }
 *     responses:
 *       200:
 *         description: Funcionário atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Funcionario' }
 *       400: { $ref: '#/components/responses/RequisicaoInvalida' }
 *       404: { $ref: '#/components/responses/NaoEncontrado' }
 *   delete:
 *     summary: Remove um funcionário sem agendamentos
 *     tags: [Funcionarios]
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
