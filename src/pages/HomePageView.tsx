import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from 'framer-motion';
import { Activity, ChevronDown, Scissors, Store } from 'lucide-react';
import { ServicesStack } from '@/components/home/ServicesStack';
import { fadeUpVariants, staggerContainerVariants, viewportOnce } from '@/components/home/homeMotion';
import type { SiteImageKey } from '@/data/siteImageConfig';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/cn';
import { resolveSiteImage } from '@/lib/siteImages';
import type { PublicPageText } from '@/types/sitePublicContent';
import type { Product } from '@/types/product';

const PROOF_ICONS = [Activity, Store, Scissors] as const;

export type HomePageViewProps = {
  /** Só usado no admin: pré-visualização sem alterar o contexto global. */
  publicTextOverride?: PublicPageText;
  /** URLs de imagem definidas no admin (sobrepor aos valores por defeito). */
  siteImageOverrides?: Partial<Record<SiteImageKey, string>> | null;
};

export function HomePageView({
  publicTextOverride,
  siteImageOverrides,
}: HomePageViewProps) {
  const SectionHeading = ({
    title,
    lead,
    eyebrow,
    className,
  }: {
    title: string;
    lead?: string;
    eyebrow?: string;
    className?: string;
  }) => (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-zinc-500">{eyebrow}</p>
      <h2 className="mt-3 text-balance font-display text-[1.95rem] font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-50 sm:text-[2.4rem] md:text-[2.85rem]">
        {title}
      </h2>
      <div
        className="mx-auto mt-4 h-px w-36 rounded-full bg-linear-to-r from-transparent via-zinc-200/65 to-transparent sm:w-44"
        aria-hidden
      />
      {/* Note: heading remains visually fixed; autoplay only affects approach element cards. */}
      {lead?.trim() ? (
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300/92 sm:mt-6 sm:text-base">
          {lead}
        </p>
      ) : null}
    </div>
  );

  const clampPercent = (value: unknown, fallback = 50) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, n));
  };
  type PaletteTone = 'cool' | 'warm';
  const { publicText: ctxP } = useI18n();
  const p = publicTextOverride ?? ctxP;
  const reduceMotion = useReducedMotion();
  const img = (key: SiteImageKey) => resolveSiteImage(key, siteImageOverrides);
  const cardFallback = img('cardFallback');
  const fadeUp = fadeUpVariants(reduceMotion);
  const staggerHero = staggerContainerVariants(reduceMotion, 0.11);
  const staggerApproach = staggerContainerVariants(reduceMotion, 0.16);
  const [approachIdx, setApproachIdx] = useState(0);
  const [approachPaused, setApproachPaused] = useState(false);
  const [approachHoverPaused, setApproachHoverPaused] = useState(false);
  const [approachTouchPaused, setApproachTouchPaused] = useState(false);
  const [approachDirection, setApproachDirection] = useState<1 | -1>(1);
  const [proofMobileActiveIdx, setProofMobileActiveIdx] = useState(0);
  const approachPauseTimeoutRef = useRef<number | null>(null);
  const approachHoverResumeTimeoutRef = useRef<number | null>(null);
  const approachTouchResumeTimeoutRef = useRef<number | null>(null);
  const proofMobileRailRef = useRef<HTMLDivElement | null>(null);
  const homeProducts = useMemo<Product[]>(
    () =>
      p.products
        .filter((prod) => prod.title.trim() || prod.tagline.trim() || prod.body.trim())
        .map((prod, i) => ({
          id: prod.id.trim() || `produto-${i + 1}`,
          titlePt: prod.title,
          titleEn: '',
          taglinePt: prod.tagline,
          taglineEn: '',
          bodyPt: prod.body,
          bodyEn: '',
          bulletsPt: prod.bullets,
          bulletsEn: '',
          order: i,
          published: true,
          imageUrl: prod.imageUrl,
          imagePosition: `${clampPercent(prod.focalX)}% ${clampPercent(prod.focalY)}%`,
        })),
    [p.products]
  );
  const approachItems = p.principles.items;
  const proofItems = p.proof.cards;
  const safeApproachIdx = approachItems.length > 0 ? approachIdx % approachItems.length : 0;
  const isTouchLike = () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
  const goNextApproach = () => {
    if (approachItems.length <= 1) return;
    setApproachDirection(1);
    setApproachIdx((i) => (i + 1) % approachItems.length);
  };
  const goPrevApproach = () => {
    if (approachItems.length <= 1) return;
    setApproachDirection(-1);
    setApproachIdx((i) => (i - 1 + approachItems.length) % approachItems.length);
  };
  const pauseApproachFor = (ms: number) => {
    setApproachPaused(true);
    if (approachPauseTimeoutRef.current != null) {
      window.clearTimeout(approachPauseTimeoutRef.current);
    }
    approachPauseTimeoutRef.current = window.setTimeout(() => {
      setApproachPaused(false);
      approachPauseTimeoutRef.current = null;
    }, ms);
  };
  const clearApproachHoverResumeTimeout = () => {
    if (approachHoverResumeTimeoutRef.current != null) {
      window.clearTimeout(approachHoverResumeTimeoutRef.current);
      approachHoverResumeTimeoutRef.current = null;
    }
  };
  const clearApproachTouchResumeTimeout = () => {
    if (approachTouchResumeTimeoutRef.current != null) {
      window.clearTimeout(approachTouchResumeTimeoutRef.current);
      approachTouchResumeTimeoutRef.current = null;
    }
  };
  useEffect(() => {
    if (reduceMotion || approachPaused || approachHoverPaused || approachTouchPaused || approachItems.length <= 1) return;
    const t = window.setInterval(() => {
      setApproachDirection(1);
      setApproachIdx((i) => (i + 1) % approachItems.length);
    }, 3000);
    return () => window.clearInterval(t);
  }, [approachHoverPaused, approachPaused, approachItems.length, approachTouchPaused, reduceMotion]);

  useEffect(() => {
    const root = proofMobileRailRef.current;
    if (!root || proofItems.length <= 1) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(':scope > article'));
    if (cards.length === 0) return;

    const pickBest = () => {
      let bestIdx = 0;
      let bestScore = -Infinity;
      const rootRect = root.getBoundingClientRect();
      const mid = rootRect.left + rootRect.width / 2;
      cards.forEach((el, idx) => {
        const r = el.getBoundingClientRect();
        const ratio =
          r.width > 0 && r.height > 0
            ? Math.max(
                0,
                (Math.min(r.right, rootRect.right) - Math.max(r.left, rootRect.left)) / r.width
              )
            : 0;
        const centerDist = Math.abs(r.left + r.width / 2 - mid);
        const score = ratio * 100 - centerDist / 10;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      });
      setProofMobileActiveIdx(bestIdx);
    };

    const io = new IntersectionObserver(
      () => {
        pickBest();
      },
      { root, threshold: [0.2, 0.35, 0.5, 0.65, 0.8] }
    );
    cards.forEach((c) => io.observe(c));
    root.addEventListener('scroll', pickBest, { passive: true });
    pickBest();

    return () => {
      io.disconnect();
      root.removeEventListener('scroll', pickBest);
    };
  }, [proofItems.length]);

  useEffect(() => {
    return () => {
      if (approachPauseTimeoutRef.current != null) {
        window.clearTimeout(approachPauseTimeoutRef.current);
      }
      clearApproachHoverResumeTimeout();
      clearApproachTouchResumeTimeout();
    };
  }, []);

  const onApproachDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (approachItems.length <= 1) return;
    if (Math.abs(info.offset.x) < 42) return;
    pauseApproachFor(5000);
    if (info.offset.x < 0) goNextApproach();
    else goPrevApproach();
  };
  const paletteTone = useMemo<PaletteTone>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qp = params.get('palette');
      if (qp === 'cool' || qp === 'warm') return qp;
    }
    const adminTone = p.ui?.paletteTone;
    return adminTone === 'cool' || adminTone === 'warm' ? adminTone : 'cool';
  }, [p.ui?.paletteTone]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-lancurie-palette', paletteTone);
  }, [paletteTone]);

  const scrollHint = (
    <a
      href="#approach"
      className="flex flex-col items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-zinc-200"
    >
      {p.hero.scrollHint}
      <ChevronDown className="h-4 w-4 text-zinc-600 motion-safe:animate-bounce" aria-hidden />
    </a>
  );

  return (
    <main className="relative flex-1">
      <section
        id="hero"
        className="relative flex min-h-[calc(100dvh-10rem-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden rounded-b-3xl bg-[#050505] sm:min-h-[calc(100dvh-9rem-env(safe-area-inset-bottom,0px))] sm:rounded-b-4xl"
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-b-3xl sm:rounded-b-4xl" aria-hidden>
          <img
            src="/brand/fundo_hero.png"
            alt=""
            width={1920}
            height={1080}
            className="h-full min-h-full w-full scale-[1.02] object-cover object-[72%_50%] md:object-[76%_48%]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(90deg,rgba(5,5,5,0.55)_0%,rgba(5,5,5,0.2)_42%,transparent_74%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(180deg,rgba(5,5,5,0.15)_0%,transparent_42%,transparent_58%,rgba(5,5,5,0.45)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-2 rounded-b-3xl sm:rounded-b-4xl shadow-[inset_0_0_min(140px,20vw)_rgba(0,0,0,0.5)] sm:shadow-[inset_0_0_min(200px,24vw)_rgba(0,0,0,0.42)]"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-4 pb-8 pt-12 max-[380px]:pt-10 max-sm:-translate-y-22 sm:translate-y-0 sm:px-6 sm:pb-14 sm:pt-20 md:px-10 md:pb-18 md:pt-24 lg:px-12 lg:pb-20 lg:pt-28">
          <div className="relative mx-auto w-full max-w-6xl">
            <motion.div
              className="relative z-1 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10"
              variants={staggerHero}
              initial="hidden"
              animate="visible"
            >
              {p.hero.kicker.trim() ? (
                <motion.p
                  variants={fadeUp}
                  className="mb-5 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:mb-6 lg:col-span-10 xl:col-span-9"
                >
                  {p.hero.kicker}
                </motion.p>
              ) : null}
              <motion.div variants={fadeUp} className="lg:col-span-10 xl:col-span-9">
                <h1 className="max-w-[min(100%,46rem)] font-hero text-[clamp(2.05rem,5.8vw,3.65rem)] font-semibold leading-[1.12] tracking-[-0.04em] text-zinc-50 md:max-w-[min(100%,52rem)] md:text-[clamp(2.2rem,5.2vw,3.95rem)]">
                  <span className="block text-balance">{p.hero.line1}</span>
                  <span className="mt-4 block max-w-160 text-pretty text-[clamp(1.05rem,2.35vw,1.65rem)] font-normal leading-relaxed tracking-[-0.02em] text-zinc-400 sm:mt-5 sm:leading-snug">
                    {p.hero.line2}
                  </span>
                </h1>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="relative z-10 flex shrink-0 justify-center pb-6 sm:pb-8"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.85, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {scrollHint}
        </motion.div>
      </section>

      {/* Vignette lateral só a partir de Processo (ecrãs largos); o hero fica fora deste wrapper */}
      <div className="relative">
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-0 hidden bg-[linear-gradient(90deg,rgba(0,0,0,0.42)_0%,transparent_17%),linear-gradient(270deg,rgba(0,0,0,0.42)_0%,transparent_17%)] lg:block',
            'xl:bg-[linear-gradient(90deg,rgba(0,0,0,0.52)_0%,transparent_23%),linear-gradient(270deg,rgba(0,0,0,0.52)_0%,transparent_23%)]',
            '2xl:bg-[linear-gradient(90deg,rgba(0,0,0,0.62)_0%,transparent_28%),linear-gradient(270deg,rgba(0,0,0,0.62)_0%,transparent_28%)]'
          )}
          aria-hidden
        />
      <section
        id="approach"
        className="lancurie-band-a relative z-1 scroll-mt-24 py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
          <SectionHeading
            title={p.principles.title}
            lead={p.principles.lead}
            eyebrow="Método Lancurie"
            className="mb-7 sm:mb-9"
          />
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <motion.div
              className="lg:col-span-4 lg:pt-1"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {approachItems.length > 1 ? (
                <div className="mt-7 hidden lg:flex lg:flex-col lg:gap-2.5">
                  {approachItems.map((item, i) => {
                    const active = i === safeApproachIdx;
                    return (
                        <button
                        key={`approach-nav-${i}`}
                        type="button"
                          onClick={() => {
                            pauseApproachFor(5000);
                            setApproachDirection(i >= safeApproachIdx ? 1 : -1);
                            setApproachIdx(i);
                          }}
                        className={cn(
                          'flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-300',
                          active
                            ? 'border-white/28 bg-white/[0.09] text-zinc-50'
                            : 'border-zinc-700/60 bg-zinc-900/25 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                        )}
                        aria-label={`Mostrar etapa ${i + 1}`}
                      >
                        <span
                          className={cn(
                            'font-display text-sm tabular-nums',
                            active ? 'text-zinc-200' : 'text-zinc-500'
                          )}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="line-clamp-2 text-[0.8rem] font-medium leading-snug">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </motion.div>
            <motion.div
              className="lg:col-span-8"
              variants={staggerApproach}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <motion.div variants={fadeUp} className="relative">
                <div
                  className="group relative min-h-44 overflow-hidden rounded-2xl bg-linear-to-b from-zinc-900/95 via-zinc-950 to-[#060607] p-4 shadow-[0_28px_68px_-28px_rgba(0,0,0,0.92)] ring-1 ring-inset ring-white/[0.06] sm:min-h-52 sm:p-5"
                  style={{ perspective: 1200 }}
                  onMouseEnter={() => {
                    clearApproachHoverResumeTimeout();
                    setApproachHoverPaused(true);
                  }}
                  onMouseLeave={() => {
                    clearApproachHoverResumeTimeout();
                    approachHoverResumeTimeoutRef.current = window.setTimeout(() => {
                      setApproachHoverPaused(false);
                      approachHoverResumeTimeoutRef.current = null;
                    }, 1000);
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType === 'touch') {
                      clearApproachTouchResumeTimeout();
                      setApproachTouchPaused(true);
                    }
                  }}
                  onPointerUp={(event) => {
                    if (event.pointerType === 'touch') {
                      clearApproachTouchResumeTimeout();
                      approachTouchResumeTimeoutRef.current = window.setTimeout(() => {
                        setApproachTouchPaused(false);
                        approachTouchResumeTimeoutRef.current = null;
                      }, 1000);
                    }
                  }}
                  onPointerCancel={(event) => {
                    if (event.pointerType === 'touch') {
                      clearApproachTouchResumeTimeout();
                      approachTouchResumeTimeoutRef.current = window.setTimeout(() => {
                        setApproachTouchPaused(false);
                        approachTouchResumeTimeoutRef.current = null;
                      }, 1000);
                    }
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === 'touch') {
                      clearApproachTouchResumeTimeout();
                      approachTouchResumeTimeoutRef.current = window.setTimeout(() => {
                        setApproachTouchPaused(false);
                        approachTouchResumeTimeoutRef.current = null;
                      }, 1000);
                    }
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-x-3 top-1.5 h-10 rounded-full bg-white/8 blur-xl"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(160deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_32%,rgba(0,0,0,0.38)_100%)]"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/[0.08] blur-3xl"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-white/[0.045] blur-3xl"
                    aria-hidden
                  />

                  <AnimatePresence mode="wait">
                    <motion.article
                      key={`approach-${safeApproachIdx}-${approachItems[safeApproachIdx]?.title ?? 'empty'}`}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: approachDirection > 0 ? 44 : -44, scale: 0.985 }}
                      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: approachDirection > 0 ? -44 : 44, scale: 0.985 }}
                      transition={{ duration: reduceMotion ? 0.25 : 0.56, ease: [0.22, 1, 0.36, 1] }}
                      className="relative origin-center"
                      drag={isTouchLike() && approachItems.length > 1 ? 'x' : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.14}
                      onDragEnd={(event, info) => {
                        onApproachDragEnd(event, info);
                      }}
                    >
                      <div className="flex items-baseline gap-2 sm:gap-2.5">
                        <span className="font-display text-xl font-medium tabular-nums text-zinc-500/85 sm:text-2xl">
                          {String(safeApproachIdx + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-display text-[1.9rem] font-semibold tracking-tight text-zinc-100 sm:text-[1.8rem]">
                          {approachItems[safeApproachIdx]?.title}
                        </h3>
                      </div>
                      <p className="mt-2 max-w-2xl text-justify text-[0.9rem] leading-relaxed text-zinc-300/88 sm:text-[0.94rem]">
                        {approachItems[safeApproachIdx]?.body}
                      </p>
                    </motion.article>
                  </AnimatePresence>
                </div>

                {approachItems.length > 1 ? (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center gap-2.5">
                      {approachItems.map((_, i) => (
                        <button
                          key={`approach-dot-${i}`}
                          type="button"
                          onClick={() => {
                            pauseApproachFor(5000);
                            setApproachDirection(i >= safeApproachIdx ? 1 : -1);
                            setApproachIdx(i);
                          }}
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            i === safeApproachIdx ? 'w-7 bg-zinc-200/90' : 'w-3 bg-zinc-600/75 hover:bg-zinc-500'
                          )}
                          aria-label={`Mostrar tópico ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        id="servicos"
        className="lancurie-band-b relative z-1 scroll-mt-24 py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
          <SectionHeading
            title={p.services.title}
            lead={p.services.lead}
            eyebrow="Portfólio de soluções"
            className="mb-8 sm:mb-10"
          />
          <ServicesStack
            products={homeProducts}
            cardFallback={cardFallback}
            ctaLabel={p.services.cta}
            accentTone={paletteTone}
            emptyMessage={<p className="text-sm leading-relaxed text-zinc-400">{p.services.empty}</p>}
            onEmptyCta={() => {
              if (typeof window === 'undefined') return;
              window.dispatchEvent(new CustomEvent('lancurie:open-chat'));
            }}
            emptyCtaLabel={p.hero.ctaPrimary}
          />
        </div>
      </section>

      <section
        id="prova"
        className="lancurie-band-c relative z-1 scroll-mt-20 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
          <SectionHeading
            title={p.proof.title}
            lead={p.proof.lead}
            eyebrow="Casos implementados"
            className="mb-8 sm:mb-10"
          />

          <div className="sm:hidden">
            <div
              ref={proofMobileRailRef}
              className="relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {proofItems.map((card, idx) => {
                const Icon = PROOF_ICONS[idx % PROOF_ICONS.length] ?? Activity;
                return (
                  <motion.article
                    key={`proof-mobile-${idx}-${card.title}`}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                    variants={fadeUp}
                    className={cn(
                      'group h-[16.6rem] w-[min(76vw,18rem)] shrink-0 snap-center rounded-2xl border border-zinc-500/38 bg-zinc-900/38 p-5 shadow-lg shadow-black/25 ring-1 ring-inset ring-white/5'
                    )}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">{card.badge}</span>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-500/45 bg-zinc-950/65 text-zinc-200">
                        <Icon className="h-5 w-5" strokeWidth={1.4} aria-hidden />
                      </div>
                    </div>
                    <h3 className="font-display text-lg font-medium tracking-tight text-zinc-100">{card.title}</h3>
                    <p className="mt-3 text-justify text-sm leading-relaxed text-zinc-300/90">{card.body}</p>
                  </motion.article>
                );
              })}
            </div>

            {proofItems.length > 1 ? (
              <div className="mt-4 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {proofItems.map((card, i) => (
                    <button
                      key={`proof-mobile-dot-${i}-${card.title}`}
                      type="button"
                      onClick={() => {
                        const rail = proofMobileRailRef.current;
                        const target = rail?.querySelectorAll<HTMLElement>(':scope > article')[i];
                        target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                      }}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === proofMobileActiveIdx ? 'w-7 bg-zinc-200/90' : 'w-3 bg-zinc-600/75'
                      )}
                      aria-label={`Mostrar projeto ${i + 1}`}
                      aria-current={i === proofMobileActiveIdx ? 'true' : undefined}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {p.proof.cards.map((card, i) => {
              const Icon = PROOF_ICONS[i] ?? Activity;
              return (
                <motion.article
                  key={`proof-${i}-${card.title}`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  variants={fadeUp}
                  className="group flex h-full w-[min(85vw,21rem)] shrink-0 flex-col rounded-2xl border border-zinc-500/38 bg-zinc-900/38 p-5 shadow-lg shadow-black/25 ring-1 ring-inset ring-white/5 transition-all duration-300 hover:border-white/22 hover:bg-zinc-900/62 sm:w-auto sm:p-6"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span
                      className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500"
                    >
                      {card.badge}
                    </span>
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-500/45 bg-zinc-950/65 text-zinc-200 transition-colors group-hover:border-white/28"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.4} aria-hidden />
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-medium tracking-tight text-zinc-100">{card.title}</h3>
                  <p className="mt-3 flex-1 text-justify text-pretty text-sm leading-relaxed text-zinc-300/90">{card.body}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      </div>
    </main>
  );
}
