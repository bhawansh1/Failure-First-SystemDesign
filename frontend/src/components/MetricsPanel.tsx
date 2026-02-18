import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { QueueMetrics } from '../types';

interface Props {
    onStatusSelect: (status: string) => void;
}

export const MetricsPanel: React.FC<Props> = ({ onStatusSelect }) => {
    const [metrics, setMetrics] = useState<QueueMetrics | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await api.getMetrics();
                setMetrics(data);
            } catch (e) {
                console.error(e);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!metrics) return <div className="p-4 bg-gray-100 rounded animate-pulse">Loading Metrics...</div>;

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <MetricCard title="Waiting" value={metrics.waiting} color="bg-yellow-100 text-yellow-800 border-yellow-200" onClick={() => onStatusSelect('waiting')} />
            <MetricCard title="Active" value={metrics.active} color="bg-blue-100 text-blue-800 border-blue-200" onClick={() => onStatusSelect('active')} />
            <MetricCard title="Completed" value={metrics.completed} color="bg-green-100 text-green-800 border-green-200" onClick={() => onStatusSelect('completed')} />
            <MetricCard title="Failed" value={metrics.failed} color="bg-red-100 text-red-800 border-red-200" onClick={() => onStatusSelect('failed')} />
            <MetricCard title="Delayed" value={metrics.delayed} color="bg-purple-100 text-purple-800 border-purple-200" onClick={() => onStatusSelect('delayed')} />
        </div>
    );
};

const MetricCard = ({ title, value, color, onClick }: { title: string, value: number, color: string, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-xl border shadow-sm ${color} flex flex-col items-center cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-95`}
    >
        <span className="text-3xl font-black">{value}</span>
        <span className="text-xs uppercase tracking-wider opacity-75 font-semibold mt-1">{title}</span>
    </div>
);
