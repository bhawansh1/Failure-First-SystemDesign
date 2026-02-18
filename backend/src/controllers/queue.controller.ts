import { Request, Response } from 'express';
import { orderQueue } from '../workers/order.queue';
import prisma from '../config/prisma';
import { Job } from 'bullmq';
import { OrderState } from '../domain/types';

export const getOrdersByStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.params;
        console.log(`[DEBUG] getOrdersByStatus requested for status: ${status}`);
        let jobs: Job[] = [];

        switch (status) {
            case 'waiting':
                jobs = await orderQueue.getWaiting();
                break;
            case 'active':
                jobs = await orderQueue.getActive();
                break;
            case 'delayed':
                jobs = await orderQueue.getDelayed();
                break;
            case 'completed':
            case 'failed':
                // For historical states, pull from DB as source of truth
                const stateFilter = status === 'completed'
                    ? [OrderState.COMPLETED]
                    : [OrderState.PAYMENT_FAILED, OrderState.CANCELLED];

                const dbOrders = await prisma.order.findMany({
                    where: { state: { in: stateFilter } },
                    include: { items: true },
                    orderBy: { updatedAt: 'desc' },
                    take: 50
                });

                console.log(`[DEBUG] Found ${dbOrders.length} orders in DB for state: ${status}`);
                return res.json(dbOrders.map(order => ({
                    orderId: order.id,
                    jobId: `db-${order.id}`,
                    failedReason: (order as any).lastError || null,
                    timestamp: order.createdAt.getTime(),
                    processedOn: order.updatedAt.getTime(),
                    attemptsMade: 0, // We don't track historic attempts in DB yet
                    order: order
                })));
            default:
                res.status(400).json({ error: 'Invalid status' });
                return;
        }

        // Extract Order IDs for queue-resident jobs (waiting, active, delayed)
        const jobData = jobs.map(job => ({
            orderId: job.data.orderId,
            jobId: job.id,
            failedReason: job.failedReason,
            stacktrace: job.stacktrace,
            timestamp: job.timestamp,
            finishedOn: job.finishedOn,
            processedOn: job.processedOn,
            attemptsMade: job.attemptsMade,
            delay: job.opts.delay
        }));

        const orderIds = jobData.map(j => j.orderId);

        // Fetch Orders from DB
        const orders = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            include: { items: true }
        });

        // Merge Data
        const result = jobData.map(job => {
            const order = orders.find(o => o.id === job.orderId);
            return {
                ...job,
                order: order || null
            };
        });

        res.json(result);

    } catch (error) {
        console.error('Error fetching queue jobs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
