import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

const metricsService = new MetricsService();

export const getMetrics = async (req: Request, res: Response) => {
    try {
        const metrics = await metricsService.getQueueMetrics();
        res.json(metrics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const resetMetrics = async (req: Request, res: Response) => {
    try {
        await metricsService.reset();
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
