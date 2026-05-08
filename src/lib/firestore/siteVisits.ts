import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SiteVisit } from '@/types/siteVisit';
import type { VisitorGeo } from '@/lib/geo/visitorGeo';

export const SITE_VISITS_COLLECTION = 'siteVisits';

const MAX_SNAPSHOT_DOCS = 5000;

function colRef() {
  if (!db) return null;
  return collection(db, SITE_VISITS_COLLECTION);
}

function normalizePath(path: string): string {
  const t = path.trim();
  if (!t || t.length > 400) return '/';
  return t.startsWith('/') ? t : `/${t}`;
}

function normalizeKeyPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

/**
 * Regista no máximo 1 acesso por visitante por dia (fuso SP controlado no caller).
 * Falha em silêncio se o Firestore não estiver configurado ou a escrita for rejeitada.
 */
export function recordUniqueDailySiteVisit(
  path: string,
  visitorId: string,
  dayKey: string,
  geo?: VisitorGeo | null
): void {
  const c = colRef();
  if (!c) return;
  const normalizedPath = normalizePath(path);
  const safeVisitor = normalizeKeyPart(visitorId);
  const safeDay = normalizeKeyPart(dayKey);
  if (!safeVisitor || !safeDay) return;
  const visitRef = doc(c, `${safeDay}__${safeVisitor}`);

  void getDoc(visitRef)
    .then((snap) => {
      if (snap.exists()) return;
      return setDoc(visitRef, {
        path: normalizedPath,
        dayKey,
        visitorId,
        geo: geo
          ? {
              city: geo.city,
              region: geo.region,
              country: geo.country,
              countryCode: geo.countryCode,
              latitude: geo.latitude,
              longitude: geo.longitude,
            }
          : null,
        createdAt: serverTimestamp(),
      });
    })
    .catch(() => {
      /* evita ruído no console em ambientes sem regra/deploy */
    });
}

export function subscribeSiteVisitsSince(
  since: Date,
  onData: (items: SiteVisit[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const c = colRef();
  if (!c) {
    onData([]);
    return () => {};
  }
  const sinceTs = Timestamp.fromDate(since);
  const q = query(
    c,
    where('createdAt', '>=', sinceTs),
    orderBy('createdAt', 'desc'),
    limit(MAX_SNAPSHOT_DOCS)
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data() as Omit<SiteVisit, 'id'>;
          return { id: d.id, ...data };
        })
      );
    },
    (err) => {
      console.error('[Lancurie] siteVisits snapshot', err);
      onError?.(err);
      onData([]);
    }
  );
}
