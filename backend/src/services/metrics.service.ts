import { orderQueue } from '../workers/order.queue';
import prisma from '../config/prisma';
import { OrderState } from '../domain/types';

export class MetricsService {
    async getQueueMetrics() {
        const [waiting, active, delayed, completedCount, failedCount] = await Promise.all([
            orderQueue.getWaitingCount(),
            orderQueue.getActiveCount(),
            orderQueue.getDelayedCount(),
            prisma.order.count({ where: { state: OrderState.COMPLETED } }),
            prisma.order.count({ where: { state: { in: [OrderState.PAYMENT_FAILED, OrderState.CANCELLED] } } }),
        ]);

        return {
            waiting,
            active,
            completed: completedCount,
            failed: failedCount,
            delayed,
        };
    }

    async reset() {
        // 1. Clear BullMQ
        await orderQueue.drain();
        await orderQueue.obliterate({ force: true });

        // 2. Clear Database
        await prisma.$transaction([
            prisma.orderItem.deleteMany(),
            prisma.order.deleteMany(),
            // Reset stock
            prisma.product.updateMany({ where: { name: 'Laptop' }, data: { stock: 100 } }),
            prisma.product.updateMany({ where: { name: 'Headphones' }, data: { stock: 50 } }),
            prisma.product.updateMany({ where: { name: 'Mouse' }, data: { stock: 200 } }),
            prisma.product.updateMany({ where: { name: 'Keyboard' }, data: { stock: 150 } }),
        ]);

        console.log('System state reset successfully');
    }
}
