import prisma from '../config/prisma';
import { OrderStateMachine } from '../domain/stateMachine';
import { OrderState } from '../domain/types';
import { orderQueue } from '../workers/order.queue';

export class OrderService {
    async createOrder(userId: string, items: { productId: string; quantity: number }[]) {
        // 1. Calculate total (simplified)
        const productIds = items.map(i => i.productId);
        const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

        let total = 0;
        const orderItemsData = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            total += product.price * item.quantity;
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            };
        });

        // 2. Reserve Inventory (Sync Check or Simulator)
        // Here we just check, actual reservation happens in worker or saga?
        // For simplicity: Create Order -> PENDING -> Queue.
        // If Inventory sim fails in Worker, we cancel.

        // 3. Create Order
        const order = await prisma.order.create({
            data: {
                userId,
                amount: total,
                state: OrderState.CREATED,
                items: {
                    create: orderItemsData
                }
            },
            include: { items: true }
        });

        // 4. Enqueue Job
        await orderQueue.add('process-order', { orderId: order.id });

        return order;
    }

    async transitionState(orderId: string, nextState: OrderState) {
        const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

        // Validate transition
        OrderStateMachine.transition(order.state as OrderState, nextState);

        // Update state
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { state: nextState }
        });

        return updatedOrder;
    }

    async getOrder(id: string) {
        return prisma.order.findUnique({ where: { id }, include: { items: true } });
    }
}
