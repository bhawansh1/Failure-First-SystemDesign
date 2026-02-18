export class InventorySimulator {
    async reserve(items: { productId: string; quantity: number }[]): Promise<boolean> {
        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));

        // Random failure
        if (Math.random() < 0.1) { // 10% chance of inventory failure
            return false;
        }
        return true;
    }

    async release(items: { productId: string; quantity: number }[]) {
        // No-op for now
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

export const inventorySimulator = new InventorySimulator();
