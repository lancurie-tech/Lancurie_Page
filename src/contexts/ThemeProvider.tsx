import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import { ThemeReactContext, type Theme } from '@/contexts/themeContextBase';

/** Interface sempre em modo escuro (sem seguir o tema do sistema). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.classList.add('dark');
  }, []);

  const value = useMemo(() => ({ theme: 'dark' as Theme }), []);

  return (
    <ThemeReactContext.Provider value={value}>{children}</ThemeReactContext.Provider>
  );
}
