import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import prisma from '../config/prisma';
import { z } from 'zod';

const orderService = new OrderService();

const createOrderSchema = z.object({
    userId: z.string().uuid().or(z.string()),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().min(1)
    })).min(1)
});

export const createOrder = async (req: Request, res: Response) => {
    try {
        const validatedData = createOrderSchema.parse(req.body);
        const order = await orderService.createOrder(validatedData.userId, validatedData.items);
        res.status(201).json(order);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: (error as any).errors });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export const getOrder = async (req: Request, res: Response) => {
    try {
        const order = await orderService.getOrder(req.params.id as string);
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const listOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { items: true }
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
