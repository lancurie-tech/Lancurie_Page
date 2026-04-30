import { Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { siteDomain } from '@/lib/site';
import { usePublicSiteSettings } from '@/contexts/usePublicSiteSettings';
import { useI18n } from '@/i18n/useI18n';
import { useSiteImageUrl } from '@/hooks/useSiteImage';
import { cn } from '@/lib/cn';

export function SiteFooter() {
  const { publicText: p } = useI18n();
  const { user } = useAuth();
  const { socialLinks } = usePublicSiteSettings();
  const footerFaviconSrc = useSiteImageUrl('footerFavicon');
  const wordmarkSrc = useSiteImageUrl('wordmark');
  const year = new Date().getFullYear();
  const iconShellClass = cn(
    'mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700/90',
    'bg-black p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors sm:h-18 sm:w-18 sm:p-1.5'
  );

  return (
    <footer className="relative mt-auto">
      <div className="relative bg-black text-zinc-100">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-10 pt-8 text-center sm:px-8 sm:pb-14 sm:pt-12">
          {user ? (
            <div className={iconShellClass}>
              {footerFaviconSrc ? (
                <img
                  src={footerFaviconSrc}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
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
                  className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
                />
              ) : null}
            </Link>
          )}

          {wordmarkSrc ? (
            <img
              src={wordmarkSrc}
              alt={p.brandName}
              className="mt-4 h-6 w-auto max-w-[min(100%,220px)] object-contain opacity-[0.96] sm:mt-5 sm:h-7 sm:max-w-[min(100%,260px)]"
            />
          ) : null}

          <nav
            className="mt-5 flex items-center justify-center gap-4 text-zinc-300 sm:mt-7 sm:gap-5"
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

          <div className="mt-9 w-full max-w-xl border-t border-zinc-800/90 pt-6 sm:mt-12 sm:pt-8">
            <p className="text-[0.66rem] uppercase tracking-[0.16em] text-zinc-400 sm:text-[0.72rem] sm:tracking-[0.18em]">
              © {year} {siteDomain} — {p.footer.rights}
            </p>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-zinc-400 sm:mt-3 sm:text-sm">{p.footer.built}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
