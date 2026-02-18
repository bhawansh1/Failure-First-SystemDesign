import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const ORDER_QUEUE_NAME = 'order-processing';

export const orderQueue = new Queue(ORDER_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 5, // Retry up to 5 times
        backoff: {
            type: 'exponential',
            delay: 1000, // Initial delay 1s, then 2s, 4s, 8s, 16s
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for DLQ inspection
    },
});
