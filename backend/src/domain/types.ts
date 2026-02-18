export enum OrderState {
    CREATED = 'CREATED',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
    INVENTORY_RESERVED = 'INVENTORY_RESERVED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export interface Order {
    id: string;
    userId: string;
    amount: number;
    items: Array<{ productId: string; quantity: number }>;
    state: OrderState;
    createdAt: Date;
    updatedAt: Date;
    version: number; // Optimistic locking
}

export interface OrderEvent {
    type: string;
    payload?: any;
}
