import { useState, useMemo } from "react";
import { getComputedStatus } from "../utils";

/**
 * Manages search + filter state and returns filtered products.
 */
export const useProductFilter = (products) => {
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (q && !p.name?.toLowerCase().includes(q) &&
               !p.category?.toLowerCase().includes(q) &&
               !p.sku?.toLowerCase().includes(q)) return false;
      if (filterStatus !== "all" && getComputedStatus(p.stock, p.stock_status) !== filterStatus) return false;
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      return true;
    });
  }, [products, search, filterStatus, filterCategory]);

  const stats = useMemo(() => ({
    total:      products.length,
    inStock:    products.filter((p) => getComputedStatus(p.stock, p.stock_status) === "in_stock").length,
    lowStock:   products.filter((p) => getComputedStatus(p.stock, p.stock_status) === "low_stock").length,
    outOfStock: products.filter((p) => getComputedStatus(p.stock, p.stock_status) === "out_of_stock").length,
  }), [products]);

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterCategory("all");
  };

  const hasActiveFilters = search !== "" || filterStatus !== "all" || filterCategory !== "all";

  return {
    search, setSearch,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    categories,
    filtered,
    stats,
    clearFilters,
    hasActiveFilters,
  };
};