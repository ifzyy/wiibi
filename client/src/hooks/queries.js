/**
 * src/hooks/queries.js
 *
 * React Query hooks for every public data endpoint in Wiibi.
 * Install: npm install @tanstack/react-query
 *
 * HOW THIS REPLACES YOUR CURRENT PATTERN:
 *
 *   BEFORE (in every page component):
 *     const [data, setData] = useState([]);
 *     const [loading, setLoading] = useState(true);
 *     useEffect(() => {
 *       api.get('/public/products').then(r => setData(r.data.data)).finally(...)
 *     }, []);
 *
 *   AFTER:
 *     const { data = [], isLoading } = usePublicProducts();
 *     // First visit: fetches once, caches in memory
 *     // Back navigation: INSTANT — renders from memory before any network request
 *     // After 5 min: stale data shown immediately, fresh data swaps silently
 *
 * RELATIONSHIP WITH AuthContext AND CartContext:
 *   - AuthContext (user, isLoggedIn, login, logout) — keep exactly as-is
 *   - CartContext (cart, addToCart, removeItem...) — keep exactly as-is
 *   - These hooks replace ONLY the useState+useEffect in individual PAGE components
 *   - They don't touch your contexts at all
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';

// ── Query keys — one place, no magic strings ──────────────────────────────────
export const QK = {
  homepage:     ['homepage'],
  page:         (slug)   => ['page', slug],
  faqs:         ['faqs'],

  products:     ['products'],
  product:      (slug)   => ['product', slug],

  projects:     ['projects'],
  project:      (slug)   => ['project', slug],

  blog:         ['blog'],
  blogPost:     (slug)   => ['blog', slug],
  blogTags:     ['blog', 'tags'],
};

// ── Stale times — match your backend TTLs ─────────────────────────────────────
const STALE = {
  SHORT:  5  * 60 * 1000,   //  5 min
  MEDIUM: 10 * 60 * 1000,   // 10 min
  LONG:   30 * 60 * 1000,   // 30 min
};

// ── Homepage ──────────────────────────────────────────────────────────────────
export const useHomepage = () =>
  useQuery({
    queryKey: QK.homepage,
    queryFn:  () => api.get('/public/homepage').then(r => r.data.data || r.data),
    staleTime: STALE.MEDIUM,
  });

// ── CMS pages (about, services, contact) ──────────────────────────────────────
export const usePage = (slug) =>
  useQuery({
    queryKey: QK.page(slug),
    queryFn:  () => api.get(`/public/pages/${slug}`).then(r => r.data.data || r.data),
    enabled:  !!slug,
    staleTime: STALE.MEDIUM,
  });

// ── FAQs ──────────────────────────────────────────────────────────────────────
export const useFaqs = () =>
  useQuery({
    queryKey: QK.faqs,
    queryFn:  () => api.get('/public/faqs').then(r => r.data.data || r.data),
    staleTime: STALE.MEDIUM,
  });

// ── Products ──────────────────────────────────────────────────────────────────
// Pass filters object for search/category/sort — each unique filter combo
// is cached separately e.g. QK.products + { category: 'solar' }
export const usePublicProducts = (filters = {}) =>
  useQuery({
    queryKey: [...QK.products, filters],
    queryFn:  () => api.get('/public/products', { params: filters }).then(r => r.data.data || r.data),
    staleTime: STALE.SHORT,
  });

export const usePublicProduct = (slug) =>
  useQuery({
    queryKey: QK.product(slug),
    queryFn:  () => api.get(`/public/products/${slug}`).then(r => r.data.data || r.data),
    enabled:  !!slug,
    staleTime: STALE.SHORT,
  });

// ── Projects ──────────────────────────────────────────────────────────────────
export const usePublicProjects = () =>
  useQuery({
    queryKey: QK.projects,
    queryFn:  () => api.get('/public/projects').then(r => r.data.data || r.data),
    staleTime: STALE.SHORT,
  });

export const usePublicProject = (slug) =>
  useQuery({
    queryKey: QK.project(slug),
    queryFn:  () => api.get(`/public/projects/${slug}`).then(r => r.data.data || r.data),
    enabled:  !!slug,
    staleTime: STALE.SHORT,
  });

// ── Blog ──────────────────────────────────────────────────────────────────────
export const useBlogPosts = (filters = {}) =>
  useQuery({
    queryKey: [...QK.blog, filters],
    queryFn:  () => api.get('/blog', { params: filters }).then(r => r.data.data || r.data),
    staleTime: STALE.SHORT,
  });

export const useBlogPost = (slug) =>
  useQuery({
    queryKey: QK.blogPost(slug),
    queryFn:  () => api.get(`/blog/${slug}`).then(r => r.data.data || r.data),
    enabled:  !!slug,
    staleTime: STALE.SHORT,
  });

export const useBlogTags = () =>
  useQuery({
    queryKey: QK.blogTags,
    queryFn:  () => api.get('/blog/tags').then(r => r.data.data || r.data),
    staleTime: STALE.LONG,
  });