import React, { useEffect, useState } from 'react';
import { Order, OrderState } from '../types';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Filter, X } from 'lucide-react';

interface Props {
    refreshTrigger: number;
    filterStatus?: string | null;
    onClearFilter?: () => void;
}

export const OrderDashboard: React.FC<Props> = ({ refreshTrigger, filterStatus, onClearFilter }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/orders');
            const data = await response.json();
            setOrders(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchOrders();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 2000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const getStatusIcon = (state: OrderState) => {
        switch (state) {
            case OrderState.COMPLETED: return <CheckCircle className="text-green-500 w-5 h-5" />;
            case OrderState.PAYMENT_FAILED: return <XCircle className="text-red-500 w-5 h-5" />;
            case OrderState.CANCELLED: return <XCircle className="text-gray-500 w-5 h-5" />;
            case OrderState.PAYMENT_PENDING: return <RefreshCw className="text-blue-500 animate-spin w-5 h-5" />;
            case OrderState.CREATED: return <Clock className="text-gray-400 w-5 h-5" />;
            default: return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
        }
    };

    const getStatusColor = (state: OrderState) => {
        switch (state) {
            case OrderState.COMPLETED: return 'bg-green-50 border-green-200';
            case OrderState.PAYMENT_FAILED: return 'bg-red-50 border-red-200';
            case OrderState.CANCELLED: return 'bg-gray-50 border-gray-200';
            case OrderState.PAYMENT_PENDING: return 'bg-blue-50 border-blue-200';
            default: return 'bg-yellow-50 border-yellow-200';
        }
    };

    // Map metric status names to OrderState values
    const statusToOrderState: Record<string, OrderState[]> = {
        completed: [OrderState.COMPLETED],
        failed: [OrderState.PAYMENT_FAILED, OrderState.CANCELLED],
        active: [OrderState.PAYMENT_PENDING],
        waiting: [OrderState.CREATED],
        delayed: [OrderState.PAYMENT_PENDING, OrderState.CREATED],
    };

    const filteredOrders = filterStatus
        ? orders.filter(o => statusToOrderState[filterStatus]?.includes(o.state))
        : orders;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    Order Stream
                    {filterStatus && (
                        <span className="flex items-center gap-1 text-sm font-normal bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                            <Filter className="w-3 h-3" />
                            {filterStatus}
                            <button
                                onClick={onClearFilter}
                                className="ml-1 hover:text-red-500 transition-colors"
                                title="Clear filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </span>
                <button
                    onClick={handleManualRefresh}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredOrders.map(order => (
                    <div
                        key={order.id}
                        className={`p-4 rounded border flex justify-between items-center ${getStatusColor(order.state)} transition-all`}
                    >
                        <div className="flex items-center gap-3">
                            {getStatusIcon(order.state)}
                            <div>
                                <div className="font-mono text-sm opacity-50">{order.id.split('-')[0]}...</div>
                                <div className="font-semibold text-sm">{order.state}</div>
                                <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                            </div>
                        </div>
                        <div className="font-bold">${order.amount.toFixed(2)}</div>
                    </div>
                ))}
                {filteredOrders.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                        {filterStatus
                            ? `No orders with status "${filterStatus}" in history`
                            : 'No orders yet — click Buy Now to place an order!'}
                    </div>
                )}
            </div>
        </div>
    );
};
