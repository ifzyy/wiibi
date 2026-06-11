import { useState } from 'react';
import { C, fmtDate } from '../../AnalyticsDashboard/constants.js';
import { DrawerShell, IBtn, SectionLabel } from '../../AnalyticsDashboard/Ui.jsx';
import { useTicketDetail } from '../hooks/useSupport.js';

/* ── Color maps ─────────────────────────────────────────────────────────── */

const SCOL = {
  open:             { bg: '#DBEAFE', text: '#2563EB' },
  in_progress:      { bg: '#FEF9C3', text: '#A16207' },
  waiting_customer: { bg: '#FFEDD5', text: '#EA580C' },
  resolved:         { bg: '#DCFCE7', text: '#16A34A' },
  closed:           { bg: '#F3F4F6', text: '#6B7280' },
};
const PCOL = {
  low:    { bg: '#F3F4F6', text: '#6B7280' },
  medium: { bg: '#DBEAFE', text: '#2563EB' },
  high:   { bg: '#FFEDD5', text: '#EA580C' },
  urgent: { bg: '#FEE2E2', text: '#DC2626' },
};

// Mirrors the server-side status machine — only valid next states are shown
const TRANSITIONS = {
  open:             ['in_progress', 'resolved', 'closed'],
  in_progress:      ['waiting_customer', 'resolved', 'closed', 'open'],
  waiting_customer: ['in_progress', 'resolved', 'closed', 'open'],
  resolved:         ['open', 'closed'],
  closed:           ['open'],
};

/* ── Message bubble ─────────────────────────────────────────────────────── */

const Bubble = ({ msg }) => {
  const isAdmin  = msg.senderType === 'admin';
  const isSystem = msg.senderType === 'system';
  const name = msg.sender
    ? [msg.sender.firstName, msg.sender.lastName].filter(Boolean).join(' ') || 'Admin'
    : isAdmin ? 'Admin' : 'Customer';

  if (isSystem) return (
    <div style={{ textAlign: 'center', margin: '10px 0' }}>
      <span style={{ fontSize: 11, color: C.inkFaint, background: C.bg, padding: '3px 14px', borderRadius: 99, border: `1px solid ${C.border}` }}>
        {msg.body}
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 600, color: C.inkMid }}>{name}</span>
        <span>{fmtDate(msg.createdAt)}</span>
        {msg.isInternal && (
          <span style={{ background: '#FEF9C3', color: '#A16207', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
            INTERNAL
          </span>
        )}
      </div>
      <div style={{
        maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
        fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        background: msg.isInternal ? '#FFFBEB' : isAdmin ? C.amberLight : C.bg,
        border:     `1px solid ${msg.isInternal ? '#FDE68A' : isAdmin ? C.amberBorder : C.border}`,
        color:      C.ink,
        borderBottomRightRadius: isAdmin ? 2 : 12,
        borderBottomLeftRadius:  isAdmin ? 12 : 2,
      }}>
        {msg.body}
      </div>
    </div>
  );
};

/* ── Main drawer ────────────────────────────────────────────────────────── */

