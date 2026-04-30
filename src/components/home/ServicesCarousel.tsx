import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import { OfferingCard } from '@/components/OfferingCard';
import { productField } from '@/lib/productDisplay';
import type { Product } from '@/types/product';
import { cn } from '@/lib/cn';

type ServicesCarouselProps = {
  products: Product[];
  cardFallback: string;
  ctaLabel: string;
  emptyMessage: React.ReactNode;
  onEmptyCta?: () => void;
  emptyCtaLabel?: string;
};

function sortByOrder(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.order - b.order);
}

export function ServicesCarousel({
  products,
  cardFallback,
  ctaLabel,
  emptyMessage,
  onEmptyCta,
  emptyCtaLabel,
}: ServicesCarouselProps) {
  const reduceMotion = useReducedMotion();
  const sorted = React.useMemo(() => sortByOrder(products), [products]);
  const loop = sorted.length > 0 ? [...sorted, ...sorted] : [];

  if (sorted.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-zinc-600/40 bg-zinc-900/35 px-6 py-10 text-center backdrop-blur-sm sm:px-10">
        <div className="text-sm leading-relaxed text-zinc-400">{emptyMessage}</div>
        {onEmptyCta && emptyCtaLabel ? (
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-500/50 bg-zinc-950/60 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-400/60 hover:bg-zinc-900/80"
            onClick={onEmptyCta}
          >
            {emptyCtaLabel}
          </button>
        ) : null}
      </div>
    );
  }

  const card = (p: Product, suffix: string) => (
    <div
      key={`${p.id}-${suffix}`}
      className="w-[min(61vw,13.2rem)] shrink-0 sm:w-[14.4rem] md:w-[15.2rem]"
    >
      <OfferingCard
        variant="teaser"
        coverSrc={p.imageUrl?.trim() || undefined}
        coverPosition={p.imagePosition}
        fallbackCoverSrc={cardFallback}
        title={productField(p, 'title')}
        tagline={productField(p, 'tagline')}
        detailHref={`/servicos/${encodeURIComponent(p.id)}`}
        ctaLabel={ctaLabel}
      />
    </div>
  );

  if (reduceMotion) {
    return (
      <div className="mt-10 -mx-4 flex gap-5 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
        {sorted.map((p) => card(p, 'static'))}
      </div>
    );
  }

  return (
    <div className="relative mt-10 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-[#1b1d27] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-[#1b1d27] to-transparent"
        aria-hidden
      />
      <div className={cn('flex w-max gap-5 sm:gap-6', 'lancurie-services-marquee')}>
        {loop.map((p, i) => card(p, `m-${i}`))}
      </div>
    </div>
  );
}
