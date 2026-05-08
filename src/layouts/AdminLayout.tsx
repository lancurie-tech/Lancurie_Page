import { BarChart3, LogOut, FileText, Home, Menu } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useSiteImageUrl } from '@/hooks/useSiteImage';
import { cn } from '@/lib/cn';

function AdminHeader({ adminLogo }: { adminLogo: string | null }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [elevated, setElevated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = useCallback(async () => {
    navigate('/', { replace: true });
    await Promise.resolve();
    await logout();
  }, [logout, navigate]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuWrapRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const headerBar = cn(
    'relative border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-out',
    elevated
      ? 'border-zinc-800/85 bg-[#050508]/93 backdrop-blur-md'
      : 'border-zinc-800/40 bg-[#050508]/90 backdrop-blur-sm'
  );

  return (
    <header className={cn(headerBar, 'relative z-60')}>
      <div className="mx-auto grid min-h-19 max-w-6xl grid-cols-[minmax(2.5rem,1fr)_auto_minmax(2.5rem,1fr)] items-center px-3 py-2 sm:min-h-20 sm:px-5 sm:py-2.5 md:min-h-21">
        <div aria-hidden className="min-w-10" />

        <div className="flex min-w-0 justify-center justify-self-center px-1 sm:px-2">
          <Link
            to="/admin"
            className="inline-flex max-w-full min-h-13 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-500/70 sm:min-h-[3.65rem] md:min-h-16 lg:min-h-[4.35rem]"
          >
            {adminLogo ? (
              <img
                src={adminLogo}
                alt="Lancurie Technology"
                width={420}
                height={108}
                className="h-13 w-auto max-w-[min(92vw,360px)] object-contain object-center sm:h-[3.65rem] sm:max-w-[min(100%,400px)] md:h-16 md:max-w-[min(100%,440px)] lg:h-[4.35rem]"
              />
            ) : null}
          </Link>
        </div>

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-0.5 sm:gap-1.5">
          <div className="hidden items-center gap-0.5 sm:flex sm:gap-1.5">
            <Link
              to="/"
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
              aria-label="Ver site"
              title="Ver site"
            >
              <Home className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden />
            </Link>
            <NavLink
              to="/admin/home"
              className={({ isActive }) =>
                cn(
                  'rounded-full p-2 transition-colors',
                  isActive
                    ? 'bg-zinc-800/80 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
                )
              }
              aria-label="Conteúdo da Home"
              title="Conteúdo da Home"
            >
              <FileText className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden />
            </NavLink>
            <NavLink
              to="/admin/acessos"
              className={({ isActive }) =>
                cn(
                  'rounded-full p-2 transition-colors',
                  isActive
                    ? 'bg-zinc-800/80 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
                )
              }
              aria-label="Acessos ao site"
              title="Acessos ao site"
            >
              <BarChart3 className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden />
            </NavLink>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div className="relative sm:hidden" ref={menuWrapRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
              aria-label="Menu admin"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <Menu className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} aria-hidden />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-full z-80 mt-1.5 rounded-xl border border-zinc-700/90 bg-zinc-900/95 p-1.5 shadow-lg backdrop-blur-md">
                <div className="flex flex-col items-stretch gap-1">
                  <Link
                    to="/"
                    className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                    aria-label="Ver site"
                    title="Ver site"
                  >
                    <Home className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
                  </Link>
                  <Link
                    to="/admin/home"
                    className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                    aria-label="Conteúdo da Home"
                    title="Conteúdo da Home"
                  >
                    <FileText className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
                  </Link>
                  <Link
                    to="/admin/acessos"
                    className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                    aria-label="Acessos ao site"
                    title="Acessos ao site"
                  >
                    <BarChart3 className="h-4.5 w-4.5" strokeWidth={2} aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
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
        </div>
      </div>
    </header>
  );
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const adminLogo = useSiteImageUrl('logoFull');

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      <AdminHeader key={pathname} adminLogo={adminLogo} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
