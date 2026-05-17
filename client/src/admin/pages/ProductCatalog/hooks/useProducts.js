import { useState, useCallback, useRef } from "react";
import { toast }    from "react-toastify";
import api from "../../../../utils/api";
import { slugify }  from "../utils";

/**
 * useProducts
 *
 * WHAT CHANGED:
 *  - token prop removed entirely — cookie is sent automatically by api
 *  - axios.get/post/put/delete replaced with api — no manual headers
 *  - authHeaders object deleted — nothing to construct or thread
 *  - All dependency arrays updated: [token] → [] (no external dep anymore)
 *
 * Everything else — dirty tracking, snapshots, attachMedia callback,
 * createProduct signature — is identical to v1.
 */
export const useProducts = () => {          // ← no token param
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dirtyIds, setDirtyIds] = useState(new Set());

  const savedSnapshots = useRef({});

  // ── FETCH ──────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get("/admin/products");
      const data = res.data.products || [];
      console.log(data)
      setProducts(data);
      savedSnapshots.current = Object.fromEntries(
        data.map((p) => [p.id, JSON.stringify(p)])
      );
      setDirtyIds(new Set());
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);                                   // ← was [token]

  // ── INLINE UPDATE (local only, no request) ─────────────────────────────
  const updateProductLocally = useCallback((id, updates) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        setDirtyIds((ds) => {
          const next = new Set(ds);
          JSON.stringify(updated) !== savedSnapshots.current[id]
            ? next.add(id)
            : next.delete(id);
          return next;
        });
        return updated;
      })
    );
  }, []);

  // ── SAVE SINGLE ────────────────────────────────────────────────────────
  const saveProduct = useCallback(async (product) => {
    try {
      await api.patch(`/admin/products/${product.id}`, product);
      toast.success(`"${product.name}" saved`);
      setDirtyIds((ds) => { const n = new Set(ds); n.delete(product.id); return n; });
      savedSnapshots.current[product.id] = JSON.stringify(product);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  }, []);                                   // ← was [token]

  // ── CREATE ─────────────────────────────────────────────────────────────
  const createProduct = useCallback(async (form, attachMedia = null) => {
    const payload = {
      name:               form.name,
      slug:               form.slug || slugify(form.name),
      price:              form.price,
      sale_price:         form.sale_price        || null,
      stock:              form.stock             ?? 0,
      sku:                form.sku               || null,
      category:           form.category          || null,
      brand:              form.brand             || null,
      short_description:  form.short_description || null,
      description:        form.description       || null,
      featured_image_url: form.featured_image_url || null,
      is_visible:         form.is_visible        ?? true,
      is_featured:        form.is_featured       ?? false,
    };

    const res     = await api.post("/admin/products", payload);
    const created = res.data;

    if (attachMedia) await attachMedia(created.id);

    return created;
  }, []);                                   // ← was [token]

  // ── DELETE ─────────────────────────────────────────────────────────────
  const deleteProduct = useCallback(async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  }, []);                                   // ← was [token]

  return {
    products,
    setProducts,
    loading,
    dirtyIds,
    fetchProducts,
    updateProductLocally,
    saveProduct,
    createProduct,
    deleteProduct,
  };
};