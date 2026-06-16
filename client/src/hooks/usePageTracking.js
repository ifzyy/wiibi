/**
 * usePageTracking — records public page views for the admin analytics
 * dashboard (visitors, page views, most-visited pages).
 *
 * Fires POST /admin/analytics/track on every route change. Fire-and-forget:
 * analytics must never slow down or break the site, so all errors are
 * swallowed. Admin routes are excluded — staff activity isn't traffic.
 *
 * Respects the visitor's cookie choice: when analytics consent is off, no
 * tracking call is made at all (the server enforces the same for logged-in
 * users as a backstop). The server hashes the IP with a daily salt for
 * unique-visitor counts; nothing personally identifying is sent or stored.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api.js';
import { hasConsent } from '../utils/cookieConsent.js';

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
    if (!hasConsent('analytics')) return;        // visitor opted out of analytics
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    api.post('/admin/analytics/track', {
      path:      pathname,
      sessionId: getSessionId(),
      referrer:  document.referrer || null,
    }).catch(() => {});
  }, [pathname]);
}
