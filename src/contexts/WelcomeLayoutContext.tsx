import { useRef, useState, type ReactNode } from 'react';
import { WelcomeLayoutContext } from './welcomeLayoutContextBase';

export function WelcomeLayoutProvider({ children }: { children: ReactNode }) {
  const headerLogoAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const [siteVisualUnlocked, setSiteVisualUnlocked] = useState(false);

  return (
    <WelcomeLayoutContext.Provider
      value={{
        headerLogoAnchorRef,
        siteVisualUnlocked,
        setSiteVisualUnlocked,
      }}
    >
      {children}
    </WelcomeLayoutContext.Provider>
  );
}
