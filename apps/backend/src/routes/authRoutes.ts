import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as controller from "../controllers/authController";

import { autenticar } from "../lib/session";

const router = Router();
router.post("/cadastro", asyncHandler(controller.cadastrar));
router.post("/login", asyncHandler(controller.entrar));
router.post("/google", asyncHandler(controller.entrarComGoogle));
router.get("/me", autenticar, asyncHandler(controller.atual));
router.put("/me", autenticar, asyncHandler(controller.atualizar));
router.get("/onboarding", asyncHandler(controller.onboarding));
router.put("/onboarding", asyncHandler(controller.concluir));
router.post("/logout", asyncHandler(controller.sair));

export default router;
