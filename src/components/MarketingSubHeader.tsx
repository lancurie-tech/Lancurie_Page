import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useHomeSectionSpy, type HomeSection } from '@/hooks/useHomeSectionSpy';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/cn';

/**
 * Sub-header discreto: acompanha o scroll (caminho); visual mais leve que o header principal.
 */
export function MarketingSubHeader() {
  const { publicText: p } = useI18n();
  const { pathname } = useLocation();
  const spy = useHomeSectionSpy();
  const current = pathname === '/' ? spy : 'home';

  const tabs = useMemo(
    () => {
      const homeLabel = p.nav.home.trim() || 'Início';
      const processLabel = p.nav.process.trim() || p.nav.approach.trim() || 'Processo';
      const servicesLabel = p.nav.services.trim() || 'Serviços';
      const proofLabel = p.nav.proof.trim() || 'Destaques';

      return [
        { section: 'home' as const, to: '/#hero', label: homeLabel },
        { section: 'approach' as const, to: '/#approach', label: processLabel },
        { section: 'services' as const, to: '/#servicos', label: servicesLabel },
        { section: 'proof' as const, to: '/#prova', label: proofLabel },
      ] as { section: HomeSection; to: string; label: string }[];
    },
    [p.nav]
  );

  return (
    <div
      className="relative z-40 border-t border-zinc-800/35 bg-linear-to-b from-[#050508] via-[#060607] to-[#080809] backdrop-blur-[3px] [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.04)]"
      role="navigation"
      aria-label={p.marketing.subnavAria}
    >
      <div className="mx-auto max-w-6xl">
        <div
          className={cn(
            'overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]',
            '[&::-webkit-scrollbar]:hidden'
          )}
        >
          <ul className="mx-auto flex w-max min-h-10 max-w-none items-center justify-center gap-1 px-2 py-2 sm:min-h-11 sm:gap-1.5 sm:px-3 sm:py-2.5">
            {tabs.map((item) => (
              <li key={item.to} className="shrink-0">
                <Link
                  to={item.to}
                  className={cn(
                    'inline-flex items-center rounded-md px-2.5 py-1.5 text-center text-[0.68rem] leading-tight font-medium tracking-[0.04em] transition-colors sm:px-3 sm:py-2 sm:text-[0.74rem] sm:leading-normal sm:tracking-wide',
                    pathname === '/' && current === item.section
                      ? 'text-zinc-100 underline decoration-zinc-400/55 decoration-2 underline-offset-[0.22em]'
                      : 'text-zinc-400 hover:text-zinc-100'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
