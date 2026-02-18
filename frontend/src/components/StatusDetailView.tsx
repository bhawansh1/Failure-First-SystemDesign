import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { QueueJob } from '../types';
import { X, AlertCircle, Clock, CheckCircle, RefreshCw } from 'lucide-react';

interface Props {
    status: string;
    onClose: () => void;
}

export const StatusDetailView: React.FC<Props> = ({ status, onClose }) => {
    const [jobs, setJobs] = useState<QueueJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await api.getOrdersByStatus(status);
                // Sort by timestamp desc
                const sorted = data.sort((a, b) => b.timestamp - a.timestamp);
                setJobs(sorted);
            } catch (error) {
                console.error('Failed to fetch jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
        // Poll for updates every 2s while open
        const interval = setInterval(fetchJobs, 2000);
        return () => clearInterval(interval);
    }, [status]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-bold capitalize flex items-center gap-2">
                        {status === 'failed' && <AlertCircle className="text-red-500" />}
                        {status === 'delayed' && <Clock className="text-purple-500" />}
                        {status === 'active' && <RefreshCw className="text-blue-500 animate-spin" />}
                        {status === 'completed' && <CheckCircle className="text-green-500" />}
                        {status} Orders
                        <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full ml-2">
                            {jobs.length}
                        </span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-gray-50/50">
                    {loading && jobs.length === 0 ? (
                        <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-gray-400" /></div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">No orders in this state.</div>
                    ) : (
                        <div className="space-y-3">
                            {jobs.map(job => (
                                <div key={job.jobId} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-mono text-sm font-bold text-gray-700">
                                                Order #{job.orderId ? job.orderId.split('-')[0] : 'Unknown'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5" title={new Date(job.timestamp).toLocaleString()}>
                                                Created: {new Date(job.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">
                                                ${job.order?.amount?.toFixed(2) || '0.00'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Attempt: {job.attemptsMade}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Failure Reason Section */}
                                    {status === 'failed' && job.failedReason && (
                                        <div className="mt-3 bg-red-50 text-red-700 text-sm p-3 rounded border border-red-100 font-mono break-all">
                                            <strong>Error:</strong> {job.failedReason}
                                        </div>
                                    )}

                                    {/* Delay Section */}
                                    {status === 'delayed' && job.delay && (
                                        <div className="mt-3 bg-purple-50 text-purple-700 text-sm p-3 rounded border border-purple-100 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                Retrying in {((Number(job.processedOn || job.timestamp) + Number(job.delay) - Date.now()) / 1000).toFixed(1)}s
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
