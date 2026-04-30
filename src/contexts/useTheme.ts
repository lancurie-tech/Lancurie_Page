import { useContext } from 'react';
import { ThemeReactContext } from '@/contexts/themeContextBase';

export function useTheme() {
  const ctx = useContext(ThemeReactContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
