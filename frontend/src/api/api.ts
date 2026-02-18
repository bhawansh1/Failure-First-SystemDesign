import axios from 'axios';
import { Order, Product, QueueMetrics, QueueJob } from '../types';

const API_URL = 'http://localhost:3000/api';

export const api = {
    getProducts: async (): Promise<Product[]> => {
        // In a real app we would have a proper endpoint, but for now we hardcode or fetch via hack
        // Let's implement a quick GET /products in backend to make this real
        // For now, I'll return hardcoded to match seed if endpoint missing, 
        // but I CAN create the endpoint in backend quickly.
        // Let's assume I will add it.
        const response = await axios.get(`${API_URL}/products`);
        return response.data;
    },

    createOrder: async (userId: string, productId: string): Promise<Order> => {
        const idempotencyKey = `idemp-${Date.now()}-${Math.random()}`;
        const response = await axios.post(`${API_URL}/orders`, {
            userId,
            items: [{ productId, quantity: 1 }]
        }, {
            headers: { 'Idempotency-Key': idempotencyKey }
        });
        return response.data;
    },

    getOrder: async (id: string): Promise<Order> => {
        const response = await axios.get(`${API_URL}/orders/${id}`);
        return response.data;
    },

    getMetrics: async (): Promise<QueueMetrics> => {
        const response = await axios.get(`${API_URL}/metrics`);
        return response.data;
    },

    getOrdersByStatus: async (status: string): Promise<QueueJob[]> => {
        const response = await axios.get(`${API_URL}/queue/${status}`);
        return response.data;
    },

    resetSystem: async (): Promise<void> => {
        await axios.post(`${API_URL}/metrics/reset`);
    }
};
