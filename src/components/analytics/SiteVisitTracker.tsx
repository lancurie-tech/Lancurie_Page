import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordSitePageView } from '@/lib/firestore/siteVisits';

const DEBOUNCE_MS = 3500;
const SESSION_KEY = 'lancurie:lastPageView';

function readLastSent(): { path: string; at: number } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { path?: string; at?: number };
    if (typeof parsed.path !== 'string' || typeof parsed.at !== 'number') return null;
    return { path: parsed.path, at: parsed.at };
  } catch {
    return null;
  }
}

function writeLastSent(path: string, at: number): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ path, at }));
  } catch {
    /* ignore */
  }
}

/**
 * Regista visualizações do site público para o dashboard administrativo.
 * Evita duplicados imediatos (Strict Mode / re-render) com debounce em sessionStorage.
 */
export function SiteVisitTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    const now = Date.now();
    const prev = readLastSent();
    if (prev && prev.path === pathname && now - prev.at < DEBOUNCE_MS) {
      return;
    }

    writeLastSent(pathname, now);
    recordSitePageView(pathname);
  }, [pathname]);

  return null;
}
