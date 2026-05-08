import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ANALYTICS_CONSENT_EVENT, hasAnalyticsConsent } from '@/lib/analyticsConsent';
import { formatSaoPauloDayKey } from '@/lib/date/saoPauloDayKey';
import { getVisitorGeo } from '@/lib/geo/visitorGeo';
import { recordUniqueDailySiteVisit } from '@/lib/firestore/siteVisits';

const DEBOUNCE_MS = 3500;
const SESSION_KEY = 'lancurie:lastPageView';
const VISITOR_ID_KEY = 'lancurie:visitorId';

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

function readOrCreateVisitorId(): string | null {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.trim()) return existing;
    const next =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(VISITOR_ID_KEY, next);
    return next;
  } catch {
    return null;
  }
}

/**
 * Regista no máximo 1 acesso por visitante por dia (fuso São Paulo) no site público.
 * Também evita duplicados imediatos (Strict Mode / re-render) com debounce em sessionStorage.
 */
export function SiteVisitTracker() {
  const { pathname } = useLocation();
  const [consentAccepted, setConsentAccepted] = useState<boolean>(() => hasAnalyticsConsent());

  useEffect(() => {
    const syncConsent = () => setConsentAccepted(hasAnalyticsConsent());
    window.addEventListener(ANALYTICS_CONSENT_EVENT, syncConsent as EventListener);
    window.addEventListener('storage', syncConsent);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, syncConsent as EventListener);
      window.removeEventListener('storage', syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!consentAccepted) return;
    const now = Date.now();
    const prev = readLastSent();
    if (prev && prev.path === pathname && now - prev.at < DEBOUNCE_MS) {
      return;
    }

    writeLastSent(pathname, now);
    const visitorId = readOrCreateVisitorId();
    if (!visitorId) return;
    const dayKey = formatSaoPauloDayKey(new Date());
    void getVisitorGeo(dayKey).then((geo) => {
      recordUniqueDailySiteVisit(pathname, visitorId, dayKey, geo);
    });
  }, [pathname, consentAccepted]);

  return null;
}
