/**
 * OrderManagementSystem/index.jsx
 *
 * Root component. Owns UI state (which drawer/modal is open).
 * All data logic lives in useOrders(). All rendering lives in sub-components.
 *
 * Usage:
 *   import OMS from './OrderManagementSystem';
 *   <OMS />
 */

import { useState } from "react";
import { C } from "./constants.js";
import { useOrders } from "./hooks/useOrders.js";
import { FontLink, Toast, ErrorBanner } from "./components/Ui.jsx";
import PageHeader  from "./components/PageHeader.jsx";
import StatsRow    from "./components/StatsRow.jsx";
import FilterBar   from "./components/Filterbar.jsx";
import OrdersTable from "./components/OrdersTable.jsx";
import OrderDrawer from "./components/OrderDrawer.jsx";
import UpdateModal from "./components/UpdateModal.jsx";
import { IBtn } from "./components/Ui.jsx";

const OMS = () => {
  /* ── Data + filter state from hook ───────────────────────────────────────── */
  const {
    orders, sorted, pagination, stats, loading, fetchErr,
    fFilter, setFFilter, pFilter, setPFilter, search, setSearch,
    page, setPage,
    sortKey, sortDir, toggleSort,
    load, handleSave, handleExport,
    toast,
  } = useOrders();

  /* ── Local UI state ──────────────────────────────────────────────────────── */
  const [selectedId, setSelectedId] = useState(null);  // drawer
  const [updating,   setUpdating]   = useState(null);   // modal

  const handleOpenDrawer = (id)    => setSelectedId(id);
  const handleOpenModal  = (order) => setUpdating(order);

  /* ── Wrap handleSave so modal closes on success (hook throws on fail) ────── */
  const handleModalSave = async (payload) => {
    await handleSave(payload);
    // If no throw, success — modal's internal handler closes it
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "Geist, -apple-system, sans-serif", color: C.ink,
    }}>
      <FontLink />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px 60px" }}>

        <PageHeader
          totalOrders={pagination.total ?? orders.length}
          loading={loading}
          onRefresh={load}
          onExport={handleExport}
          exportDisabled={loading || sorted.length === 0}
        />

        <StatsRow
          stats={stats}
          totalOrders={pagination.total ?? orders.length}
          refundCount={orders.filter(o => (o.refunds ?? []).length > 0).length}
          loading={loading}
        />

        {fetchErr && (
          <ErrorBanner message={fetchErr} onRetry={load} />
        )}

        <FilterBar
          orders={orders}
          fFilter={fFilter}  setFFilter={(f) => { setFFilter(f); setPage(1); }}
          pFilter={pFilter}  setPFilter={setPFilter}
          search={search}    setSearch={setSearch}
          resultCount={sorted.length}
          totalCount={pagination.total ?? orders.length}
        />

        <OrdersTable
          orders={sorted}
          loading={loading}
          fetchErr={fetchErr}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
          onView={handleOpenDrawer}
          onEdit={handleOpenModal}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 20 }}>
            <IBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} title="Previous">←</IBtn>
            <span style={{ fontSize: 13, color: C.inkMid, fontWeight: 600 }}>
              Page {page} of {pagination.totalPages}
            </span>
            <IBtn onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} title="Next">→</IBtn>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: C.inkFaint }}>
          {sorted.length} of {pagination.total ?? orders.length} orders · SolarBase OMS
        </p>

      </div>

      {/* Drawers & modals — rendered outside the scroll container */}
      {selectedId && (
        <OrderDrawer
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={(order) => { setUpdating(order); }}
        />
      )}

      {updating && (
        <UpdateModal
          order={updating}
          onClose={() => setUpdating(null)}
          onSave={handleModalSave}
        />
      )}

      <style>{`
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes slideUp { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        input:focus, textarea:focus, select:focus {
          border-color: ${C.amber} !important; outline: none;
          box-shadow: 0 0 0 3px rgba(255,170,20,0.12);
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        button { font-family: Geist, -apple-system, sans-serif; }
      `}</style>
    </div>
  );
};

export default OMS;