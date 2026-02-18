import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Product } from '../types';
import { ShoppingCart, Zap, CheckCircle } from 'lucide-react';

interface Props {
    onOrderCreated: () => void;
}

export const Marketplace: React.FC<Props> = ({ onOrderCreated }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);

    const fetchProducts = () => {
        api.getProducts().then(setProducts).catch(console.error);
    };

    useEffect(() => {
        fetchProducts();
        const interval = setInterval(fetchProducts, 3000); // poll every 3s
        return () => clearInterval(interval);
    }, []);

    const handleBuy = async (productId: string) => {
        setLoadingId(productId);
        try {
            await api.createOrder('user-frontend-' + Math.floor(Math.random() * 1000), productId);
            setSuccessId(productId);
            setTimeout(() => setSuccessId(null), 1500);
            onOrderCreated(); // Refresh dashboard
            fetchProducts();  // Immediately refresh stock
        } catch (e) {
            alert('Order failed to submit! Check console.');
            console.error(e);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Marketplace
            </h2>
            <div className="space-y-4">
                {products.map(product => {
                    const isLoading = loadingId === product.id;
                    const isSuccess = successId === product.id;
                    return (
                        <div key={product.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                            <div>
                                <div className="font-semibold text-lg">{product.name}</div>
                                <div className="text-gray-500">${product.price.toFixed(2)}</div>
                                <div className="text-xs text-gray-400">Stock: {product.stock}</div>
                            </div>
                            <button
                                onClick={() => handleBuy(product.id)}
                                disabled={isLoading || !!loadingId}
                                className={`px-4 py-2 rounded flex items-center gap-2 transition-all duration-200 font-medium
                                    ${isSuccess
                                        ? 'bg-green-500 text-white scale-95'
                                        : isLoading
                                            ? 'bg-gray-400 text-white cursor-wait'
                                            : 'bg-black text-white hover:bg-gray-800 active:scale-95'
                                    } disabled:opacity-60`}
                            >
                                {isSuccess ? (
                                    <><CheckCircle className="w-4 h-4" /> Ordered!</>
                                ) : isLoading ? (
                                    <><Zap className="w-4 h-4 animate-pulse" /> Ordering...</>
                                ) : (
                                    <><Zap className="w-4 h-4" /> Buy Now</>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
