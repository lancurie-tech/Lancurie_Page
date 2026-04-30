import { createContext } from 'react';
import type { ContactIntent } from '@/types/contactIntent';

export type ContactDrawerContextValue = {
  open: (intent?: Partial<ContactIntent>) => void;
  close: () => void;
  isOpen: boolean;
  intent: ContactIntent | null;
};

export const ContactDrawerContext = createContext<ContactDrawerContextValue | null>(null);
