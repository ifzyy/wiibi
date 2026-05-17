import { STATUS_CONFIG } from "../constants";

/**
 * Converts a string to a URL-friendly slug.
 * e.g. "5kWh Lithium Battery" → "5kwh-lithium-battery"
 */
export const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Formats a number with Nigerian locale commas.
 * e.g. 850000 → "850,000"
 */
export const fmt = (n) => Number(n || 0).toLocaleString("en-NG");

/**
 * Derives the display stock status from quantity + optional manual override.
 * Manual "pre_order" always wins.
 */
export const getComputedStatus = (stock, manualStatus) => {
  if (manualStatus === "pre_order") return "pre_order";
  if (stock <= 0)  return "out_of_stock";
  if (stock <= 5)  return "low_stock";
  return "in_stock";
};

/** Returns the STATUS_CONFIG entry for a given product. */
export const getStatusConfig = (stock, manualStatus) =>
  STATUS_CONFIG[getComputedStatus(stock, manualStatus)];

/**
 * Resolves the best available thumbnail URL for a product.
 */
export const getProductThumb = (product) =>
  product?.featured_image_url || product?.images?.[0]?.url || null;