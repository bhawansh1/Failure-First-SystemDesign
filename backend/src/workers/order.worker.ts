import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { ORDER_QUEUE_NAME } from './order.queue';
import prisma from '../config/prisma';
import { OrderState } from '../domain/types';
import { OrderStateMachine } from '../domain/stateMachine';
import { paymentSimulator } from '../services/payment.simulator';
import { inventorySimulator } from '../services/inventory.simulator';

// Helper to update state
async function transitionState(orderId: string, nextState: OrderState, error?: string) {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

    // If state is same, just update metadata (error) without state machine check
    if (order.state === nextState) {
        if (order.lastError !== (error || null)) {
            await prisma.order.update({
                where: { id: orderId },
                data: { lastError: error || null }
            });
        }
        return;
    }

    // Validate transition for state changes
    OrderStateMachine.transition(order.state as OrderState, nextState);
    await prisma.order.update({
        where: { id: orderId },
        data: {
            state: nextState,
            lastError: error || null
        }
    });
}

export const orderWorker = new Worker(ORDER_QUEUE_NAME, async (job: Job) => {
    const { orderId } = job.data;
    console.log(`Processing order ${orderId}, attempt ${job.attemptsMade + 1}`);

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error('Order not found');

    // If cancelled, stop
    if (order.state === OrderState.CANCELLED) return;

    // Logic moved from OrderService
    try {
        // 1. Pre-checkpoint: Check stock before starting payment to fail early
        const initialProducts = await prisma.product.findMany({
            where: { id: { in: order.items.map(i => i.productId) } }
        });

        for (const item of order.items) {
            const product = initialProducts.find(p => p.id === item.productId);
            if (!product || product.stock < item.quantity) {
                throw new Error('OUT_OF_STOCK');
            }
        }

        // 2. Payment
        if (order.state === OrderState.CREATED || order.state === OrderState.PAYMENT_FAILED) {
            await transitionState(order.id, OrderState.PAYMENT_PENDING);
            const paymentResult = await paymentSimulator.charge(order.amount);

            if (!paymentResult.success) {
                if (paymentResult.error === 'GATEWAY_ERROR' || paymentResult.error === 'TIMEOUT') {
                    await transitionState(order.id, OrderState.PAYMENT_FAILED);
                    throw new Error(`Payment failed: ${paymentResult.error}`); // Throwing triggers BullMQ retry
                } else {
                    // Non-retriable error (e.g. INSUFFICIENT_FUNDS)
                    await transitionState(order.id, OrderState.PAYMENT_FAILED);
                    throw new Error(`Payment failed: ${paymentResult.error}`);
                }
            }

            await transitionState(order.id, OrderState.PAYMENT_SUCCESS);
        }

        // 3. Inventory — atomic check-and-decrement
        await transitionState(order.id, OrderState.INVENTORY_RESERVED);

        await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product || product.stock < item.quantity) {
                    throw new Error('OUT_OF_STOCK');
                }

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }
        });

        // Finalize
        await transitionState(order.id, OrderState.COMPLETED);
        console.log(`Order ${orderId} completed successfully`);

    } catch (e: any) {
        if (e.message === 'OUT_OF_STOCK') {
            console.warn(`Order ${orderId} cancelled due to insufficient stock`);
            await transitionState(orderId, OrderState.CANCELLED, 'Out of stock');
            return; // Terminal state, don't retry in BullMQ
        }

        console.error(`Job failed for order ${orderId}: ${e.message}`);
        // Persist error to DB
        await transitionState(orderId, OrderState.PAYMENT_FAILED, e.message);
        throw e; // Triggers retry
    }

}, {
    connection: redisConnection
});

orderWorker.on('completed', job => {
    console.log(`Job ${job.id} completed!`);
});

orderWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed with ${err.message}`);
});
