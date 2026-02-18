import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
