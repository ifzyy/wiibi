/**
 * usePageTracking — records public page views for the admin analytics
 * dashboard (visitors, page views, most-visited pages).
 *
 * Fires POST /admin/analytics/track on every route change. Fire-and-forget:
 * analytics must never slow down or break the site, so all errors are
 * swallowed. Admin routes are excluded — staff activity isn't traffic.
 *
 * The server hashes the IP with a daily salt for unique-visitor counts;
 * nothing personally identifying is sent or stored beyond that.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api.js';

const getSessionId = () => {
  let id = sessionStorage.getItem('wb_session');
  if (!id) {
    id = window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('wb_session', id);
  }
  return id;
};

export default function usePageTracking() {
  const { pathname } = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    api.post('/admin/analytics/track', {
      path:      pathname,
      sessionId: getSessionId(),
      referrer:  document.referrer || null,
    }).catch(() => {});
  }, [pathname]);
}