export default function TicketDrawer({ ticketId, onClose, onStatusChange, onMessage, onTagUpdate }) {
  const { ticket, loading, error, reload } = useTicketDetail(ticketId);

  const [reply,      setReply]      = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending,    setSending]    = useState(false);
  const [tagInput,   setTagInput]   = useState('');
  const [tagSaving,  setTagSaving]  = useState(false);

  const handleSend = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await onMessage(ticketId, reply.trim(), isInternal);
      setReply('');
      reload();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
  };

  const handleStatus = async (newStatus) => {
    await onStatusChange(ticketId, newStatus);
    reload();
  };

  const currentTags = (ticket?.tags ?? []).map(t => t.tag);

  const handleAddTag = async () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || currentTags.includes(tag) || currentTags.length >= 10) return;
    setTagSaving(true);
    try {
      await onTagUpdate(ticketId, [...currentTags, tag]);
      setTagInput('');
      reload();
    } finally {
      setTagSaving(false);
    }
  };

  const handleRemoveTag = async (tag) => {
    setTagSaving(true);
    try {
      await onTagUpdate(ticketId, currentTags.filter(t => t !== tag));
      reload();
    } finally {
      setTagSaving(false);
    }
  };

  const sCol      = SCOL[ticket?.status]   ?? { bg: C.border, text: C.inkMid };
  const pCol      = PCOL[ticket?.priority] ?? { bg: C.border, text: C.inkMid };
  const validNext = TRANSITIONS[ticket?.status] ?? [];
  const assignee  = ticket?.assignee
    ? [ticket.assignee.firstName, ticket.assignee.lastName].filter(Boolean).join(' ')
    : null;

  const titleText = ticket
    ? `#${ticket.ticketNumber} — ${ticket.subject?.length > 38 ? ticket.subject.slice(0, 38) + '…' : ticket.subject}`
    : 'Loading ticket…';

  return (
    <DrawerShell open={!!ticketId} onClose={onClose} width={600}>

      {/* ── [0] Drawer header title ── */}
      <span>🎫 {titleText}</span>

      {/* ── [1] Scrollable body ── */}
      <div>
        {loading ? (
          <div style={{ paddingTop: 8 }}>
            {[90, 70, 82, 60, 75].map((w, i) => (
              <div key={i} style={{ height: 14, background: C.border, borderRadius: 4, marginBottom: 14, animation: 'pulse 1.4s ease-in-out infinite', width: `${w}%` }} />
            ))}
          </div>

        ) : error ? (
          <div style={{ color: C.red, fontSize: 13, padding: '20px 0' }}>⚠ {error}</div>

        ) : ticket ? (
          <>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <span style={{ background: sCol.bg, color: sCol.text, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                {ticket.status?.replace(/_/g, ' ')}
              </span>
              <span style={{ background: pCol.bg, color: pCol.text, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                {ticket.priority}
              </span>
              <span style={{ fontSize: 11, color: C.inkMid, padding: '3px 10px', background: C.bg, borderRadius: 99, border: `1px solid ${C.border}` }}>
                {ticket.type?.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: 11, color: C.inkFaint, padding: '3px 10px', background: C.bg, borderRadius: 99, border: `1px solid ${C.border}` }}>
                via {ticket.channel?.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Requester */}
            <SectionLabel>Requester</SectionLabel>
            <div style={{ background: C.bg, borderRadius: C.rSm, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                {(ticket.requesterName
                  ?? [ticket.requester?.firstName, ticket.requester?.lastName].filter(Boolean).join(' '))
                  || 'Guest'}
              </div>
              <div style={{ fontSize: 12, color: C.inkMid }}>{ticket.requesterEmail}</div>
              {ticket.requesterPhone && (
                <div style={{ fontSize: 12, color: C.inkMid, marginTop: 2 }}>{ticket.requesterPhone}</div>
              )}
            </div>

            {ticket.order && (
              <div style={{ fontSize: 12, color: C.inkMid, marginBottom: 10, padding: '8px 12px', background: C.bg, borderRadius: C.rSm, border: `1px solid ${C.border}` }}>
                🛒 Order <strong>{ticket.order.orderNumber}</strong>
                {ticket.order.totalAmount != null && ` · ₦${parseFloat(ticket.order.totalAmount).toLocaleString()}`}
                {ticket.order.status && ` · ${ticket.order.status}`}
              </div>
            )}

            <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 20 }}>
              Opened {fmtDate(ticket.createdAt)}
              {ticket.firstResponseAt && ` · First response ${fmtDate(ticket.firstResponseAt)}`}
            </div>

            {/* Assignee */}
            <SectionLabel>Assignee</SectionLabel>
            <div style={{ fontSize: 13, marginBottom: 20, color: assignee ? C.ink : C.inkFaint, fontStyle: assignee ? 'normal' : 'italic', fontWeight: assignee ? 600 : 400 }}>
              {assignee ?? 'Unassigned'}
            </div>

            {/* Status transitions */}
            {validNext.length > 0 && (
              <>
                <SectionLabel>Move To</SectionLabel>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                  {validNext.map(s => (
                    <button key={s} onClick={() => handleStatus(s)} style={{
                      padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: `1px solid ${SCOL[s]?.text ?? C.border}`,
                      background: SCOL[s]?.bg ?? C.bg,
                      color:      SCOL[s]?.text ?? C.inkMid,
                      fontFamily: C.font, transition: 'opacity 0.1s',
                    }}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Tags */}
            <SectionLabel>Tags</SectionLabel>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, minHeight: 24 }}>
                {currentTags.length === 0 && (
                  <span style={{ fontSize: 12, color: C.inkFaint }}>No tags yet</span>
                )}
                {currentTags.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600, background: C.bg,
                    border: `1px solid ${C.border}`, padding: '2px 8px', borderRadius: 99, color: C.inkMid,
                  }}>
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={tagSaving}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkFaint, fontSize: 14, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', opacity: tagSaving ? 0.4 : 1 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag… (Enter)"
                  maxLength={80}
                  style={{
                    flex: 1, padding: '5px 10px', border: `1px solid ${C.border}`,
                    borderRadius: C.rSm, fontSize: 12, fontFamily: C.font, color: C.ink, background: C.surface,
                  }}
                />
                <IBtn onClick={handleAddTag} disabled={tagSaving || !tagInput.trim()}>+ Add</IBtn>
              </div>
            </div>

            {/* Thread */}
            <SectionLabel>
              Conversation ({ticket.messages?.length ?? 0})
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 80, paddingBottom: 8 }}>
              {ticket.messages?.length > 0
                ? ticket.messages.map(m => <Bubble key={m.id} msg={m} />)
                : <div style={{ color: C.inkFaint, fontSize: 13, textAlign: 'center', padding: '28px 0' }}>No messages yet</div>
              }
            </div>
          </>
        ) : null}
      </div>

      {/* ── [2] Sticky footer: reply composer ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: isInternal ? '#A16207' : C.inkMid }}>
            {isInternal ? '🔒 Internal note' : '↩ Reply to customer'}
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.inkMid, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
            Internal only
          </label>
        </div>
        <textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isInternal
            ? 'Internal note — not visible to customer…'
            : 'Type a reply… (Ctrl + Enter to send)'}
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', boxSizing: 'border-box',
            border: `1px solid ${isInternal ? '#FDE68A' : C.border}`,
            borderRadius: C.rSm, fontSize: 13, resize: 'vertical',
            fontFamily: C.font, color: C.ink,
            background: isInternal ? '#FFFBEB' : C.surface,
            transition: 'border-color 0.15s, background 0.15s',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <IBtn variant="primary" onClick={handleSend} disabled={sending || !reply.trim()}>
            {sending ? 'Sending…' : isInternal ? '🔒 Add Note' : '↗ Send Reply'}
          </IBtn>
        </div>
      </div>

    </DrawerShell>
  );
}
