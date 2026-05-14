import { Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { siteDomain } from '@/lib/site';
import { usePublicSiteSettings } from '@/contexts/usePublicSiteSettings';
import { useI18n } from '@/i18n/useI18n';
import { useSiteImageUrl } from '@/hooks/useSiteImage';
import { clearAnalyticsConsent } from '@/lib/analyticsConsent';
import { cn } from '@/lib/cn';

export function SiteFooter() {
  const { publicText: p } = useI18n();
  const { user } = useAuth();
  const { socialLinks } = usePublicSiteSettings();
  const footerFaviconSrc = useSiteImageUrl('footerFavicon');
  const year = new Date().getFullYear();
  const iconShellClass = cn(
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-700/90',
    'bg-black p-1 shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-colors sm:h-14 sm:w-14 sm:p-1'
  );

  return (
    <footer className="relative mt-auto">
      <div className="relative bg-black text-zinc-100">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-5 pt-5 text-center sm:px-8 sm:pb-6 sm:pt-6">
          <nav
            className="flex flex-row flex-wrap items-center justify-center gap-3 text-zinc-300 sm:gap-4"
            aria-label={p.footer.socialAria}
          >
            <a
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-1.5 transition-colors hover:bg-white/10 hover:text-white sm:p-2"
            >
              <Linkedin className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={1.5} aria-hidden />
              <span className="sr-only">LinkedIn</span>
            </a>

            {user ? (
              <div className={iconShellClass}>
                {footerFaviconSrc ? (
                  <img
                    src={footerFaviconSrc}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
                  />
                ) : null}
              </div>
            ) : (
              <Link
                to="/login"
                className={cn(iconShellClass, 'hover:border-zinc-500/95')}
                aria-label={p.ui.login}
                title={p.ui.login}
              >
                {footerFaviconSrc ? (
                  <img
                    src={footerFaviconSrc}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
                  />
                ) : null}
              </Link>
            )}

            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-1.5 transition-colors hover:bg-white/10 hover:text-white sm:p-2"
            >
              <Instagram className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={1.5} aria-hidden />
              <span className="sr-only">Instagram</span>
            </a>
          </nav>

          <div className="mt-2 w-full max-w-xl border-t border-zinc-800/90 pt-3 sm:mt-3 sm:pt-4">
            <p className="text-[0.66rem] uppercase tracking-[0.16em] text-zinc-400 sm:text-[0.72rem] sm:tracking-[0.18em]">
              © {year} {siteDomain} — {p.footer.rights}
            </p>
            <p className="mt-1.5 text-[0.9rem] leading-relaxed text-zinc-400 sm:mt-2 sm:text-sm">{p.footer.built}</p>
            <nav
              className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium"
              aria-label="Legal e privacidade"
            >
              <Link
                to="/privacidade"
                className="text-zinc-300 underline decoration-zinc-500/50 underline-offset-2 transition-colors hover:text-zinc-100"
              >
                Política de privacidade
              </Link>
              <button
                type="button"
                onClick={clearAnalyticsConsent}
                className="text-zinc-300 underline decoration-zinc-500/50 underline-offset-2 transition-colors hover:text-zinc-100"
              >
                Gerenciar cookies
              </button>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
