export class PaymentGatewaySimulator {
    private failureRate: number; // 0 to 1

    constructor(failureRate: number = 0.5) {
        this.failureRate = failureRate;
    }

    setFailureRate(rate: number) {
        if (rate < 0 || rate > 1) throw new Error('Rate must be between 0 and 1');
        this.failureRate = rate;
    }

    async charge(amount: number): Promise<{ success: boolean; transactionId?: string; error?: string }> {
        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        // Simulate failure
        if (Math.random() < this.failureRate) {
            const errorTypes = ['TIMEOUT', 'INSUFFICIENT_FUNDS', 'GATEWAY_ERROR'];
            const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
            return { success: false, error };
        }

        return { success: true, transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}` };
    }
}

export const paymentSimulator = new PaymentGatewaySimulator();
