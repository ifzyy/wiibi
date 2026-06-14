/**
 * SupportTicketDetail.jsx — customer's view of a single ticket thread.
 *
 * Loads GET /support/tickets/:ticketNumber (own ticket, no internal notes),
 * renders the conversation, and lets the customer reply via
 * POST /support/tickets/:ticketNumber/messages. Resolved/closed tickets can
 * still be replied to — the backend reopens them on a customer reply.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, AlertCircle, Package } from 'lucide-react';
import { api } from '../../utils/api';

const STATUS_CFG = {
  open:             { label: 'Open',                bg: 'bg-blue-50',   text: 'text-blue-600'   },
  in_progress:      { label: 'In progress',         bg: 'bg-amber-50',  text: 'text-amber-600'  },
  waiting_customer: { label: 'Awaiting your reply', bg: 'bg-orange-50', text: 'text-orange-600' },
  resolved:         { label: 'Resolved',            bg: 'bg-green-50',  text: 'text-green-600'  },
  closed:           { label: 'Closed',              bg: 'bg-gray-100',  text: 'text-gray-500'   },
};

const fmtDT = (iso) =>
  !iso ? '' : new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const Bubble = ({ msg }) => {
  const isCustomer = msg.senderType === 'customer';
  const isSystem   = msg.senderType === 'system';

  if (isSystem) {
    return (
      <div className="text-center my-3">
        <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3.5 py-1">
          {msg.body}
        </span>
      </div>
    );
  }

  const name = isCustomer
    ? 'You'
    : ([msg.sender?.firstName, msg.sender?.lastName].filter(Boolean).join(' ') || 'Support team');

  return (
    <div className={`flex flex-col mb-4 ${isCustomer ? 'items-end' : 'items-start'}`}>
      <div className="text-[11px] text-gray-400 mb-1 flex items-center gap-2 px-1">
        <span className="font-semibold text-gray-500">{name}</span>
        <span>{fmtDT(msg.createdAt)}</span>
      </div>
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isCustomer
            ? 'bg-[#FFAA14] text-white rounded-br-md'
            : 'bg-gray-100 text-[#1A1102] rounded-bl-md'
        }`}
      >
        {msg.body}
      </div>
    </div>
  );
};

export default function SupportTicketDetail() {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [reply,    setReply]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [sendErr,  setSendErr]  = useState(null);

  const threadEndRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    api.get(`/support/tickets/${ticketNumber}`)
      .then(r => setTicket(r.data?.data ?? r.data))
      .catch(e => setError(e?.response?.data?.message ?? 'Could not load this ticket.'))
      .finally(() => setLoading(false));
  }, [ticketNumber]);

  useEffect(() => { load(); }, [load]);

  // Keep the latest message in view after load / new reply
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = reply.trim();
    if (!body) return;
    setSending(true); setSendErr(null);
    try {
      await api.post(`/support/tickets/${ticketNumber}/messages`, { body });
      setReply('');
      load();   // refresh thread (also picks up any reopen/status change)
    } catch (err) {
      setSendErr(err?.response?.data?.message ?? 'Could not send your reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <Loader2 size={20} className="animate-spin mr-2" /> Loading conversation…
    </div>
  );

  if (error) return (
    <div className="text-[#1A1102]">
      <button onClick={() => navigate('/account/support')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A1102] text-sm mb-8">
        <ArrowLeft size={16} /> Back to support
      </button>
      <div className="text-center py-16">
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-5 py-2.5 rounded-xl bg-[#FFAA14] text-white font-bold text-sm">Retry</button>
      </div>
    </div>
  );

  const messages = ticket?.messages ?? [];
  const sCfg = STATUS_CFG[ticket?.status] ?? STATUS_CFG.open;

  return (
    <div className="text-[#1A1102] flex flex-col" style={{ minHeight: 480 }}>
      {/* Back */}
      <button onClick={() => navigate('/account/support')} className="flex items-center gap-2 text-gray-400 hover:text-[#1A1102] text-sm mb-5 transition-colors">
        <ArrowLeft size={16} /> Back to support
      </button>

      {/* Header */}
      <div className="pb-5 border-b border-gray-100 mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${sCfg.bg} ${sCfg.text}`}>{sCfg.label}</span>
          <span className="text-[11px] text-gray-400 font-mono">{ticket.ticketNumber}</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight">{ticket.subject}</h1>
        {ticket.order?.orderNumber && (
          <button
            onClick={() => navigate(`/account/orders/${ticket.order.id}`)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6040] bg-gray-50 hover:bg-gray-100 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Package size={13} /> Order {ticket.order.orderNumber}
          </button>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto pr-1 mb-4" style={{ maxHeight: 460 }}>
        {messages.map((m) => <Bubble key={m.id} msg={m} />)}
        <div ref={threadEndRef} />
      </div>

      {/* Reply box */}
      <form onSubmit={handleSend} className="border-t border-gray-100 pt-4">
        {sendErr && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-[12px] text-red-500 font-medium">{sendErr}</p>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(e); }}
            placeholder="Write a reply…"
            rows={2}
            maxLength={10000}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#FFAA14] resize-y leading-relaxed"
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className={`shrink-0 h-12 px-5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              sending || !reply.trim()
                ? 'bg-[#FFD699] text-white cursor-not-allowed'
                : 'bg-[#FFAA14] text-white hover:bg-[#e69912]'
            }`}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">Press ⌘/Ctrl + Enter to send</p>
      </form>
    </div>
  );
}
