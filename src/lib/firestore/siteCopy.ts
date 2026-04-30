import {
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { SITE_IMAGE_KEYS, type SiteImageKey } from '@/data/siteImageConfig';
import { getPublicContentFromDoc } from '@/lib/sitePublicContentMerge';
import { db } from '@/lib/firebase/config';
import { syncSiteImageStorageOnPersist } from '@/lib/firebase/siteImageStorage';
import { pickKnownSiteImages } from '@/lib/siteImages';
import type { SitePublicContent } from '@/types/sitePublicContent';
import type { SiteCopyDoc } from '@/types/siteCopy';

export const SITE_COPY_COLLECTION = 'siteCopy';
export const SITE_COPY_DOC_ID = 'default';

export function siteCopyRef() {
  if (!db) return null;
  return doc(db, SITE_COPY_COLLECTION, SITE_COPY_DOC_ID);
}

export function subscribeSiteCopy(
  onData: (data: SiteCopyDoc | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const ref = siteCopyRef();
  if (!ref) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    ref,
    (snap) => {
      onData(snap.exists() ? (snap.data() as SiteCopyDoc) : null);
    },
    (err) => {
      console.error('[Lancurie] siteCopy snapshot', err);
      onError?.(err);
      onData(null);
    }
  );
}

export type AdminSiteDraft = {
  contactEmail: string;
  whatsappPhone: string;
  linkedinUrl: string;
  instagramUrl: string;
  /** Conteúdo editorial completo (fundo repositório + personalização). */
  publicContent: SitePublicContent;
  images: Partial<Record<SiteImageKey, string>>;
};

/**
 * Aplica o rascunho ao documento, remove campos vazios e publica o `publicContent` estruturado.
 */
export async function saveAdminSiteDraft(draft: AdminSiteDraft): Promise<void> {
  const ref = siteCopyRef();
  if (!ref) throw new Error('O Firestore não está disponível.');
  const snap = await getDoc(ref);
  const prev = snap.exists() ? ({ ...(snap.data() as SiteCopyDoc) } as SiteCopyDoc) : ({} as SiteCopyDoc);
  const prevImagesKnown = pickKnownSiteImages(prev.images);
  const nextImages: Partial<Record<SiteImageKey, string>> = {};

  for (const key of SITE_IMAGE_KEYS) {
    const url = (draft.images[key] ?? '').trim();
    if (url) nextImages[key] = url;
  }

  for (const key of SITE_IMAGE_KEYS) {
    const next = (nextImages[key] ?? '').trim();
    const prevUrl = (prevImagesKnown[key] ?? '').trim();
    if (next !== prevUrl) {
      await syncSiteImageStorageOnPersist({ key, next, prev: prevUrl });
    }
  }

  const contactTrim = draft.contactEmail.trim();
  const whatsappTrim = draft.whatsappPhone.replace(/\D/g, '');
  const linkedinTrim = draft.linkedinUrl.trim();
  const instagramTrim = draft.instagramUrl.trim();

  await setDoc(
    ref,
    {
      ...prev,
      contactEmail: contactTrim ? contactTrim : deleteField(),
      whatsappPhone: whatsappTrim ? whatsappTrim : deleteField(),
      linkedinUrl: linkedinTrim ? linkedinTrim : deleteField(),
      instagramUrl: instagramTrim ? instagramTrim : deleteField(),
      githubUrl: deleteField(),
      publicContent: draft.publicContent,
      strings: deleteField(),
      images: Object.keys(nextImages).length > 0 ? nextImages : deleteField(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function patchSiteCopyImage(key: SiteImageKey, url: string): Promise<void> {
  const ref = siteCopyRef();
  if (!ref) throw new Error('O Firestore não está disponível.');
  const snap = await getDoc(ref);
  const prev = snap.exists() ? (snap.data() as SiteCopyDoc) : ({} as SiteCopyDoc);
  const prevKnown = pickKnownSiteImages(prev.images);
  const merged: Partial<Record<SiteImageKey, string>> = { ...prevKnown, [key]: url.trim() };
  const cleaned: Partial<Record<SiteImageKey, string>> = {};
  for (const k of SITE_IMAGE_KEYS) {
    const v = (merged[k] ?? '').trim();
    if (v) cleaned[k] = v;
  }
  await setDoc(
    ref,
    {
      images: Object.keys(cleaned).length > 0 ? cleaned : deleteField(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function buildDraftFromDoc(doc: SiteCopyDoc | null): AdminSiteDraft {
  return {
    contactEmail: doc?.contactEmail?.trim() ?? '',
    whatsappPhone: doc?.whatsappPhone?.replace(/\D/g, '') ?? '',
    linkedinUrl: doc?.linkedinUrl?.trim() ?? '',
    instagramUrl: doc?.instagramUrl?.trim() || doc?.githubUrl?.trim() || '',
    publicContent: getPublicContentFromDoc(doc),
    images: structuredClone(pickKnownSiteImages(doc?.images)),
  };
}
