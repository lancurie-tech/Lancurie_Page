import { createContext, type RefObject } from 'react';

export type WelcomeLayoutContextValue = {
  headerLogoAnchorRef: RefObject<HTMLAnchorElement | null>;
  siteVisualUnlocked: boolean;
  setSiteVisualUnlocked: (v: boolean) => void;
};

export const WelcomeLayoutContext = createContext<WelcomeLayoutContextValue | null>(null);
