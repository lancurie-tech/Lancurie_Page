import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from 'framer-motion';
import { Activity, ChevronDown, Scissors, Store } from 'lucide-react';
import { ServicesStack } from '@/components/home/ServicesStack';
import { fadeUpVariants, staggerContainerVariants, viewportOnce } from '@/components/home/homeMotion';
import { NeuralNoise } from '@/components/ui/neural-noise';
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
      <p
        className={cn(
          'text-[0.64rem] font-semibold uppercase tracking-[0.24em]',
          isWarm ? 'text-orange-100/65' : 'text-cyan-100/60'
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          'mt-3 text-balance font-display text-[1.95rem] font-normal leading-[1.05] tracking-[-0.01em] text-transparent sm:text-[2.4rem] md:text-[2.8rem]',
          'bg-linear-to-br bg-clip-text drop-shadow-[0_2px_14px_rgba(120,165,255,0.26)]',
          isWarm ? 'from-zinc-50 via-orange-100 to-amber-200/95' : 'from-zinc-50 via-cyan-100 to-indigo-200/95'
        )}
      >
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
  const [isMobileViewport, setIsMobileViewport] = useState(false);
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
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobileViewport(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

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

  const isWarm = paletteTone === 'warm';
  const useLightHeroEffects = reduceMotion || isMobileViewport;

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
        className="relative flex min-h-[calc(100dvh-10rem-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden rounded-b-3xl sm:min-h-[calc(100dvh-9rem-env(safe-area-inset-bottom,0px))] sm:rounded-b-4xl"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#0d1422_0%,#060b14_18%,#0e1630_32%,#17233d_100%)]"
          aria-hidden
        />
        {!useLightHeroEffects ? (
          <div
            className="pointer-events-none absolute inset-0 z-0 min-h-full w-full overflow-hidden"
            aria-hidden
          >
            <NeuralNoise
              className="min-h-full mix-blend-screen"
              color={isWarm ? [0.96, 0.38, 0.24] : [0.17, 0.62, 0.92]}
              opacity={0.64}
              speed={0.0032}
            />
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-linear-to-b from-[#04070f]/58 via-[#060b16]/18 to-[#060b14]/70"
          aria-hidden
        />
        <div
          className={cn(
            'lancurie-hero-aurora pointer-events-none absolute inset-0 z-2',
            useLightHeroEffects && 'opacity-75'
          )}
          aria-hidden
        />
        <div
          className={cn(
            'lancurie-hero-mesh pointer-events-none absolute inset-0 z-2 opacity-[0.38]',
            useLightHeroEffects && 'opacity-[0.22]'
          )}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute -left-24 top-0 z-2 h-[min(42rem,85vw)] w-[min(42rem,85vw)] rounded-full bg-zinc-300/10 blur-[100px]"
          aria-hidden
          animate={
            useLightHeroEffects
              ? undefined
              : { y: [0, -28, 0], x: [0, 12, 0], scale: [1, 1.06, 1], opacity: [0.75, 0.95, 0.75] }
          }
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -right-20 bottom-0 z-2 h-[min(36rem,75vw)] w-[min(36rem,75vw)] rounded-full bg-slate-500/10 blur-[90px]"
          aria-hidden
          animate={
            useLightHeroEffects
              ? undefined
              : { y: [0, 22, 0], x: [0, -16, 0], scale: [1, 1.05, 1], opacity: [0.65, 0.88, 0.65] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
        <motion.div
          className={cn(
            'pointer-events-none absolute left-1/2 top-1/4 z-2 h-[min(28rem,60vw)] w-[min(28rem,60vw)] -translate-x-1/2 rounded-full blur-[88px]',
            isWarm ? 'bg-orange-400/20' : 'bg-cyan-300/15'
          )}
          aria-hidden
          animate={
            useLightHeroEffects
              ? undefined
              : { y: [0, 18, 0], scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }
          }
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <div
          className="pointer-events-none absolute left-[18%] top-[55%] z-2 h-[min(22rem,50vw)] w-[min(22rem,50vw)] rounded-full bg-zinc-600/12 blur-[72px]"
          aria-hidden
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-2',
            isWarm
              ? 'bg-[radial-gradient(ellipse_95%_58%_at_50%_0%,rgba(255,124,69,0.2),transparent_56%)]'
              : 'bg-[radial-gradient(ellipse_95%_58%_at_50%_0%,rgba(92,175,255,0.16),transparent_56%)]'
          )}
          aria-hidden
        />
        <div
          className={cn(
            'lancurie-hero-dots pointer-events-none absolute inset-0 z-2 opacity-50',
            useLightHeroEffects && 'opacity-30'
          )}
          aria-hidden
        />
        <div className="lancurie-grain pointer-events-none absolute inset-0 z-2" aria-hidden />
        {!useLightHeroEffects ? (
          <div className="pointer-events-none absolute inset-0 z-2 overflow-hidden" aria-hidden>
            <motion.div
              className="absolute -left-1/3 top-0 h-full w-[55%] bg-linear-to-r from-transparent via-white/5.5 to-transparent opacity-0"
              style={{ skewX: -18 }}
              initial={{ x: '-20%', opacity: 0 }}
              animate={{ x: ['-20%', '120%'], opacity: [0, 0.9, 0] }}
              transition={{ duration: 2.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        ) : null}

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-4 pb-8 pt-12 max-[380px]:pt-10 sm:px-6 sm:pb-14 sm:pt-20 md:px-10 md:pb-18 md:pt-24 lg:px-12 lg:pb-20 lg:pt-28">
          <div className="mx-auto w-full max-w-6xl">
            <motion.div
              className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10"
              variants={staggerHero}
              initial="hidden"
              animate="visible"
            >
              <motion.h1
                variants={fadeUp}
                className="max-w-[min(100%,46rem)] text-balance font-display text-[clamp(2.05rem,6.2vw,3.85rem)] font-normal leading-[1.14] tracking-[-0.035em] md:max-w-208 md:text-[clamp(2.35rem,6.5vw,4.15rem)] lg:col-span-10 xl:col-span-9"
              >
                <span
                  className={cn(
                    'block pb-[0.08em] bg-linear-to-br bg-clip-text text-transparent drop-shadow-sm',
                    isWarm ? 'from-white via-orange-100 to-amber-200/90' : 'from-white via-cyan-100 to-indigo-200/90'
                  )}
                >
                  {p.hero.line1}
                </span>
                <span className="mt-4 block max-w-160 text-pretty font-display text-[clamp(1.08rem,2.4vw,1.7rem)] font-normal leading-relaxed tracking-[-0.018em] text-zinc-200/92 sm:mt-5 sm:leading-snug sm:text-[clamp(1.2rem,2.25vw,1.8rem)]">
                  {p.hero.line2}
                </span>
              </motion.h1>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="relative z-10 flex shrink-0 justify-center pb-6 sm:pb-8"
          initial={{ opacity: 0, y: useLightHeroEffects ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: useLightHeroEffects ? 0 : 0.85, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {scrollHint}
        </motion.div>
      </section>

      {/* Vignette lateral só a partir de Processo (ecrãs largos); o hero fica fora deste wrapper */}
      <div className="relative">
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-0 hidden bg-[linear-gradient(90deg,rgba(2,6,12,0.38)_0%,transparent_17%),linear-gradient(270deg,rgba(2,6,12,0.38)_0%,transparent_17%)] lg:block',
            'xl:bg-[linear-gradient(90deg,rgba(2,6,12,0.5)_0%,transparent_23%),linear-gradient(270deg,rgba(2,6,12,0.5)_0%,transparent_23%)]',
            '2xl:bg-[linear-gradient(90deg,rgba(2,6,12,0.6)_0%,transparent_28%),linear-gradient(270deg,rgba(2,6,12,0.6)_0%,transparent_28%)]'
          )}
          aria-hidden
        />
      <section
        id="approach"
        className="relative z-1 scroll-mt-24 bg-[linear-gradient(180deg,#17233d_0%,#101728_16%,#131d32_56%,#131c2f_100%)] py-12 sm:py-16 lg:py-20"
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
                            ? isWarm
                              ? 'border-orange-300/60 bg-orange-500/16 text-zinc-100'
                              : 'border-cyan-300/55 bg-cyan-400/16 text-zinc-100'
                            : 'border-zinc-700/60 bg-zinc-900/25 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                        )}
                        aria-label={`Mostrar etapa ${i + 1}`}
                      >
                        <span
                          className={cn(
                            'font-display text-sm tabular-nums',
                            active ? (isWarm ? 'text-orange-100' : 'text-cyan-100') : 'text-zinc-500'
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
                  className="group relative min-h-44 overflow-hidden rounded-2xl bg-linear-to-b from-[#121b2f] via-[#10182a] to-[#0c1322] p-4 shadow-[0_30px_74px_-30px_rgba(2,6,15,0.95),0_16px_34px_-22px_rgba(96,146,255,0.45)] sm:min-h-52 sm:p-5"
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
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.01)_30%,rgba(7,17,35,0.24)_100%)]"
                    aria-hidden
                  />
                  <div
                    className={cn(
                      'pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full blur-3xl',
                      isWarm ? 'bg-orange-400/24' : 'bg-cyan-300/20'
                    )}
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-blue-400/10 blur-3xl"
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
                        <span className="font-display text-xl font-light tabular-nums text-zinc-500/80 sm:text-2xl">
                          {String(safeApproachIdx + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-display text-[1.9rem] font-normal tracking-tight text-zinc-100 sm:text-[1.8rem]">
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
                            i === safeApproachIdx
                              ? isWarm
                                ? 'w-7 bg-orange-300/95'
                                : 'w-7 bg-cyan-300/95'
                              : 'w-3 bg-zinc-600/75 hover:bg-zinc-500'
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
        className="relative z-1 scroll-mt-24 bg-[linear-gradient(180deg,#131c2f_0%,#0f1629_18%,#111a2d_54%,#121c30_100%)] py-12 sm:py-16 lg:py-20"
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
        className="relative z-1 scroll-mt-20 bg-[linear-gradient(180deg,#121c30_0%,#0f1728_28%,#0d1424_62%,#0d1321_100%)] py-12 sm:py-16"
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
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-500/45 bg-zinc-950/65 transition-colors',
                          isWarm ? 'text-orange-100/90' : 'text-cyan-100/85'
                        )}
                      >
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
                        i === proofMobileActiveIdx
                          ? isWarm
                            ? 'w-7 bg-orange-300/90'
                            : 'w-7 bg-cyan-300/85'
                          : 'w-3 bg-zinc-600/75'
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
                  className={cn(
                    'group flex h-full w-[min(85vw,21rem)] shrink-0 flex-col rounded-2xl border border-zinc-500/38 bg-zinc-900/38 p-5 shadow-lg shadow-black/25 ring-1 ring-inset ring-white/5 transition-all duration-300 hover:bg-zinc-900/62 sm:w-auto sm:p-6',
                    isWarm ? 'hover:border-orange-400/34' : 'hover:border-cyan-400/32'
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span
                      className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500"
                    >
                      {card.badge}
                    </span>
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-500/45 bg-zinc-950/65 transition-colors',
                        isWarm
                          ? 'text-orange-100/90 group-hover:border-orange-400/38'
                          : 'text-cyan-100/85 group-hover:border-cyan-400/38'
                      )}
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
