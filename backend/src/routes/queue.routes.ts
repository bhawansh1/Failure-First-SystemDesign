import { Router } from 'express';
import { getOrdersByStatus } from '../controllers/queue.controller';

const router = Router();

router.get('/:status', getOrdersByStatus);

export default router;
