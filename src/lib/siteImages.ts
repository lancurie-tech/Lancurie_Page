import { SITE_IMAGE_KEYS, SITE_IMAGE_DEFAULTS, type SiteImageKey } from '@/data/siteImageConfig';

export function resolveSiteImage(
  key: SiteImageKey,
  overrides?: Partial<Record<SiteImageKey, string>> | null
): string {
  const v = overrides?.[key]?.trim();
  if (v) return v;
  return SITE_IMAGE_DEFAULTS[key];
}

/** Junta camadas: primeiro `base`, depois `extra` (rascunho admin sobrepõe o doc). */
export function mergeSiteImageOverrides(
  base?: Partial<Record<SiteImageKey, string>> | null,
  extra?: Partial<Record<SiteImageKey, string>> | null
): Partial<Record<SiteImageKey, string>> {
  return { ...(base ?? {}), ...(extra ?? {}) };
}

/** Mantém só chaves usadas no site (ignora campos legados no documento Firestore). */
export function pickKnownSiteImages(
  raw: Partial<Record<string, string>> | undefined
): Partial<Record<SiteImageKey, string>> {
  const out: Partial<Record<SiteImageKey, string>> = {};
  if (!raw) return out;
  for (const k of SITE_IMAGE_KEYS) {
    const v = raw[k]?.trim();
    if (v) out[k] = v;
  }
  return out;
}
