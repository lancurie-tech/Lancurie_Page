import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SiteVisit } from '@/types/siteVisit';

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

/**
 * Regista uma visualização de página no site público (SPA).
 * Falha em silêncio se o Firestore não estiver configurado ou a escrita for rejeitada.
 */
export function recordSitePageView(path: string): void {
  const c = colRef();
  if (!c) return;
  void addDoc(c, {
    path: normalizePath(path),
    createdAt: serverTimestamp(),
  }).catch(() => {
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
