import { createContext } from 'react';
import type { PublicPageText } from '@/types/sitePublicContent';

export type I18nContextValue = {
  publicText: PublicPageText;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
