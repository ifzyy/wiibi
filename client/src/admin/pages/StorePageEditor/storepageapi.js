/**
 * storePageApi.js
 *
 * Thin fetch wrapper for the store page configuration.
 * Mirrors the homepageApi pattern so the codebase stays consistent.
 *
 * ── Backend contract ────────────────────────────────────────────────────────
 *
 *   GET  /api/page-sections?page_id=page-store&section_type=store-config
 *        Response: [ { id, content: <JSON string or object>, ... } ]
 *        Returns the seeded `sec-store-config` row.
 *
 *   PATCH /api/page-sections/sec-store-config
 *        Body:     { content: { slides, categories, pricePresets, sortOptions, meta } }
 *        Response: updated row
 *
 * ── Image upload contract ───────────────────────────────────────────────────
 *
 *   EditableImage → ImageEditor → your upload endpoint → { url, id, ... }
 *   StorePageEditor reads result.url from that response (handled inside
 *   SlideEditorPanel.handleImageChange — no work needed here).
 *
 * ── Usage ───────────────────────────────────────────────────────────────────
 *
 *   import { loadStoreConfig, saveStoreConfig } from "../api/storePageApi";
 *
 *   // React Query example (recommended):
 *   const { data } = useQuery(["store-config"], loadStoreConfig);
 *   return <StorePageEditor initialData={data} onSave={saveStoreConfig} />;
 *
 *   // Or plain async/await in a loader:
 *   const config = await loadStoreConfig();
 */

const BASE   = import.meta.env.VITE_API_URL ?? "";
const ROW_ID = "sec-store-config";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",   // send admin session cookie
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `[storePageApi] ${options.method ?? "GET"} ${path} → HTTP ${res.status}: ${body}`
    );
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// loadStoreConfig
//
// Returns the parsed StorePageConfig:
//   { slides, categories, pricePresets, sortOptions, meta }
// ─────────────────────────────────────────────────────────────────────────────

export async function loadStoreConfig() {
  const rows = await apiFetch(
    `/api/page-sections?page_id=page-store&section_type=store-config`
  );

  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) {
    throw new Error(
      "[storePageApi] Store config row not found. Did you run the seed? " +
      "(npx sequelize-cli db:seed --seed seed-store-page.js)"
    );
  }

  // content may already be a parsed object (if the API does it) or a JSON string
  const content =
    typeof row.content === "string"
      ? JSON.parse(row.content)
      : row.content;

  return content;
}

// ─────────────────────────────────────────────────────────────────────────────
// saveStoreConfig
//
// Accepts the full StorePageConfig and PATCHes it back.
// Called by StorePageEditor's onSave prop.
// ─────────────────────────────────────────────────────────────────────────────

export async function saveStoreConfig(config) {
  return apiFetch(`/api/page-sections/${ROW_ID}`, {
    method: "PATCH",
    body:   JSON.stringify({ content: config }),
  });
}