import { Router } from 'express';
import { createOrder, getOrder, listOrders } from '../controllers/order.controller';
import { idempotency } from '../middleware/idempotency';

const router = Router();

router.post('/', idempotency, createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);

export default router;
