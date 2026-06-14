/**
 * SupportTickets.jsx — customer's support inbox (list view).
 *
 * Lists the logged-in user's tickets (GET /support/tickets). Clicking one
 * opens the thread at /account/support/:ticketNumber. Rendered inside the
 * account shell, so auth is already enforced by the /account ProtectedRoute.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, Plus, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';

const STATUS_CFG = {
  open:             { label: 'Open',              bg: 'bg-blue-50',   text: 'text-blue-600'   },
  in_progress:      { label: 'In progress',       bg: 'bg-amber-50',  text: 'text-amber-600'  },
  waiting_customer: { label: 'Awaiting your reply', bg: 'bg-orange-50', text: 'text-orange-600' },
  resolved:         { label: 'Resolved',          bg: 'bg-green-50',  text: 'text-green-600'  },
  closed:           { label: 'Closed',            bg: 'bg-gray-100',  text: 'text-gray-500'   },
};

const TYPE_LABEL = {
  inquiry:        'General inquiry',
  complaint:      'Complaint',
  request:        'Request',
  refund_request: 'Return / refund',
  technical:      'Technical issue',
  other:          'Other',
};

const fmtDate = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] ?? STATUS_CFG.open;
  return (
    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

export default function SupportTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    api.get('/support/tickets')
      .then(r => setTickets(r.data?.data ?? r.data?.tickets ?? r.data ?? []))
      .catch(e => setError(e?.response?.data?.message ?? 'Could not load your tickets.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="text-[#1A1102]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Support</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your conversations with our team</p>
        </div>
        <button
          onClick={() => navigate('/support')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFAA14] text-white font-bold text-sm hover:bg-[#e69912] transition-colors"
        >
          <Plus size={15} /> New request
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-red-400 shrink-0" />
          <p className="text-[13px] text-red-500 font-medium">{error}</p>
          <button onClick={load} className="ml-auto text-[13px] font-bold text-red-500 underline">Retry</button>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LifeBuoy size={24} className="text-[#FFAA14]" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">No support requests yet</p>
          <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto">
            Need help with an order or have a question? Start a conversation with our team.
          </p>
          <button
            onClick={() => navigate('/support')}
            className="px-6 py-3 rounded-xl bg-[#FFAA14] text-white font-bold text-sm hover:bg-[#e69912] transition-colors"
          >
            Contact support
          </button>
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="space-y-2.5">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/account/support/${t.ticketNumber}`)}
              className="w-full text-left border border-gray-100 rounded-xl p-4 hover:border-[#FFAA14] hover:bg-amber-50/30 transition-all flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={t.status} />
                  <span className="text-[11px] text-gray-400 font-mono">{t.ticketNumber}</span>
                </div>
                <p className="text-sm font-semibold text-[#1A1102] truncate">{t.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {TYPE_LABEL[t.type] ?? t.type}
                  {t.order?.orderNumber && <> · Order {t.order.orderNumber}</>}
                  {' · '}Updated {fmtDate(t.updatedAt)}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
