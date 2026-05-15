import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ChevronDown, Scissors, Store } from 'lucide-react';
import { ApproachMethodFlow } from '@/components/home/ApproachMethodFlow';
import { ServicesCurvedDividers } from '@/components/home/ServicesCurvedDividers';
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
    tone = 'dark',
  }: {
    title: string;
    lead?: string;
    eyebrow?: string;
    className?: string;
    /** `light` = fundo claro (texto escuro). */
    tone?: 'dark' | 'light';
  }) => (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      <p
        className={cn(
          'text-[0.64rem] font-semibold uppercase tracking-[0.26em]',
          tone === 'light' ? 'text-zinc-600' : 'text-zinc-500'
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          'mt-3 text-balance font-display text-[1.95rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[2.4rem] md:text-[2.85rem]',
          tone === 'light' ? 'text-zinc-950' : 'text-zinc-50'
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          'mx-auto mt-4 h-px w-36 rounded-full bg-linear-to-r from-transparent to-transparent sm:w-44',
          tone === 'light' ? 'via-zinc-400/55' : 'via-zinc-200/65'
        )}
        aria-hidden
      />
      {lead?.trim() ? (
        <p
          className={cn(
            'mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed sm:mt-6 sm:text-base',
            tone === 'light' ? 'text-zinc-700' : 'text-zinc-300/92'
          )}
        >
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
  const [proofMobileActiveIdx, setProofMobileActiveIdx] = useState(0);
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

  const scrollHintLabel = p.hero.scrollHint.trim() || 'Explorar';

  const scrollHint = (
    <a
      href="#approach"
      className="flex flex-col items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-zinc-200"
    >
      {scrollHintLabel}
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
        className="relative z-10 scroll-mt-24 bg-[#050505] py-12 sm:py-16 lg:py-20"
      >
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:pl-6 lg:pr-14 xl:pl-8 xl:pr-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <ApproachMethodFlow
              eyebrow="Método Lancurie"
              title={p.principles.title}
              lead={p.principles.lead}
              items={approachItems}
              reduceMotion={!!reduceMotion}
            />
          </motion.div>
        </div>
      </section>

      <section
        id="servicos"
        className="lancurie-home-services-surface relative z-10 scroll-mt-24 py-12 sm:py-16 lg:py-20"
      >
        <ServicesCurvedDividers />
        <div className="relative z-2 mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
          <SectionHeading
            title={p.services.title}
            lead={p.services.lead}
            eyebrow="Portfólio de soluções"
            className="mb-8 sm:mb-10"
            tone="light"
          />
          <ServicesStack
            products={homeProducts}
            cardFallback={cardFallback}
            ctaLabel={p.services.cta}
            accentTone={paletteTone}
            surface="light"
            emptyMessage={<p className="text-sm leading-relaxed text-zinc-600">{p.services.empty}</p>}
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
        className="relative z-10 scroll-mt-20 bg-[#050505] py-12 sm:py-16"
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
