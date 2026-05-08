import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type HomeSection =
  | 'home'
  | 'proof'
  | 'services'
  | 'approach';

const order: { id: string; section: HomeSection }[] = [
  { id: 'hero', section: 'home' },
  { id: 'trust', section: 'home' },
  { id: 'approach', section: 'approach' },
  { id: 'servicos', section: 'services' },
  { id: 'prova', section: 'proof' },
];

/**
 * Secção “em foco” ao scroll — o sub-header acompanha como um caminho.
 */
export function useHomeSectionSpy(): HomeSection {
  const { pathname } = useLocation();
  const [active, setActive] = useState<HomeSection>('home');

  useEffect(() => {
    if (pathname !== '/') return;

    const focusY = () => window.innerHeight * 0.28;

    const update = () => {
      if (window.scrollY < 48) {
        setActive('home');
        return;
      }

      const y = focusY();

      for (let i = order.length - 1; i >= 0; i--) {
        const { id, section } = order[i]!;
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom >= y) {
          setActive(section);
          return;
        }
      }

      let best: HomeSection = 'home';
      let bestDist = Infinity;
      for (const { id, section } of order) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const mid = (r.top + r.bottom) / 2;
        const d = Math.abs(mid - y);
        if (d < bestDist) {
          bestDist = d;
          best = section;
        }
      }
      setActive(best);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  return active;
}
