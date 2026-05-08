import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteCopy } from '@/contexts/useSiteCopy';
import { HomePageView } from '@/pages/HomePageView';

export function HomePage() {
  const { doc } = useSiteCopy();
  const { hash, pathname } = useLocation();

  useLayoutEffect(() => {
    if (pathname !== '/' || hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    if (pathname !== '/' || !hash) return;
    const id = hash.replace('#', '');
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [hash, pathname]);

  return <HomePageView siteImageOverrides={doc?.images} />;
}
