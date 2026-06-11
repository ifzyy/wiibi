import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../utils/api.js';

export const useSupport = () => {
  const [tickets,    setTickets]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [toast,      setToast]      = useState(null);

  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [priority,   setPriority]   = useState('');
  const [type,       setType]       = useState('');
  const [unassigned, setUnassigned] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/support/stats');
      setStats(res.data?.data ?? res.data);
    } catch { /* non-fatal */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (status)     params.status     = status;
      if (priority)   params.priority   = priority;
      if (type)       params.type       = type;
      if (unassigned) params.unassigned = true;
      if (search.trim()) params.search  = search.trim();

      const res  = await api.get('/admin/support', { params });
      const body = res.data?.data ?? res.data;
      setTickets(body.tickets ?? body ?? []);
      setPagination(res.data?.pagination ?? body.pagination ?? { total: 0, pages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, type, unassigned, search]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { load(); }, [load]);

  /* ── Ticket actions ─────────────────────────────────────────────────── */
  const updateStatus = async (ticketId, newStatus, note = '') => {
    try {
      await api.patch(`/admin/support/${ticketId}/status`, { status: newStatus, note });
      showToast(`Ticket ${newStatus}`);
      load();
      loadStats();
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Update failed', 'error');
      throw e;
    }
  };

  const assignTicket = async (ticketId, assignedTo) => {
    try {
      await api.patch(`/admin/support/${ticketId}/assign`, { assignedTo });
      showToast(assignedTo ? 'Ticket assigned' : 'Ticket unassigned');
      load();
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Assignment failed', 'error');
    }
  };

  const sendMessage = async (ticketId, body, isInternal = false) => {
    await api.post(`/admin/support/${ticketId}/messages`, { body, isInternal });
    showToast('Message sent');
  };

  const updateTags = async (ticketId, tags) => {
    try {
      await api.put(`/admin/support/${ticketId}/tags`, { tags });
      showToast('Tags updated');
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Tag update failed', 'error');
      throw e;
    }
  };

  return {
    tickets, stats, pagination, loading, error, toast,
    page, setPage, search, setSearch,
    status, setStatus, priority, setPriority,
    type, setType, unassigned, setUnassigned,
    load, loadStats,
    updateStatus, assignTicket, sendMessage, updateTags,
    showToast,
  };
};

/* ── Single ticket detail hook ──────────────────────────────────────────── */
export const useTicketDetail = (ticketId) => {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const reload = useCallback(() => {
    if (!ticketId) return;
    setLoading(true);
    api.get(`/admin/support/${ticketId}`, { params: { includeInternal: true } })
      .then(r => setTicket(r.data?.data ?? r.data))
      .catch(e => setError(e?.response?.data?.message ?? 'Failed to load ticket.'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => { reload(); }, [reload]);

  return { ticket, loading, error, reload };
};