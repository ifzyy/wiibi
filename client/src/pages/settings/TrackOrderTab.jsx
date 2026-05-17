import { useState, useEffect } from 'react';
import OrderCard from './OrderCard.jsx';
import {
   Package,

} from 'lucide-react';
import api from '../../utils/api.js';


// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all';

// ── Status badge ──────────────────────────────────────────────────────────────
const statusColors = {
  pending:    'bg-yellow-50 text-yellow-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped:    'bg-purple-50 text-purple-600',
  delivered:  'bg-green-50 text-green-600',
  cancelled:  'bg-red-50 text-red-500',
};
const StatusBadge = ({ status }) => (
  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-500'}`}>
    {status}
  </span>
);

// ══════════════════════════════════════════════════════════════════════════════
// Track Order tab (Grid Layout)
// ══════════════════════════════════════════════════════════════════════════════
const TrackOrderTab = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All'); // All, Active, Completed, Failed
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then((res) => setOrders(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
console.log(orders)
  const filteredOrders = orders.filter(o => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['pending', 'processing', 'shipped'].includes(o.status);
    if (filter === 'Completed') return o.status === 'delivered';
    if (filter === 'Failed') return o.status === 'failed' || o.status === 'cancelled';
    return true;
  });

  const FilterBtn = ({ label, count }) => (
    <button 
      onClick={() => setFilter(label)}
      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
        filter === label ? 'bg-[#FFAA14] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
      }`}
    >
      {label} {count !== undefined && <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === label ? 'bg-white/20' : 'bg-gray-200'}`}>{count}</span>}
    </button>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-8 border-b border-gray-50 pb-4">
        <FilterBtn label="All" />
        <FilterBtn label="Active" count={orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length} />
        <FilterBtn label="Completed" />
        <FilterBtn label="Failed" />
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-6">Track Order</h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-gray-100 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No {filter.toLowerCase()} orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-2">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackOrderTab;