import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../utils/api.js';

/**
 * Leads CRM data hook.
 * Backend: /api/admin/solar/leads (list/get/patch/delete — see solarAdminRoutes).
 * List response shape: { leads, pagination: { page, limit, total, pages } }
 */
export const useLeads = () => {
  const [leads,      setLeads]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [toast,      setToast]      = useState(null);

  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOrigin, setFilterOrigin] = useState('all');

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // No dedicated stats endpoint — derive counts from the list endpoint's
  // pagination.total with limit=1 per status. Four cheap COUNT queries.
  const loadStats = useCallback(async () => {
    try {
      const fetchCount = (params = {}) =>
        api.get('/admin/solar/leads', { params: { ...params, page: 1, limit: 1 } })
          .then(r => r.data?.pagination?.total ?? 0);

      const [total, fresh, contacted, converted] = await Promise.all([
        fetchCount(),
        fetchCount({ status: 'new' }),
        fetchCount({ status: 'contacted' }),
        fetchCount({ status: 'converted' }),
      ]);
      setStats({ total, new: fresh, contacted, converted });
    } catch { /* non-fatal */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search.trim())            params.search = search.trim();
      if (filterStatus !== 'all')   params.status = filterStatus;
      if (filterOrigin !== 'all')   params.origin = filterOrigin;

      const res = await api.get('/admin/solar/leads', { params });
      setLeads(res.data?.leads ?? []);
      setPagination(res.data?.pagination ?? { page: 1, total: 0, pages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterOrigin]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { load(); },      [load]);

  const updateLead = useCallback(async (id, updates) => {
    const res     = await api.patch(`/admin/solar/leads/${id}`, updates);
    const updated = res.data;
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...updated } : l)));
    showToast('Lead updated');
    loadStats();
    return updated;
  }, [showToast, loadStats]);

  const deleteLead = useCallback(async (id) => {
    await api.delete(`/admin/solar/leads/${id}`);
    setLeads(prev => prev.filter(l => l.id !== id));
    showToast('Lead deleted');
    loadStats();
  }, [showToast, loadStats]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilterStatus('all');
    setFilterOrigin('all');
    setPage(1);
  }, []);

  return {
    leads, stats, pagination, loading, error, toast,
    page, setPage,
    search, setSearch,
    filterStatus, setFilterStatus,
    filterOrigin, setFilterOrigin,
    hasActiveFilters: search.trim() !== '' || filterStatus !== 'all' || filterOrigin !== 'all',
    clearFilters,
    load, loadStats, updateLead, deleteLead, showToast,
  };
};

/* ── Single lead detail (used by LeadDrawer) ───────────────────────────── */
export const useLeadDetail = (leadId) => {
  const [lead,    setLead]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!leadId) { setLead(null); return; }
    setLoading(true);
    setError(null);
    api.get(`/admin/solar/leads/${leadId}`)
      .then(res => setLead(res.data))
      .catch(e  => setError(e?.response?.data?.message ?? 'Failed to load lead.'))
      .finally(() => setLoading(false));
  }, [leadId]);

  return { lead, loading, error };
};
