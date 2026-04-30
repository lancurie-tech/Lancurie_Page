import type { Timestamp } from 'firebase/firestore';
import type { SiteImageKey } from '@/data/siteImageConfig';
import type { SitePublicContent } from '@/types/sitePublicContent';

export type SiteCopyDoc = {
  contactEmail?: string;
  /** Dígitos com indicativo, ex. 351912345678 (sem +), para wa.me */
  whatsappPhone?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  /** @deprecated: usar `instagramUrl` */
  githubUrl?: string;
  /** Conteúdo editorial do site (substitui o antigo mapa `strings` por chave). */
  publicContent?: Partial<SitePublicContent>;
  /** @deprecated migrar para `publicContent`; mantido para leitura legada */
  strings?: Record<string, unknown>;
  /** URLs de imagens (absolutas ou caminhos relativos ao site). */
  images?: Partial<Record<SiteImageKey, string>>;
  updatedAt?: Timestamp;
};
