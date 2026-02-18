export enum OrderState {
    CREATED = 'CREATED',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
    INVENTORY_RESERVED = 'INVENTORY_RESERVED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

export interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    userId: string;
    amount: number;
    state: OrderState;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface QueueMetrics {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

export interface QueueJob {
    jobId: string;
    orderId: string;
    failedReason: string;
    stacktrace: string[];
    timestamp: number;
    finishedOn?: number;
    processedOn?: number;
    attemptsMade: number;
    delay?: number;
    order: Order | null;
}
