import { useMemo } from 'react';
import type { SiteImageKey } from '@/data/siteImageConfig';
import { useSiteCopy } from '@/contexts/useSiteCopy';
import { resolveSiteImage } from '@/lib/siteImages';

/**
 * Resolve já com defaults em `public/brand/` para o logo e ícones aparecerem no
 * primeiro paint. Se o Firestore tiver `images.*` diferente (ex.: Storage),
 * o `src` atualiza quando o doc chega — possível troca breve, mas entrada mais rápida.
 */
export function useSiteImageUrl(key: SiteImageKey): string {
  const { doc } = useSiteCopy();
  return useMemo(() => resolveSiteImage(key, doc?.images), [doc?.images, key]);
}
