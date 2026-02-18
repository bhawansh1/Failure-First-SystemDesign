import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

export const idempotency = async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['idempotency-key'] as string;

    if (!key) {
        return next();
    }

    try {
        const existing = await prisma.idempotencyKey.findUnique({
            where: { key },
        });

        if (existing) {
            if (existing.response) {
                // Return cached response
                return res.status(existing.statusCode || 200).json(JSON.parse(existing.response));
            }

            if (existing.locked) {
                return res.status(409).json({ error: 'Request in progress' });
            }
        }

        // Create lock
        await prisma.idempotencyKey.create({
            data: {
                key,
                method: req.method,
                path: req.path,
                params: JSON.stringify(req.body),
                locked: true,
            },
        });

        // Hook into response to save result
        const originalSend = res.json;
        res.json = function (body) {
            // Save response asynchronously
            prisma.idempotencyKey.update({
                where: { key },
                data: {
                    response: JSON.stringify(body),
                    statusCode: res.statusCode,
                    locked: false,
                },
            }).catch(err => console.error('Failed to save idempotency response', err));

            return originalSend.call(this, body);
        };

        next();
    } catch (error) {
        console.error('Idempotency error', error);
        next(error);
    }
};
