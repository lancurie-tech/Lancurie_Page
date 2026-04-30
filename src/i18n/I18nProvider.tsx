import { useEffect, useMemo, type ReactNode } from 'react';
import { useSiteCopy } from '@/contexts/useSiteCopy';
import { I18nContext } from './context';

export type { PublicPageText } from '@/types/sitePublicContent';

/**
 * Copy do site: `publicContent` normalizado a partir do Firestore (apenas português).
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { publicContent } = useSiteCopy();

  const publicText = useMemo(() => publicContent, [publicContent]);

  const value = useMemo(() => ({ publicText }), [publicText]);

  useEffect(() => {
    document.documentElement.lang = 'pt-BR';
    document.title = 'Lancurie';
  }, []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
