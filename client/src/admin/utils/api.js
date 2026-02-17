import axios from 'axios';

export const API_BASE = 'http://localhost:5000/api';

export const api = axios.create({ baseURL: API_BASE });

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const PAGES = [
  { id: 'page-home',    label: 'Homepage', slug: 'home',    icon: 'home',  color: '#f59e0b' },
  { id: 'page-store',   label: 'Store',    slug: 'store',   icon: 'store', color: '#10b981' },
  { id: 'page-about',   label: 'About',    slug: 'about',   icon: 'users', color: '#6366f1' },
  { id: 'page-contact', label: 'Contact',  slug: 'contact', icon: 'file',  color: '#ec4899' },
  { id: 'page-blog',    label: 'Blog',     slug: 'blog',    icon: 'blog',  color: '#0ea5e9' },
  { id: 'page-faq',     label: 'FAQ',      slug: 'faq',     icon: 'zap',   color: '#8b5cf6' },
];

export const NAV_SECTIONS = [
  { id: 'pages',    label: 'Pages',    icon: 'layout'  },
  { id: 'products', label: 'Products', icon: 'package' },
  { id: 'blog',     label: 'Blog',     icon: 'blog'    },
  { id: 'settings', label: 'Settings', icon: 'settings'},
];

export const SECTION_LABELS = {
  hero:          { label: 'Hero',         color: '#f59e0b' },
  'store-preview':{ label: 'Store Preview',color: '#10b981' },
  stats:         { label: 'Stats',         color: '#6366f1' },
  'blog-teaser': { label: 'Blog',          color: '#0ea5e9' },
  testimonials:  { label: 'Testimonials',  color: '#ec4899' },
  'faq-teaser':  { label: 'FAQ',           color: '#8b5cf6' },
  cta:           { label: 'CTA',           color: '#ef4444' },
};
