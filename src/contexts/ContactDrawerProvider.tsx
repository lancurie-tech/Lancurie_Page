import * as React from 'react';
import { ContactDrawerContext } from '@/contexts/contactDrawerContextBase';
import type { ContactIntent } from '@/types/contactIntent';

const defaultIntent = (): ContactIntent => ({ origin: 'unknown' });

export function ContactDrawerProvider({ children }: { children: React.ReactNode }) {
  const [openState, setOpenState] = React.useState(false);
  const [intent, setIntent] = React.useState<ContactIntent | null>(null);

  const open = React.useCallback((partial?: Partial<ContactIntent>) => {
    setIntent({ ...defaultIntent(), ...partial });
    setOpenState(true);
  }, []);

  const close = React.useCallback(() => {
    setOpenState(false);
  }, []);

  const value = React.useMemo(
    () => ({
      open,
      close,
      isOpen: openState,
      intent: openState ? intent : null,
    }),
    [open, close, openState, intent]
  );

  return (
    <ContactDrawerContext.Provider value={value}>{children}</ContactDrawerContext.Provider>
  );
}
