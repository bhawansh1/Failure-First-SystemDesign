import { useState } from 'react';
import { api } from './api/api';
import { MetricsPanel } from './components/MetricsPanel';
import { Marketplace } from './components/Marketplace';
import { OrderDashboard } from './components/OrderDashboard';
import { StatusDetailView } from './components/StatusDetailView';
import { AlertTriangle, ServerCrash } from 'lucide-react';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null); // for modal (failed/delayed)
  const [streamFilter, setStreamFilter] = useState<string | null>(null); // for stream filter

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleStatusSelect = (status: string) => {
    // Always filter the stream
    setStreamFilter(prev => prev === status ? null : status);
    // Only open the detail modal for failed/delayed (queue-level data)
    if (status === 'failed' || status === 'delayed') {
      setSelectedStatus(status);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset everything? This will clear all orders and reset product stock.')) {
      try {
        await api.resetSystem();
        window.location.reload();
      } catch (e) {
        console.error('Reset failed', e);
        alert('Reset failed. Check console.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
            <ServerCrash className="text-red-600" />
            <span>FAILURE<span className="text-gray-400 font-light">FIRST</span></span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button
              onClick={handleReset}
              className="text-gray-500 hover:text-red-600 transition-colors px-3 py-1 rounded-full border border-gray-200 hover:border-red-100 hover:bg-red-50"
            >
              Reset Session
            </button>
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> System Online
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resiliency Dashboard</h1>
          <p className="text-gray-500 max-w-2xl">
            This system is designed to handle failures gracefully.
            The <strong>Marketplace</strong> triggers orders which are processed asynchronously by a <strong>Retry Queue</strong>.
            Payment failures (50% chance) are retried automatically with exponential backoff.
          </p>
        </div>

        <MetricsPanel onStatusSelect={handleStatusSelect} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <Marketplace onOrderCreated={triggerRefresh} />

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <strong>Chaos Enabled:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-1 opacity-90">
                    <li>50% Payment Failure Rate</li>
                    <li>10% Inventory Reservation Failure</li>
                    <li>Exponential Backoff Retries (1s, 2s, 4s...)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <OrderDashboard
              refreshTrigger={refreshTrigger}
              filterStatus={streamFilter}
              onClearFilter={() => setStreamFilter(null)}
            />
          </div>
        </div>
      </main>

      {selectedStatus && (
        <StatusDetailView
          status={selectedStatus}
          onClose={() => setSelectedStatus(null)}
        />
      )}
    </div>
  );
}

export default App;
