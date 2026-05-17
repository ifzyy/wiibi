/**
 * src/lib/queryClient.js
 *
 * React Query client — install: npm install @tanstack/react-query
 *
 * WHY REACT QUERY ON THE FRONTEND:
 *  - Once a user visits /store, the product list is cached in memory
 *  - When they navigate to a product detail and back, the list is INSTANT
 *    — no spinner, no re-fetch, feels like the page never left
 *  - Background refetch keeps data fresh without blocking the UI
 *  - Works perfectly alongside your node-cache backend — both layers cache,
 *    the user almost never waits for a network round-trip
 *
 * STALE TIME STRATEGY:
 *  These match your backend TTLs so both caches expire roughly together.
 *  Products / blog → 5 min stale time
 *  CMS content     → 10 min stale time
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        5 * 60 * 1000,   // 5 min — data considered fresh
      gcTime:           10 * 60 * 1000,  // 10 min — keep in memory after unmount
      retry:            1,               // one retry on failure, then error state
      refetchOnWindowFocus: false,       // don't refetch just because user switched tabs
    },
  },
});