import { Outlet, useLocation } from 'react-router-dom';
import { CookieConsentModal } from '@/components/analytics/CookieConsentModal';
import { SiteVisitTracker } from '@/components/analytics/SiteVisitTracker';
import { ChatLauncher } from '@/components/chat/ChatLauncher';
import { MarketingSubHeader } from '@/components/MarketingSubHeader';
import { ScrollToTop } from '@/components/ScrollToTop';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export function MainLayout() {
  const { pathname } = useLocation();
  const showMarketingSub = pathname === '/';

  return (
    <div
      id="top"
      className="relative flex min-h-screen flex-col bg-[radial-gradient(ellipse_120%_95%_at_50%_-14%,rgba(255,255,255,0.065)_0%,#050506_42%,#030303_100%)] text-zinc-50 antialiased"
    >
      <ScrollToTop />
      <SiteVisitTracker />
      {/* Vignette lateral (só ecrãs largos): escurece as bordas sem alterar o layout do conteúdo central. */}
      <div
        className="pointer-events-none fixed inset-0 z-5 hidden bg-[linear-gradient(to_right,rgba(0,0,0,0.28)_0%,transparent_14%,transparent_86%,rgba(0,0,0,0.28)_100%)] xl:block 2xl:bg-[linear-gradient(to_right,rgba(0,0,0,0.38)_0%,transparent_12%,transparent_88%,rgba(0,0,0,0.38)_100%)] min-[1920px]:bg-[linear-gradient(to_right,rgba(0,0,0,0.48)_0%,transparent_10%,transparent_90%,rgba(0,0,0,0.48)_100%)]"
        aria-hidden
      />
      {/* Cabeçalho preto sólido; o degradê para o fundo da página fica no topo do conteúdo (hero / primeira secção). */}
      <div className="sticky top-0 z-50 border-b border-zinc-800/55 bg-[#050508] shadow-[0_1px_0_0_rgba(255,255,255,0.06),0_8px_32px_-8px_rgba(0,0,0,0.65)]">
        <SiteHeader />
        {showMarketingSub ? <MarketingSubHeader /> : null}
      </div>
      <Outlet />
      <SiteFooter />
      <ChatLauncher />
      <CookieConsentModal />
    </div>
  );
}
