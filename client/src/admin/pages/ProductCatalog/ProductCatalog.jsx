import React, { useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../../utils/api";
import { COLORS } from "./constants";
import { useProducts }      from "./hooks/useProducts";
import { useProductFilter } from "./hooks/useProductFilter";
import { TopBar }           from "./components/TopBar";
import { StatCards }        from "./components/StatCards";
import { FilterBar }        from "./components/FilterBar";
import { ProductDrawer }    from "./components/ProductDrawer";
import {
  ProductRow,
  ProductTableHeader,
  TableLoadingState,
  TableEmptyState,
} from "./components/ProductRow";

// =============================================================================
// ProductCatalogPage
//
// ─── Drawer save flow (NEW) ───────────────────────────────────────────────────
// useProductSubmit inside ProductDrawer owns the ENTIRE save:
//   upload images → create/update product → attach media
//
// When it finishes it calls onSave(savedProduct, isEdit).
// THIS component's handleDrawerSave just:
//   - On create: prepend savedProduct to local list, show toast
//   - On edit:   replace the matching product in local list, show toast
//
// ⚠️  Do NOT call useProducts.createProduct or useProducts.saveProduct here —
//     that would double-save. Those hooks are only used for inline row edits.
// =============================================================================
// ─────────────────────────────────────────────────────────────────────────────
// SolarCoverageBanner
// Shows catalog gaps that would force the solar calculator into fallback
// results (e.g. "no inverter above 7.5kVA in stock"). Fix = tag/restock
// products via the Solar Matching section in the product form.
// ─────────────────────────────────────────────────────────────────────────────
const SolarCoverageBanner = ({ warnings, onDismiss }) => {
  if (!warnings?.length) return null;
  return (
    <div
      role="alert"
      style={{
        background: "#FFF8EC",
        border: "1px solid #F5C96A",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">☀</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#7A4F00" }}>
          Solar calculator coverage gaps
        </p>
        <ul style={{ margin: "6px 0 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
          {warnings.map((w, i) => (
            <li key={i} style={{ fontSize: 12, color: "#7A4F00" }}>{w}</li>
          ))}
        </ul>
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#A07A30" }}>
          Fix: open a product and set its component type + specs under <b>Solar Matching</b>.
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss coverage warnings"
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#A07A30", lineHeight: 1, padding: 2 }}
      >
        ×
      </button>
    </div>
  );
};

const ProductCatalogPage = () => {         // no token prop — api handles auth
  const {
    products,
    setProducts,
    loading,
    dirtyIds,
    fetchProducts,
    updateProductLocally,
    saveProduct,    // ← still used for inline ProductRow edits
    deleteProduct,
    // createProduct intentionally omitted — drawer handles create via useProductSubmit
  } = useProducts();

  const {
    search, setSearch,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    categories,
    filtered,
    stats,
    clearFilters,
    hasActiveFilters,
  } = useProductFilter(products);

  const [isDrawerOpen,   setIsDrawerOpen]   = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [coverageWarnings, setCoverageWarnings] = useState([]);
  const [coverageDismissed, setCoverageDismissed] = useState(false);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Solar calculator coverage — best-effort, never blocks the page
  const fetchCoverage = useCallback(() => {
    api.get("/admin/solar/coverage")
      .then(r => setCoverageWarnings(r.data?.warnings ?? []))
      .catch(() => setCoverageWarnings([]));
  }, []);

  useEffect(() => { fetchCoverage(); }, [fetchCoverage]);

  const openNewProductDrawer = useCallback(() => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((product) => {
    setEditingProduct(product);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
  }, []);

  // ── Drawer save handler ────────────────────────────────────────────────────
  //
  // Called by useProductSubmit AFTER all steps complete:
  //   ✓ images uploaded
  //   ✓ product created / updated  (featured_image_url set in payload)
  //   ✓ media attached             (featured_image_url synced again via attach)
  //
  // We re-fetch the full list from the server rather than merging local state.
  // This guarantees featured_image_url and images[] reflect the final DB state
  // after both the PATCH and the media/attach writes have completed.
  // ──────────────────────────────────────────────────────────────────────────
  const handleDrawerSave = useCallback(async (savedProduct, isEdit) => {
    toast.success(`"${savedProduct.name}" ${isEdit ? "updated" : "created"}!`);

    if (isEdit) {
      // The PATCH response already contains the fully updated product including
      // the new featured_image_url — use it directly instead of re-fetching,
      // which can return a browser-cached stale GET response.
      setProducts(prev =>
        prev.map(p => p.id === savedProduct.id ? { ...p, ...savedProduct } : p)
      );
    } else {
      // For creates, re-fetch so the new product appears with correct server state
      await fetchProducts();
    }
    // Tagging/untagging a product can change calculator coverage
    fetchCoverage();
    // Drawer closed by useProductSubmit via onClose after this resolves
  }, [fetchProducts, setProducts, fetchCoverage]);

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif",
      background: "#F5F5F3",
      minHeight: "100vh",
    }}>
      <TopBar
        productCount={products.length}
        dirtyCount={dirtyIds.size}
        onRefresh={fetchProducts}
        onNewProduct={openNewProductDrawer}
      />

      <main style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "28px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        {!coverageDismissed && (
          <SolarCoverageBanner
            warnings={coverageWarnings}
            onDismiss={() => setCoverageDismissed(true)}
          />
        )}

        <StatCards stats={stats} products={products} />

        <FilterBar
          search={search}                 onSearchChange={setSearch}
          filterStatus={filterStatus}     onStatusChange={setFilterStatus}
          filterCategory={filterCategory} onCategoryChange={setFilterCategory}
          categories={categories}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        <section
          aria-label="Products table"
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <ProductTableHeader />

          {loading ? (
            <TableLoadingState />
          ) : filtered.length === 0 ? (
            <TableEmptyState />
          ) : (
            <div role="rowgroup">
              {filtered.map((product, idx) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isDirty={dirtyIds.has(product.id)}
                  isLast={idx === filtered.length - 1}
                  onUpdate={(updates) => updateProductLocally(product.id, updates)}
                  onSave={() => saveProduct(products.find(p => p.id === product.id))}
                  onEdit={() => openEditDrawer(product)}
                  onDelete={() => deleteProduct(product.id, product.name)}
                />
              ))}
            </div>
          )}
        </section>

        <p style={{
          color: COLORS.textMuted,
          textAlign: "center",
          fontSize: 11,
          margin: 0,
          paddingBottom: 8,
        }}>
          Showing {filtered.length} of {products.length} product{products.length !== 1 ? "s" : ""}
        </p>
      </main>

      <ProductDrawer
        isOpen={isDrawerOpen}
        product={editingProduct}
        onClose={closeDrawer}
        onSave={handleDrawerSave}
        // No token prop — api axios instance handles auth automatically
      />

      <ToastContainer position="bottom-right" autoClose={3500} theme="colored" />
    </div>
  );
};

export default ProductCatalogPage;