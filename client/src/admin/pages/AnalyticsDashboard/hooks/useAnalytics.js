import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../../utils/api.js';

const today    = () => new Date().toISOString().slice(0, 10);
const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

export const useAnalytics = () => {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [toast,     setToast]     = useState(null);

  // Date range — default last 30 days
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate,   setEndDate]   = useState(today());
  const [preset,    setPresetKey] = useState('30d');

  // Quick ranges: daily / weekly / monthly / yearly revenue at one click.
  // The load effect below refires automatically when the dates change.
  const setPreset = (key) => {
    setPresetKey(key);
    const t = today();
    if (key === 'today')      { setStartDate(t);                                    setEndDate(t); }
    else if (key === '7d')    { setStartDate(daysAgo(6));                           setEndDate(t); }
    else if (key === '30d')   { setStartDate(daysAgo(29));                          setEndDate(t); }
    else if (key === 'year')  { setStartDate(`${new Date().getFullYear()}-01-01`);  setEndDate(t); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/analytics/dashboard', {
        params: { startDate, endDate },
      });
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  // Derived: daily revenue for chart
  const chartData = useMemo(() => {
    if (!data?.revenue?.dailyBreakdown) return [];
    return data.revenue.dailyBreakdown.map(d => ({
      date:    d.date,
      revenue: parseFloat(d.revenue || 0),
      orders:  parseInt(d.orders   || 0, 10),
    }));
  }, [data]);

  // Trigger manual aggregation for a past date (ops use)
  const triggerAggregate = async (date) => {
    try {
      await api.post('/admin/analytics/aggregate', { date });
      showToast(`Aggregated ${date}`);
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Aggregation failed', 'error');
    }
  };

  return {
    data, loading, error, toast,
    startDate, setStartDate: (v) => { setPresetKey(null); setStartDate(v); },
    endDate,   setEndDate:   (v) => { setPresetKey(null); setEndDate(v);   },
    preset, setPreset,
    chartData,
    load,
    triggerAggregate,
  };
};