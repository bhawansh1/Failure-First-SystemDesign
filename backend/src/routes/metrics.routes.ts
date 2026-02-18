import { Router } from 'express';
import { getMetrics, resetMetrics } from '../controllers/metrics.controller';

const router = Router();

router.get('/', getMetrics);
router.post('/reset', resetMetrics);

export default router;
