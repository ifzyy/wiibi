import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../../utils/api.js';

export const useCustomers = () => {
  const [customers,  setCustomers]  = useState([]);
  const [stats,      setStats]      = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [toast,      setToast]      = useState(null);

  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('createdAt');
  const [sortDir,    setSortDir]    = useState('DESC');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/customers/stats');
      setStats(res.data?.data ?? res.data);
    } catch { /* non-fatal */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20, sortBy, sortDir };
      if (search.trim()) params.search = search.trim();

      const res  = await api.get('/admin/customers', { params });
      const body = res.data?.data ?? res.data;
      setCustomers(body.customers ?? body ?? []);
      setPagination(res.data?.pagination ?? body.pagination ?? { page: 1, total: 0, pages: 1 });
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortDir]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { load(); }, [load]);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(key); setSortDir('DESC'); }
  };

  return {
    customers, stats, pagination, loading, error, toast,
    page, setPage, search, setSearch,
    sortBy, sortDir, toggleSort,
    load, showToast,
  };
};

/* ── Customer profile hook (used by CustomerDrawer) ──────────────────── */
export const useCustomerProfile = (userId) => {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api.get(`/admin/customers/${userId}`)
      .then(res => setProfile(res.data?.data ?? res.data))
      .catch(e  => setError(e?.response?.data?.message ?? 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  return { profile, loading, error };
};