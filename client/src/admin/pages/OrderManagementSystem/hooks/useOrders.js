import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchOrders, updateOrderStatus } from "../../../utils/api.js";
import { computeStats } from "../utils/orderHelpers.js";
import { buildCsv, fmtDate } from "../utils/format.js";
import { getCustomerName, getCustomerEmail, getTotal } from "../utils/orderHelpers.js";

export const useOrders = () => {
  /* ── Server data ───────────────────────────────────────────────────────── */
  const [orders,     setOrders]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [fetchErr,   setFetchErr]   = useState(null);

  /* ── Filters ───────────────────────────────────────────────────────────── */
  const [fFilter, setFFilter] = useState("all");   // fulfillment (server-side)
  const [pFilter, setPFilter] = useState("all");   // payment (client-side)
  const [search,  setSearch]  = useState("");       // client-side
  const [page,    setPage]    = useState(1);

  /* ── Sort ──────────────────────────────────────────────────────────────── */
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  /* ── Toast ─────────────────────────────────────────────────────────────── */
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const params = {
        page,
        limit: 20,
        ...(fFilter !== "all" && { status: fFilter }),
      };
      const res  = await fetchOrders(params);
      const rows = res.data ?? res.orders ?? [];
      const pag  = res.pagination ?? { page: 1, totalPages: 1, total: rows.length };
      setOrders(rows);
      setPagination(pag);
    } catch (e) {
      setFetchErr(e?.response?.data?.message ?? "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, fFilter]);

  useEffect(() => { load(); }, [load]);

  /* ── Client-side filter + sort ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter(o => {
      const matchP = pFilter === "all" || o.paymentStatus === pFilter;
      const matchQ = !q
        || (o.orderNumber ?? o.id ?? "").toLowerCase().includes(q)
        || getCustomerName(o).toLowerCase().includes(q)
        || getCustomerEmail(o).toLowerCase().includes(q);
      return matchP && matchQ;
    });
  }, [orders, pFilter, search]);

  const sorted = useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "total")    return mul * (getTotal(a) - getTotal(b));
      if (sortKey === "customer") return mul * getCustomerName(a).localeCompare(getCustomerName(b));
      return mul * (new Date(a.createdAt) - new Date(b.createdAt));
    });
  }, [filtered, sortKey, sortDir]);

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => computeStats(orders), [orders]);

  /* ── Sort toggle ───────────────────────────────────────────────────────── */
  const toggleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  /* ── Update handler ────────────────────────────────────────────────────── */
  const handleSave = async ({ orderId, fStatus, pStatus, note, tracking, carrier, refundAmt, refundReason, refundMethod }) => {
    const payload = {
      status:         fStatus,
      paymentStatus:  pStatus,
      note:           note     || undefined,
      trackingNumber: tracking || undefined,
      carrier:        carrier  || undefined,
      ...(refundAmt > 0 && {
        refund: { amount: refundAmt, reason: refundReason || "Manual refund", method: refundMethod },
      }),
    };

    // Optimistic update
    setOrders(prev => prev.map(o =>
      (o.id ?? o._id) === orderId
        ? { ...o, fulfillmentStatus: fStatus, status: fStatus, paymentStatus: pStatus, trackingNumber: tracking || o.trackingNumber, carrier: carrier || o.carrier, updatedAt: new Date().toISOString() }
        : o
    ));

    try {
      await updateOrderStatus(orderId, payload);
      showToast(`Order updated successfully`);
    } catch (e) {
      load(); // rollback
      const msg = e?.response?.data?.message ?? "Update failed.";
      showToast(msg, "error");
      throw e;
    }
  };

  /* ── CSV export ────────────────────────────────────────────────────────── */
  const handleExport = () => {
    const headers = ["Order No.", "Customer", "Email", "Total", "Fulfillment", "Payment", "Date"];
    const rows    = sorted.map(o => [
      o.orderNumber ?? o.id ?? o._id,
      getCustomerName(o),
      getCustomerEmail(o),
      getTotal(o),
      o.fulfillmentStatus ?? o.status,
      o.paymentStatus,
      fmtDate(o.createdAt),
    ]);
    const csv  = buildCsv(headers, rows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    // data
    orders, sorted, pagination, stats, loading, fetchErr,
    // filters
    fFilter, setFFilter, pFilter, setPFilter, search, setSearch,
    page, setPage,
    // sort
    sortKey, sortDir, toggleSort,
    // actions
    load, handleSave, handleExport,
    // ui
    toast,
  };
};