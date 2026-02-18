import { OrderState } from './types';

// Valid transitions map
const transitions: Record<OrderState, OrderState[]> = {
    [OrderState.CREATED]: [OrderState.PAYMENT_PENDING, OrderState.CANCELLED],
    [OrderState.PAYMENT_PENDING]: [OrderState.PAYMENT_SUCCESS, OrderState.PAYMENT_FAILED, OrderState.CANCELLED],
    [OrderState.PAYMENT_FAILED]: [OrderState.PAYMENT_PENDING, OrderState.CANCELLED], // Retry payment
    [OrderState.PAYMENT_SUCCESS]: [OrderState.INVENTORY_RESERVED, OrderState.CANCELLED], // Refund if cancelled here
    [OrderState.INVENTORY_RESERVED]: [OrderState.COMPLETED, OrderState.CANCELLED],
    [OrderState.CANCELLED]: [], // Terminal state
    [OrderState.COMPLETED]: [], // Terminal state
};

export class OrderStateMachine {
    static canTransition(currentState: OrderState, nextState: OrderState): boolean {
        const validNextStates = transitions[currentState];
        return validNextStates ? validNextStates.includes(nextState) : false;
    }

    static transition(currentState: OrderState, nextState: OrderState): OrderState {
        if (!this.canTransition(currentState, nextState)) {
            throw new Error(`Invalid transition from ${currentState} to ${nextState}`);
        }
        return nextState;
    }
}
