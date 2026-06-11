/**
 * usePublicSettings — public global settings (site name, contacts, socials,
 * delivery fee, …) edited in the admin Settings page.
 *
 * Fetched once per session and shared module-wide, so the Footer, Nav, and
 * Checkout don't each hit the API. The server caches the payload too and
 * invalidates it the moment an admin saves, so changes go live on the next
 * page load.
 */
import { useState, useEffect } from 'react';
import api from '../utils/api.js';

let cached   = null;
let inflight = null;

const fetchSettings = () => {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = api.get('/public/settings')
      .then((r) => { cached = r.data ?? {}; return cached; })
      .catch(() => ({}))
      .finally(() => { inflight = null; });
  }
  return inflight;
};

export default function usePublicSettings() {
  const [settings, setSettings] = useState(cached ?? {});

  useEffect(() => {
    let mounted = true;
    fetchSettings().then((s) => { if (mounted) setSettings(s); });
    return () => { mounted = false; };
  }, []);

  return settings;
}
