import { useMemo } from 'react';
import type { SiteImageKey } from '@/data/siteImageConfig';
import { useSiteCopy } from '@/contexts/useSiteCopy';
import { resolveSiteImage } from '@/lib/siteImages';

/**
 * Só devolve URL depois da primeira leitura do `siteCopy`, para não mostrar
 * ficheiros por defeito no bundle e depois trocar pela imagem do CMS/Storage.
 */
export function useSiteImageUrl(key: SiteImageKey): string | null {
  const { doc, ready } = useSiteCopy();
  return useMemo(() => {
    if (!ready) return null;
    return resolveSiteImage(key, doc?.images);
  }, [doc?.images, key, ready]);
}
