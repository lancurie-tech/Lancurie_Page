import { useContext } from 'react';
import { WelcomeLayoutContext } from './welcomeLayoutContextBase';

export function useWelcomeLayout() {
  const ctx = useContext(WelcomeLayoutContext);
  if (!ctx) {
    throw new Error('useWelcomeLayout must be used within WelcomeLayoutProvider');
  }
  return ctx;
}
