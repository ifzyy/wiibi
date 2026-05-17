/**
 * utils/cache.js
 *
 * Thin wrapper around node-cache.
 * Install:  npm install node-cache
 *
 * WHY NODE-CACHE OVER REDIS FOR YOUR SCALE:
 *  - Zero infrastructure cost — lives in your existing Node process RAM
 *  - Zero latency — it's a JS Map, not a network round-trip
 *  - Survives fine on restart — your DB is source of truth anyway
 *  - Redis only wins when you have MULTIPLE server instances sharing cache.
 *    One server = node-cache wins every time.
 *
 * TTL STRATEGY:
 *   Products / Blog  →  5 min  (changes occasionally)
 *   CMS / Homepage   → 10 min  (changes rarely, admin clears on save)
 *   Categories       → 30 min  (almost never changes)
 *
 * INVALIDATION:
 *   Call cache.del(KEYS.xxx) in admin controllers after any save/update.
 *   Cache is always fresh within one save cycle.
 */

import NodeCache from 'node-cache';

const store = new NodeCache({
  stdTTL:      300,   // default: 5 min
  checkperiod: 60,    // sweep for expired keys every 60s
});

// ── Key constants — use these everywhere, no magic strings ───────────────────
export const KEYS = {
  PRODUCTS_ALL: 'products:all',
  PRODUCT:      (slug)   => `product:${slug}`,
  BLOG_POSTS:   'blog:all',
  BLOG_POST:    (slug)   => `blog:${slug}`,
  CMS:          (pageId) => `cms:${pageId}`,
  HOMEPAGE:     'cms:page-home',
  CATEGORIES:   'categories:all',
};

// ── TTL constants (seconds) ───────────────────────────────────────────────────
export const TTL = {
  SHORT:  5  * 60,   //  5 min
  MEDIUM: 10 * 60,   // 10 min
  LONG:   30 * 60,   // 30 min
};

/**
 * getOrSet — the one function you'll use 95% of the time.
 *
 * Checks cache first. On hit: returns instantly, zero DB query.
 * On miss: calls fetchFn(), caches the result, returns it.
 *
 * Example:
 *   const products = await cache.getOrSet(
 *     KEYS.PRODUCTS_ALL,
 *     () => Product.findAll({ where: { is_visible: true } }),
 *     TTL.SHORT
 *   );
 */
export const getOrSet = async (key, fetchFn, ttl = TTL.SHORT) => {
  const cached = store.get(key);
  if (cached !== undefined) return cached;   // hit

  const fresh = await fetchFn();             // miss — query DB
  store.set(key, fresh, ttl);
  return fresh;
};

export const get   = (key)              => store.get(key);
export const set   = (key, val, ttl)    => store.set(key, val, ttl ?? TTL.SHORT);
export const del   = (keys)             => store.del(keys);   // string or string[]
export const flush = ()                 => store.flushAll();
export const stats = ()                 => store.getStats();

export default { getOrSet, get, set, del, flush, stats, KEYS, TTL };