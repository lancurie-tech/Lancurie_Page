import { createContext } from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
};

export const ThemeReactContext = createContext<ThemeContextValue | null>(null);
