import * as React from 'react';
import { motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { Link } from 'react-router-dom';
import { OfferingCard } from '@/components/OfferingCard';
import { productField } from '@/lib/productDisplay';
import type { Product } from '@/types/product';
import { cn } from '@/lib/cn';

type ServicesStackProps = {
  products: Product[];
  cardFallback: string;
  ctaLabel: string;
  accentTone?: 'cool' | 'warm';
  emptyMessage: React.ReactNode;
  onEmptyCta?: () => void;
  emptyCtaLabel?: string;
};

function sortByOrder(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.order - b.order);
}

export function ServicesStack({
  products,
  cardFallback,
  ctaLabel,
  accentTone = 'cool',
  emptyMessage,
  onEmptyCta,
  emptyCtaLabel,
}: ServicesStackProps) {
  const reduceMotion = useReducedMotion();
  const sorted = React.useMemo(() => sortByOrder(products), [products]);
  const [active, setActive] = React.useState(0);
  const [manualPaused, setManualPaused] = React.useState(false);
  const [hoverPaused, setHoverPaused] = React.useState(false);
  const [touchPaused, setTouchPaused] = React.useState(false);
  const pauseTimeoutRef = React.useRef<number | null>(null);
  const hoverResumeTimeoutRef = React.useRef<number | null>(null);
  const touchResumeTimeoutRef = React.useRef<number | null>(null);
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );

  const total = sorted.length;

  const goNext = React.useCallback(() => {
    if (total <= 1) return;
    setActive((i) => (i + 1) % total);
  }, [total]);

  const goPrev = React.useCallback(() => {
    if (total <= 1) return;
    setActive((i) => (i - 1 + total) % total);
  }, [total]);

  const pauseAutoplayFor = React.useCallback((ms: number) => {
    setManualPaused(true);
    if (pauseTimeoutRef.current != null) {
      window.clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = window.setTimeout(() => {
      setManualPaused(false);
      pauseTimeoutRef.current = null;
    }, ms);
  }, []);
  const clearHoverResumeTimeout = React.useCallback(() => {
    if (hoverResumeTimeoutRef.current != null) {
      window.clearTimeout(hoverResumeTimeoutRef.current);
      hoverResumeTimeoutRef.current = null;
    }
  }, []);
  const clearTouchResumeTimeout = React.useCallback(() => {
    if (touchResumeTimeoutRef.current != null) {
      window.clearTimeout(touchResumeTimeoutRef.current);
      touchResumeTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (reduceMotion || manualPaused || hoverPaused || touchPaused || total <= 1) return;
    const t = window.setInterval(goNext, 2100);
    return () => window.clearInterval(t);
  }, [goNext, hoverPaused, manualPaused, reduceMotion, total, touchPaused]);

  React.useEffect(
    () => () => {
      if (pauseTimeoutRef.current != null) {
        window.clearTimeout(pauseTimeoutRef.current);
      }
      clearHoverResumeTimeout();
      clearTouchResumeTimeout();
    },
    [clearHoverResumeTimeout, clearTouchResumeTimeout]
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const onDragEnd = React.useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) < 48) return;
      pauseAutoplayFor(5000);
      if (info.offset.x < 0) goNext();
      else goPrev();
    },
    [goNext, goPrev, pauseAutoplayFor]
  );

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

  const prevIdx = (active - 1 + total) % total;
  const nextIdx = (active + 1) % total;
  const stackItems = total <= 1 ? [{ idx: active, pos: 0 as const }] : ([
    { idx: prevIdx, pos: -1 as const },
    { idx: active, pos: 0 as const },
    { idx: nextIdx, pos: 1 as const },
  ] as const);

  const cardNode = (p: Product, suffix: string) => (
    <OfferingCard
      key={`${p.id}-${suffix}`}
      variant="teaser"
      coverSrc={p.imageUrl?.trim() || undefined}
      coverPosition={p.imagePosition}
      fallbackCoverSrc={cardFallback}
      title={productField(p, 'title')}
      tagline={productField(p, 'tagline')}
      detailHref={`/servicos/${encodeURIComponent(p.id)}`}
      ctaLabel={ctaLabel}
      accentTone={accentTone}
      className="h-full"
    />
  );

  return (
    <div className="mt-10">
      <div
        className="relative mx-auto h-92 w-full max-w-296 overflow-x-hidden sm:h-108 md:h-116"
        onMouseEnter={() => {
          clearHoverResumeTimeout();
          setHoverPaused(true);
        }}
        onMouseLeave={() => {
          clearHoverResumeTimeout();
          hoverResumeTimeoutRef.current = window.setTimeout(() => {
            setHoverPaused(false);
            hoverResumeTimeoutRef.current = null;
          }, 1000);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') {
            clearTouchResumeTimeout();
            setTouchPaused(true);
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType === 'touch') {
            clearTouchResumeTimeout();
            touchResumeTimeoutRef.current = window.setTimeout(() => {
              setTouchPaused(false);
              touchResumeTimeoutRef.current = null;
            }, 1000);
          }
        }}
        onPointerCancel={(event) => {
          if (event.pointerType === 'touch') {
            clearTouchResumeTimeout();
            touchResumeTimeoutRef.current = window.setTimeout(() => {
              setTouchPaused(false);
              touchResumeTimeoutRef.current = null;
            }, 1000);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'touch') {
            clearTouchResumeTimeout();
            touchResumeTimeoutRef.current = window.setTimeout(() => {
              setTouchPaused(false);
              touchResumeTimeoutRef.current = null;
            }, 1000);
          }
        }}
      >
        {stackItems.map(({ idx, pos }) => {
          const isActive = pos === 0;
          return (
            <motion.div
              key={`stack-${sorted[idx]!.id}`}
              className={cn('absolute inset-y-0 left-1/2 w-full max-w-64 -translate-x-1/2 sm:max-w-80 md:max-w-88')}
              style={{ zIndex: isActive ? 20 : 10 }}
              drag={isActive && total > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.08}
              onDragEnd={isActive ? onDragEnd : undefined}
              initial={false}
              animate={
                reduceMotion
                  ? { opacity: isActive ? 1 : 0.45 }
                  : {
                      x: pos * (isMobile ? 130 : 335),
                      y: isActive ? 0 : isMobile ? 14 : 22,
                      scale: isActive ? 1 : isMobile ? 0.74 : 0.66,
                      opacity: isActive ? 1 : isMobile ? 0.42 : 0.98,
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : { type: 'spring', stiffness: 135, damping: 26, mass: 0.8 }
              }
            >
              {cardNode(sorted[idx]!, isActive ? 'active' : `side-${pos}`)}
            </motion.div>
          );
        })}
      </div>

      {total > 1 ? (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {sorted.map((item, i) => (
              <button
                key={`stack-dot-${item.id}-${i}`}
                type="button"
                onClick={() => {
                  pauseAutoplayFor(5000);
                  setActive(i);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === active
                    ? accentTone === 'warm'
                      ? 'w-7 bg-orange-300/90'
                      : 'w-7 bg-cyan-300/85'
                    : 'w-3 bg-zinc-600/75'
                )}
                aria-label={`Mostrar serviço ${i + 1}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <Link
          to="/servicos"
          className={cn(
            'group relative inline-flex items-center overflow-hidden rounded-xl border px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-all duration-300',
            'bg-linear-to-b from-[#101a31]/88 via-[#0d1529]/84 to-[#0a1223]/90 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-white/8',
            'hover:-translate-y-0.5 hover:shadow-[0_22px_42px_-20px_rgba(0,0,0,0.78)]',
            accentTone === 'warm'
              ? 'border-orange-300/26 hover:border-orange-300/45'
              : 'border-cyan-300/22 hover:border-cyan-300/42'
          )}
        >
          <span
            className={cn(
              'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
              accentTone === 'warm'
                ? 'bg-[radial-gradient(130%_95%_at_50%_0%,rgba(255,138,89,0.24),transparent_60%)]'
                : 'bg-[radial-gradient(130%_95%_at_50%_0%,rgba(56,189,248,0.22),transparent_60%)]'
            )}
            aria-hidden
          />
          <span className="relative">Conheça todos nossos serviços</span>
        </Link>
      </div>
    </div>
  );
}

