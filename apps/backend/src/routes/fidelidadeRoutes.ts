import { Router } from 'express';
import controller from '../controllers/fidelidadeController';
const router = Router();
router.get('/', controller.list);
router.get('/me', controller.me);
router.get('/:id', controller.getById);
router.post('/:id/ajustes', controller.ajustar);
export default router;
