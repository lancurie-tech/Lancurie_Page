import { useCallback, useRef, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_IMAGE_DEFAULTS } from '@/data/siteImageConfig';
import { cn } from '@/lib/cn';

type OfferingCardProps = {
  title: ReactNode;
  tagline: ReactNode;
  /** Conteúdo longo; omitir no carrossel da Home (só título + subtítulo). */
  body?: ReactNode;
  bullets?: ReactNode;
  /** `teaser`: sem sobreposição de texto na imagem; título e subtítulo sempre visíveis abaixo. */
  variant?: 'teaser' | 'full';
  coverSrc?: string;
  /** Quando não há `coverSrc`, imagem de marca por defeito (sobrescrita via admin). */
  fallbackCoverSrc?: string;
  /** Controla o recorte da imagem de capa (`object-position`, ex.: `60% 35%`). */
  coverPosition?: string;
  className?: string;
  /** Rota interna (ex. página de detalhe do serviço). */
  detailHref?: string;
  ctaLabel?: string;
  accentTone?: 'cool' | 'warm';
};

export function OfferingCard({
  title,
  tagline,
  body,
  bullets,
  variant = 'full',
  coverSrc,
  fallbackCoverSrc = SITE_IMAGE_DEFAULTS.cardFallback,
  coverPosition,
  className,
  detailHref,
  ctaLabel,
  accentTone = 'cool',
}: OfferingCardProps) {
  void accentTone;
  const cardRef = useRef<HTMLElement | null>(null);
  const teaserMode = variant === 'teaser';

  const setPointerVars = useCallback((clientX: number, clientY: number) => {
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    node.style.setProperty('--spot-x', `${x}px`);
    node.style.setProperty('--spot-y', `${y}px`);
  }, []);

  const resetPointerVars = useCallback(() => {
    const node = cardRef.current;
    if (!node) return;
    node.style.setProperty('--spot-x', '50%');
    node.style.setProperty('--spot-y', '50%');
  }, []);

  const ctaClassName =
    'mt-4 flex w-full items-center justify-center rounded-xl border border-zinc-500/45 bg-zinc-950/60 py-2 text-[0.78rem] font-semibold tracking-[0.01em] text-zinc-100 shadow-sm shadow-black/30 transition-all duration-300 hover:-translate-y-px hover:border-white/35 hover:bg-zinc-900/85';
  const teaserCtaClassName =
    'mt-auto inline-flex items-center gap-1 text-[0.74rem] font-semibold tracking-[0.01em] text-zinc-100/95 transition-colors duration-300 hover:text-zinc-50';
  const showOverlay = variant === 'full';
  const hasBody = body != null && body !== '';
  const hasBullets = bullets != null && bullets !== '';

  return (
    <article
      ref={cardRef}
      onPointerMove={teaserMode ? (e) => setPointerVars(e.clientX, e.clientY) : undefined}
      onPointerLeave={teaserMode ? resetPointerVars : undefined}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-zinc-600/35 bg-zinc-900/45 shadow-[0_20px_40px_-18px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/4 transition-[transform,box-shadow,border-color] duration-500 ease-out sm:rounded-[1.35rem]',
        'hover:-translate-y-1 hover:border-white/22 hover:shadow-[0_28px_50px_-16px_rgba(0,0,0,0.55)]',
        className
      )}
    >
      <div className={cn('relative w-full overflow-hidden bg-zinc-950', teaserMode ? 'aspect-2/3 sm:aspect-8/11' : 'aspect-16/10 sm:aspect-21/9')}>
        {coverSrc ? (
          <>
            <img
              src={coverSrc}
              alt=""
              style={coverPosition ? { objectPosition: coverPosition } : undefined}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]',
                teaserMode ? 'saturate-100 brightness-100 contrast-100' : 'group-hover:brightness-105'
              )}
              loading="lazy"
            />
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 z-1 h-[43%]',
                teaserMode
                  ? 'bg-linear-to-b from-[#02050b]/96 via-[#040912]/74 to-transparent'
                  : 'bg-linear-to-t from-black/65 via-zinc-950/10 to-zinc-900/5'
              )}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5"
              aria-hidden
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_0%,rgba(0,0,0,0.06),transparent_58%)] dark:bg-[radial-gradient(ellipse_85%_65%_at_50%_0%,rgba(255,255,255,0.04),transparent_58%)]" />
            {fallbackCoverSrc ? (
              <div className="absolute inset-0 flex items-center justify-center p-8 opacity-35 transition-opacity duration-300 group-hover:opacity-20 dark:opacity-40 dark:group-hover:opacity-25">
                <img
                  src={fallbackCoverSrc}
                  alt=""
                  className="max-h-full max-w-[min(100%,280px)] object-contain"
                />
              </div>
            ) : null}
          </>
        )}
        {showOverlay ? (
          <div className="absolute inset-0 z-1 flex flex-col items-center justify-center gap-2 bg-black/45 px-6 text-center opacity-0 backdrop-blur-[1px] transition-all duration-500 group-hover:opacity-100 group-hover:backdrop-blur-sm dark:bg-black/50">
            <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h3>
            <p className="text-sm font-medium text-zinc-200">{tagline}</p>
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          'relative',
          teaserMode
            ? 'absolute inset-0 z-2 flex flex-col p-3 sm:p-4'
            : 'border-t border-white/5 p-5 sm:p-7 md:p-8'
        )}
      >
        <div className={teaserMode ? 'mt-[9%] max-w-[86%] sm:mt-[8%]' : undefined}>
          <h3 className={cn('tracking-tight text-zinc-50', teaserMode ? 'font-display text-[1.78rem] font-semibold leading-[0.98] sm:text-[1.6rem]' : 'text-lg font-semibold')}>
            {title}
          </h3>
          {tagline ? (
            <p className={cn('mt-1.5 leading-relaxed text-zinc-300/95', teaserMode ? 'text-[0.84rem] font-normal sm:text-[0.9rem]' : 'text-sm font-medium')}>
              {tagline}
            </p>
          ) : null}
        </div>
        {hasBody ? (
          <div className="mt-3 text-sm leading-relaxed text-zinc-400 sm:mt-4">{body}</div>
        ) : null}
        {hasBullets ? (
          <div className="mt-4 border-t border-zinc-800/80 pt-4 text-xs leading-relaxed text-zinc-500">
            {bullets}
          </div>
        ) : null}
        {detailHref && ctaLabel ? (
          <Link
            to={detailHref}
            className={cn(
              teaserMode ? cn(teaserCtaClassName, 'self-end') : ctaClassName,
              !teaserMode && !hasBody && !hasBullets ? 'mt-6' : undefined
            )}
          >
            {ctaLabel}
            {teaserMode ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : null}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
