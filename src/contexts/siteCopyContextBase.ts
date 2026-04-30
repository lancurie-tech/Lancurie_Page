import { createContext } from 'react';
import type { SiteCopyDoc } from '@/types/siteCopy';
import type { SitePublicContent } from '@/types/sitePublicContent';

export type SiteCopyContextValue = {
  doc: SiteCopyDoc | null;
  ready: boolean;
  publicContent: SitePublicContent;
  /** Erro de listener getDoc, rede ou regras; null se ok. */
  loadError: string | null;
  /** Documento `siteCopy/default` não existe. */
  siteDocMissing: boolean;
  /** Texto editorial ainda vazio no `publicContent` vindo do Firestore. */
  editorialSeemsEmpty: boolean;
};

export const SiteCopyReactContext = createContext<SiteCopyContextValue | null>(null);
