import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as controller from "../controllers/authController";

const router = Router();
router.post("/cadastro", asyncHandler(controller.cadastrar));
router.post("/login", asyncHandler(controller.entrar));
router.post("/google", asyncHandler(controller.entrarComGoogle));
router.get("/me", asyncHandler(controller.atual));
router.post("/logout", asyncHandler(controller.sair));

export default router;
