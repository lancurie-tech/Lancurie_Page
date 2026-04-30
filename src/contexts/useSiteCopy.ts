import { useContext } from 'react';
import { SiteCopyReactContext, type SiteCopyContextValue } from '@/contexts/siteCopyContextBase';

export function useSiteCopy(): SiteCopyContextValue {
  const ctx = useContext(SiteCopyReactContext);
  if (!ctx) throw new Error('useSiteCopy must be used within SiteCopyProvider');
  return ctx;
}
