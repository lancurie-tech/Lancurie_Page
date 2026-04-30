import { useContext } from 'react';
import { ContactDrawerContext, type ContactDrawerContextValue } from '@/contexts/contactDrawerContextBase';

export function useContactDrawer(): ContactDrawerContextValue {
  const ctx = useContext(ContactDrawerContext);
  if (!ctx) {
    throw new Error('useContactDrawer must be used within ContactDrawerProvider');
  }
  return ctx;
}
