import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../../utils/api.js';

const today   = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

export const usePaymentsAdmin = () => {
  const [payments,   setPayments]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error,      setError]      = useState(null);
  const [toast,      setToast]      = useState(null);

  const [tab,        setTab]        = useState('all');   // all | refunds | reconcile
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [pStatus,    setPStatus]    = useState('');
  const [startDate,  setStartDate]  = useState(daysAgo(29));
  const [endDate,    setEndDate]    = useState(today());

  // Debounced search: don't fire a request on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);
  const onSearchChange = useCallback((v) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 350);
  }, []);

  // Refund log state
  const [refunds,       setRefunds]       = useState([]);
  const [refundPage,    setRefundPage]    = useState(1);
  const [refundPag,     setRefundPag]     = useState({ total: 0, pages: 1 });
  const [refundStatus,  setRefundStatus]  = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  // Reconcile
  const [reconcile,     setReconcile]     = useState(null);
  const [reconcileLoad, setReconcileLoad] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Load stats ──────────────────────────────────────────────────────── */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/payments/stats', { params: { startDate, endDate } });
      setStats(res.data?.data ?? res.data);
    } catch { /* non-fatal */ }
    finally { setStatsLoading(false); }
  }, [startDate, endDate]);

  /* ── Load payment log ────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20, startDate, endDate };
      if (pStatus)          params.paymentStatus = pStatus;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res  = await api.get('/admin/payments', { params });
      const body = res.data?.data ?? res.data;
      setPayments(body.payments ?? body ?? []);
      setPagination(res.data?.pagination ?? body.pagination ?? { total: 0, pages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [page, pStatus, debouncedSearch, startDate, endDate]);

  /* ── Load refunds ────────────────────────────────────────────────────── */
  const loadRefunds = useCallback(async () => {
    setRefundLoading(true);
    try {
      const params = { page: refundPage, limit: 20, startDate, endDate };
      if (refundStatus) params.status = refundStatus;
      const res  = await api.get('/admin/payments/refunds', { params });
      const body = res.data?.data ?? res.data;
      setRefunds(body.refunds ?? body ?? []);
      setRefundPag(res.data?.pagination ?? body.pagination ?? { total: 0, pages: 1 });
    } catch { /* non-fatal */ }
    finally { setRefundLoading(false); }
  }, [refundPage, refundStatus, startDate, endDate]);

  /* ── Load reconcile ──────────────────────────────────────────────────── */
  const loadReconcile = useCallback(async () => {
    setReconcileLoad(true);
    try {
      const res = await api.get('/admin/payments/reconcile');
      setReconcile(res.data?.data ?? res.data);
    } catch { /* non-fatal */ }
    finally { setReconcileLoad(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === 'all')       load();          }, [load, tab]);
  useEffect(() => { if (tab === 'refunds')   loadRefunds();   }, [loadRefunds, tab]);
  useEffect(() => { if (tab === 'reconcile') loadReconcile(); }, [loadReconcile, tab]);

  /* ── Mark refund complete ────────────────────────────────────────────── */
  const markRefundComplete = async (refundId, note = '') => {
    try {
      await api.post(`/payment/refund/${refundId}/mark-complete`, { note });
      showToast('Refund marked as complete');
      loadRefunds();
      loadReconcile();
      loadStats();
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Failed to mark refund complete', 'error');
    }
  };

  /* ── CSV export ──────────────────────────────────────────────────────── */
  // Uses an authenticated axios request (not window.open) so auth cookies/headers
  // are included. The blob is then downloaded client-side.
  const handleExport = async () => {
    try {
      const params = { startDate, endDate };
      if (pStatus) params.paymentStatus = pStatus;

      const res = await api.get('/admin/payments/export', {
        params,
        responseType: 'blob',
      });

      const url      = URL.createObjectURL(res.data);
      const filename = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed', 'error');
    }
  };

  return {
    payments, stats, pagination, loading, statsLoading, error, toast,
    tab, setTab,
    page, setPage,
    search, onSearchChange,
    pStatus, setPStatus,
    startDate, setStartDate, endDate, setEndDate,
    load, loadStats, handleExport,
    // refunds
    refunds, refundPage, setRefundPage, refundPag, refundStatus, setRefundStatus, refundLoading,
    markRefundComplete,
    // reconcile
    reconcile, reconcileLoad,
    showToast,
  };
};
