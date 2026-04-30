import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Garante que cada navegação começa no topo (evita herdar scroll da Home). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
