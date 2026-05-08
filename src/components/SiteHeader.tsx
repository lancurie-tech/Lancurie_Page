import { ArrowLeft, BarChart3, FileText, Home, LogOut, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useWelcomeLayout } from '@/contexts/useWelcomeLayout';
import { useI18n } from '@/i18n/useI18n';
import { useSiteImageUrl } from '@/hooks/useSiteImage';
import { cn } from '@/lib/cn';

export function SiteHeader() {
  const { publicText: p } = useI18n();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const logoSrc = useSiteImageUrl('logoFull');
  const { headerLogoAnchorRef, siteVisualUnlocked } = useWelcomeLayout();
  const [elevated, setElevated] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuWrapRef = useRef<HTMLDivElement | null>(null);
  const isServicesRoute = pathname.startsWith('/servicos');
  const backTo = pathname === '/servicos' ? '/' : '/servicos';

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!adminMenuOpen) return;
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (adminMenuWrapRef.current?.contains(target)) return;
      setAdminMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAdminMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [adminMenuOpen]);

  const headerBar = cn(
    'relative border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-out',
    elevated
      ? 'border-zinc-800/85 bg-[#050508]/93 backdrop-blur-md'
      : 'border-transparent bg-[#050508]/35 backdrop-blur-sm'
  );

  return (
    <header className={cn(headerBar, 'relative z-60')}>
      <div className="mx-auto grid min-h-19 max-w-6xl grid-cols-[minmax(2.5rem,1fr)_auto_minmax(2.5rem,1fr)] items-center px-3 py-2 sm:min-h-20 sm:px-5 sm:py-2.5 md:min-h-21">
        <div className="min-w-0 justify-self-start">
          {isServicesRoute ? (
            <Link
              to={backTo}
              className="rounded-full p-2.5 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} aria-hidden />
            </Link>
          ) : (
            <span aria-hidden />
          )}
        </div>

        <div className="flex min-w-0 justify-center justify-self-center px-1 sm:px-2">
          <Link
            ref={headerLogoAnchorRef}
            to="/"
            className="inline-flex max-w-full items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-500/70"
          >
            {logoSrc ? (
              <span
                className={cn(
                  'inline-flex h-13 max-w-[min(92vw,360px)] items-center justify-center sm:h-[3.65rem] sm:max-w-[min(100%,400px)] md:h-16 md:max-w-[min(100%,440px)] lg:h-[4.35rem]'
                )}
              >
                <img
                  src={logoSrc}
                  alt={p.brandName}
                  width={420}
                  height={108}
                  className={cn(
                    'h-full w-full object-contain object-center transition-opacity duration-300',
                    siteVisualUnlocked ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </span>
            ) : null}
          </Link>
        </div>

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-1 sm:gap-2">
          {user ? (
            <>
              <div className="hidden items-center gap-1 sm:flex sm:gap-2">
                <Link
                  to="/"
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
                  aria-label="Ver site"
                  title="Ver site"
                >
                  <Home className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden />
                </Link>
                <Link
                  to="/admin/home"
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
                  aria-label="Conteúdo da Home"
                  title="Conteúdo da Home"
                >
                  <FileText className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden />
                </Link>
                <Link
                  to="/admin/acessos"
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
                  aria-label="Acessos ao site"
                  title="Acessos ao site"
                >
                  <BarChart3 className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
                  aria-label="Sair"
                  title="Sair"
                >
                  <LogOut className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden />
                </button>
              </div>

              <div className="relative sm:hidden" ref={adminMenuWrapRef}>
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen((prev) => !prev)}
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
                  aria-label="Menu admin"
                  aria-expanded={adminMenuOpen}
                  aria-haspopup="menu"
                >
                  <Menu className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} aria-hidden />
                </button>

                {adminMenuOpen ? (
                  <div className="absolute right-0 top-full z-80 mt-1.5 rounded-xl border border-zinc-700/90 bg-zinc-900/95 p-1.5 shadow-lg backdrop-blur-md">
                    <div className="flex flex-col items-stretch gap-1">
                      <Link
                        to="/"
                        onClick={() => setAdminMenuOpen(false)}
                        className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                        aria-label="Ver site"
                        title="Ver site"
                      >
                        <Home className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
                      </Link>
                      <Link
                        to="/admin/home"
                        onClick={() => setAdminMenuOpen(false)}
                        className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                        aria-label="Conteúdo da Home"
                        title="Conteúdo da Home"
                      >
                        <FileText className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
                      </Link>
                      <Link
                        to="/admin/acessos"
                        onClick={() => setAdminMenuOpen(false)}
                        className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                        aria-label="Acessos ao site"
                        title="Acessos ao site"
                      >
                        <BarChart3 className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminMenuOpen(false);
                          void logout();
                        }}
                        className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                        aria-label="Sair"
                        title="Sair"
                      >
                        <LogOut className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <span aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}
