import { type ReactNode, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PrincipleItemContent } from '@/types/sitePublicContent';
import { cn } from '@/lib/cn';

/** Núcleo — monograma metálico (referência visual). */
const HUB_LOGO_SRC = '/brand/logo_2_favicon.png';

/** Lead do método quando `principles.lead` no CMS estiver vazio. */
const PROCESS_SECTION_LEAD_DEFAULT =
  'Um método contínuo e integrado que conecta estratégia, tecnologia e execução para gerar eficiência real e sustentável.';

/** Quebra tipo referência: "Processo de" / "atuação" quando o título coincide. */
function splitProcessHeading(title: string): { tail: string } | null {
  const t = title.trim();
  const m = /^processo\s+de\s+(.+)$/iu.exec(t);
  if (!m || !m[1]?.trim()) return null;
  return { tail: m[1].trim() };
}

export type ApproachMethodFlowProps = {
  eyebrow: string;
  title: string;
  lead: string;
  items: PrincipleItemContent[];
  reduceMotion: boolean;
};

const VB = { w: 680, h: 540, cx: 376, cy: 282, hubR: 42 };

/** Teto de escala em colunas muito largas (evita núcleo desproporcionado). */
const ORBIT_SCALE_MAX = 2.35;

/** `VB.cx` está ~36px à direita do centro do viewBox; em coluna empilhada corrige-se para centrar o diagrama. */
const ORBIT_HUB_PAN_X_STACKED = VB.w / 2 - VB.cx;

/** Largura máx. do copy empilhado: coluna mais estreita (melhor medida de leitura + respiro em relação ao núcleo). */
const STACKED_NODE_COPY_MAX = 'min(15.25rem, calc(100vw - 2.75rem))';

/** Abaixo disto, disco + texto à direita deixa o copy ilegível — empilha texto por baixo do disco (ResizeObserver). */
const ORBIT_SATELLITE_STACK_COPY_UNDER_PX = 600;

/** Com copy empilhado, o puxão ao núcleo (útil para copy lateral) junta demais os nós — atenuar. */
const ORBIT_STACKED_RADIAL_PULL_ATTENUATION = 0.26;

/** Espalha satélites a partir do núcleo só no empilhado (feixes SVG seguem os discos); >1 = mais afastados do núcleo. */
const ORBIT_STACKED_EXTRA_SPREAD = 1.056;

/** Altura extra (px) no palco empilhado: folga mínima para o copy abaixo do último disco (evitar overlap; sem “vazio” grande). */
const STACKED_ORBIT_STAGE_EXTRA_PX = 72;

/** Metade da altura do `SatelliteDisc` em mobile (`size-14` = 3.5rem) — ancoragem ao feixe com copy empilhado. */
const SATELLITE_DISC_HALF_REM_MOBILE = 1.75;

/**
 * Posições “de estúdio” no viewBox; em telas estreitas `interpolateDiscCenters` aproxima do núcleo.
 * Os feixes SVG terminam nos centros dos discos, não no texto.
 */
const NODE_DISC_CENTERS_BASE = [
  { bx: 106, by: 82 },
  { bx: 624, by: 294 },
  { bx: 178, by: 468 },
] as const;

type DiscCenter = { bx: number; by: number };

/** Puxa satélites radialmente para junto do núcleo: liberta margem para o copy à direita. */
function interpolateDiscCenters(
  bases: readonly { readonly bx: number; readonly by: number }[],
  pullT: number,
): DiscCenter[] {
  const t = Math.max(0, Math.min(1, pullT));
  return bases.map(({ bx, by }) => ({
    bx: VB.cx + (bx - VB.cx) * (1 - t),
    by: VB.cy + (by - VB.cy) * (1 - t),
  }));
}

/** Alonga o vetório hub→satélite (>1) para afastar nós; limita ao viewBox para não cortar feixes. */
function spreadDiscCentersFromHub(centers: readonly DiscCenter[], spread: number): DiscCenter[] {
  const s = Math.max(1, spread);
  const pad = 22;
  return centers.map(({ bx, by }) => {
    let nx = VB.cx + (bx - VB.cx) * s;
    let ny = VB.cy + (by - VB.cy) * s;
    nx = Math.min(VB.w - pad, Math.max(pad, nx));
    ny = Math.min(VB.h - pad, Math.max(pad, ny));
    return { bx: nx, by: ny };
  });
}

/**
 * Largura do contentor da órbita (px): acima de `wide` não puxa; em `narrow` chega a `maxPull`.
 * Curva linear — responde ao ResizeObserver (não só breakpoint).
 */
function orbitRadialPullT(containerWidthPx: number): number {
  const wide = 700;
  const narrow = 320;
  const maxPull = 0.56;
  if (containerWidthPx >= wide) return 0;
  if (containerWidthPx <= narrow) return maxPull;
  const u = (wide - containerWidthPx) / (wide - narrow);
  return maxPull * u;
}

/** Partículas fixas — campo estelar muito suave (sem JS pesado) */
const SKY_SPEC = Array.from({ length: 64 }, (_, i) => {
  const s = Math.sin(i * 2.17 + 0.4);
  const c = Math.cos(i * 1.83 - 1.2);
  let x = Math.min(VB.w - 10, Math.max(10, (0.5 + s * 0.495) * VB.w));
  let y = Math.min(VB.h - 10, Math.max(10, (0.5 + c * 0.475) * VB.h));
  if (Math.hypot(VB.cx - x, VB.cy - y) < 132) {
    x = Math.min(VB.w - 10, x + 118);
    y = Math.min(VB.h - 10, y + 48);
  }
  return {
    x,
    y,
    r: 0.32 + ((i * 17) % 6) * 0.21,
    o: 0.055 + ((i * 23) % 8) * 0.032,
  };
});

/**
 * Bézier quadrática entre extremos da corda — arco **para fora**, afastando o meio‑ponto do núcleo,
 * no sentido de traço sobre uma órbita (evita “curvar para dentro”).
 */
function quadLinkOutwardFromHub(
  hubX: number,
  hubY: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  bulgeStrength: number,
): string {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  let ox = -uy * len * bulgeStrength;
  let oy = ux * len * bulgeStrength;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const toHubX = hubX - mx;
  const toHubY = hubY - my;
  if (ox * toHubX + oy * toHubY > 0) {
    ox = -ox;
    oy = -oy;
  }
  const qx = mx + ox;
  const qy = my + oy;
  return `M ${ax.toFixed(2)} ${ay.toFixed(2)} Q ${qx.toFixed(2)} ${qy.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
}

function beamSpecs(centers: readonly DiscCenter[]) {
  const bulges = [0.166, 0.15, 0.16] as const;
  return centers.map(({ bx, by }, i) => {
    const dx = bx - VB.cx;
    const dy = by - VB.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const sx = VB.cx + ux * VB.hubR;
    const sy = VB.cy + uy * VB.hubR;
    /** Termina **no centro** do disco numerado (consistente em todos os satélites). */
    const ex = bx;
    const ey = by;
    return { d: quadLinkOutwardFromHub(VB.cx, VB.cy, sx, sy, ex, ey, bulges[i]!) };
  });
}

function secondaryWeavePath(ax: number, ay: number, bx: number, by: number): string {
  return quadLinkOutwardFromHub(VB.cx, VB.cy, ax, ay, bx, by, 0.178);
}

function secondaryWeaveSpecs(centers: readonly DiscCenter[]): string[] {
  const [a0, a1, a2] = centers;
  return [
    secondaryWeavePath(a0!.bx, a0!.by, a1!.bx, a1!.by),
    secondaryWeavePath(a1!.bx, a1!.by, a2!.bx, a2!.by),
    secondaryWeavePath(a2!.bx, a2!.by, a0!.bx, a0!.by),
  ];
}

/** Malha neural fraca entre nós — acende quando o ramo faz parte da etapa em foco */
function weaveEdgeTouches(edgeIdx: number, hoverIdx: number | null): boolean {
  if (hoverIdx === null) return false;
  const ends =
    edgeIdx === 0 ? ([0, 1] as const) : edgeIdx === 1 ? ([1, 2] as const) : ([2, 0] as const);
  return ends.some((x) => x === hoverIdx);
}

function SecondaryWeaveGraphic({
  paths,
  hoverIdx,
  reduceMotion,
  filterBlurId,
}: {
  paths: string[];
  hoverIdx: number | null;
  reduceMotion: boolean;
  filterBlurId: string;
}) {
  return (
    <g className="pointer-events-none" vectorEffect="non-scaling-stroke" aria-hidden>
      {paths.map((d, i) => (
        <g key={`weave-pack-${i}`}>
          <path
            d={d}
            fill="none"
            stroke="rgb(252 251 247 / 0.22)"
            strokeWidth={hoverIdx !== null ? (weaveEdgeTouches(i, hoverIdx) ? 2.2 : 1.05) : 1.35}
            strokeLinecap="round"
            opacity={hoverIdx === null ? 0.2 : weaveEdgeTouches(i, hoverIdx) ? 0.42 : 0.09}
            style={{ transition: 'opacity 0.55s ease, stroke-width 0.55s ease' }}
            filter={`url(#${filterBlurId})`}
          />
          <path
            d={d}
            fill="none"
            stroke="rgb(245 243 239 / 0.38)"
            strokeWidth={hoverIdx !== null ? (weaveEdgeTouches(i, hoverIdx) ? 0.48 : 0.22) : 0.38}
            strokeLinecap="round"
            opacity={hoverIdx === null ? 0.32 : weaveEdgeTouches(i, hoverIdx) ? 0.58 : 0.16}
            style={{ transition: 'opacity 0.55s ease, stroke-width 0.55s ease' }}
          />
          {!reduceMotion && hoverIdx !== null && weaveEdgeTouches(i, hoverIdx) ? (
            <path
              d={d}
              className="lancurie-orbit-weave-energy"
              fill="none"
              stroke="rgb(252 251 249 / 0.35)"
              strokeWidth={0.38}
              strokeLinecap="round"
              strokeDasharray="2 26"
              pathLength={100}
              opacity={0.9}
            />
          ) : null}
        </g>
      ))}
    </g>
  );
}

function OrbitRails() {
  return (
    <g className="pointer-events-none" aria-hidden>
      {/* Uma só elipse principal — menos “sanduíche” de curvas próximas do núcleo */}
      <ellipse
        transform={`rotate(-18 ${VB.cx} ${VB.cy})`}
        cx={VB.cx}
        cy={VB.cy}
        rx={288}
        ry={200}
        fill="none"
        stroke="rgb(255 255 255 / 0.082)"
        strokeWidth={0.5}
      />
      {/* Órbita secundária mais afastada, muito débil */}
      <ellipse
        transform={`rotate(-18 ${VB.cx} ${VB.cy})`}
        cx={VB.cx}
        cy={VB.cy}
        rx={318}
        ry={222}
        fill="none"
        stroke="rgb(255 255 255 / 0.048)"
        strokeWidth={0.42}
      />
      {/* Um anel circular longínquo — substitui o trio de circulos colados ao hub */}
      <circle
        cx={VB.cx}
        cy={VB.cy}
        r={VB.hubR + 128}
        fill="none"
        stroke="rgb(255 249 243 / 0.055)"
        strokeWidth={0.4}
      />
    </g>
  );
}

/** Micro-partículas em órbita lentíssima em torno do núcleo (SMIL — respeita reduceMotion pelo caller). */
function OrbitMicroParticles({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;
  return (
    <g
      className="pointer-events-none select-none opacity-[0.92]"
      aria-hidden
      transform={`translate(${VB.cx} ${VB.cy})`}
    >
      <g>
        <animateTransform
          attributeName="transform"
          additive="replace"
          type="rotate"
          from="0"
          to="360"
          dur="235s"
          repeatCount="indefinite"
        />
        <circle cx="128" cy="-18" r="0.74" fill="rgba(251,249,246,0.62)" />
        <circle cx="-114" cy="56" r="0.54" fill="rgba(246,243,239,0.44)" />
        <circle cx="20" cy="136" r="0.62" fill="rgba(252,251,248,0.5)" />
        <circle cx="-72" cy="-120" r="0.46" fill="rgba(246,246,243,0.4)" />
      </g>
      <g opacity={0.7}>
        <animateTransform
          attributeName="transform"
          additive="replace"
          type="rotate"
          from="360"
          to="0"
          dur="152s"
          repeatCount="indefinite"
        />
        <circle cx="156" cy="32" r="0.5" fill="rgba(251,251,247,0.46)" />
        <circle cx="-98" cy="-104" r="0.56" fill="rgba(246,246,243,0.4)" />
        <circle cx="-44" cy="146" r="0.42" fill="rgba(251,249,246,0.36)" />
      </g>
    </g>
  );
}

function BeamsGraphic({
  linesGradId,
  filterBlurId,
  active,
  reduceMotion,
  paths,
}: {
  linesGradId: string;
  filterBlurId: string;
  active: number | null;
  reduceMotion: boolean;
  paths: { d: string }[];
}) {
  const glow = (i: number) => (active === null ? 0.44 : active === i ? 0.92 : 0.22);
  const core = (i: number) => (active === null ? 0.54 : active === i ? 1 : 0.3);

  return (
    <g vectorEffect="non-scaling-stroke">
      {paths.map(({ d }, i) => (
        <path
          key={`beam-g-${i}`}
          d={d}
          fill="none"
          stroke="rgb(253 251 246 / 0.3)"
          strokeWidth={active === i ? 3.15 : 2.35}
          strokeLinecap="round"
          filter={`url(#${filterBlurId})`}
          style={{ opacity: glow(i), transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1)' }}
        />
      ))}
      {paths.map(({ d }, i) => (
        <path
          key={`beam-c-${i}`}
          d={d}
          fill="none"
          stroke={`url(#${linesGradId})`}
          strokeWidth={active === i ? 0.74 : 0.48}
          strokeLinecap="round"
          style={{
            opacity: core(i),
            transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), stroke-width 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      ))}
      {!reduceMotion &&
        paths.map(({ d }, i) =>
          active === i ? (
            <path
              key={`beam-e-${i}`}
              d={d}
              className="lancurie-orbit-beam-energy"
              fill="none"
              stroke="rgb(252 251 248 / 0.38)"
              strokeWidth={0.38}
              strokeLinecap="round"
              strokeDasharray="4 17"
              pathLength={100}
            />
          ) : null,
        )}
    </g>
  );
}

function padSteps(items: PrincipleItemContent[]): PrincipleItemContent[] {
  const steps = items.slice(0, 3);
  while (steps.length < 3) {
    const n = steps.length + 1;
    steps.push({ title: `Etapa ${n}`, body: '' });
  }
  return steps;
}

function SatelliteDisc({
  index,
  active,
}: {
  index: number;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        'relative isolate flex size-14 shrink-0 items-center justify-center rounded-full md:size-[3.95rem]',
        // Satélite “vidro” — highlight superior + bloom exterior (referência brilhosa)
        'border border-white/42 bg-[radial-gradient(circle_at_32%_22%,rgba(255,252,244,0.11),transparent_38%),radial-gradient(circle_at_50%_108%,rgba(255,251,239,0.065),transparent_44%),linear-gradient(168deg,rgb(12_13_16)_0%,rgb(5_6_8)_52%,rgb(2_3_4)_100%)]',
        'shadow-[inset_0_-4px_10px_rgb(0_0_0/0.94),inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_250_245/0.14),0_0_28px_-3px_rgb(255_251_243/0.38),0_0_52px_-14px_rgb(255_250_245/0.22)]',
        'filter-[drop-shadow(0_0_10px_rgb(255_251_247/0.24))]',
        'motion-safe:transition-[transform,box-shadow,border-color,color,filter] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-[conic-gradient(from_205deg,rgb(255_255_255/0)_0deg,rgb(255_251_239/0.11)_88deg,rgb(255_255_255/0)_188deg,rgb(255_255_255/0.07)_276deg,rgb(255_255_255/0)_360deg)] before:opacity-[0.58]',
        'after:pointer-events-none after:absolute after:inset-[-5px] after:rounded-full after:opacity-[0.5] after:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2),0_0_22px_rgb(255_250_247/0.12)]',
        active &&
          'scale-[1.05] border-white/65 shadow-[inset_0_-3px_8px_rgb(0_0_0/0.91),inset_0_0_0_1px_rgb(255_250_246/0.26),0_0_0_1px_rgb(255_255_255/0.22),0_0_38px_-1px_rgb(255_255_255/0.48),0_0_72px_-12px_rgb(255_250_246/0.28)] filter-[drop-shadow(0_0_16px_rgb(255_253_250/0.42))]',
      )}
      aria-hidden
    >
      <span
        className={cn(
          'relative z-1 font-display text-[0.88rem] font-medium tabular-nums tracking-tight md:text-[0.935rem]',
          active ? 'text-white' : 'text-zinc-300/95',
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
    </span>
  );
}

function StepTexts({
  baseId,
  row,
  isHot,
  comfortable,
}: {
  baseId: string;
  row: PrincipleItemContent;
  isHot: boolean;
  comfortable?: boolean;
}) {
  return (
    <>
      <span
        id={`${baseId}-tit`}
        className={cn(
          'block text-left font-display font-semibold leading-snug tracking-[-0.03em] text-zinc-100',
          comfortable
            ? 'text-[1.035rem] leading-snug md:text-[1.06rem]'
            : 'text-[0.905rem] md:text-[0.965rem]',
          'motion-safe:transition-colors motion-safe:duration-500',
          isHot && 'text-white',
        )}
      >
        {row.title}
      </span>
      {row.body.trim() ? (
        <span
          id={`${baseId}-body`}
          className={cn(
            'mt-1.5 block max-w-none text-pretty text-left font-extralight tracking-[-0.006em]',
            comfortable
              ? 'text-[0.9rem] leading-[1.58] md:text-[0.91rem]'
              : 'text-[0.675rem] leading-relaxed md:text-[0.705rem]',
            'motion-safe:transition-[color,text-shadow] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
            isHot
              ? 'text-zinc-200/95 [text-shadow:0_1px_32px_rgb(0_0_0/0.45)]'
              : 'text-zinc-500/90',
          )}
        >
          {row.body}
        </span>
      ) : null}
    </>
  );
}

/**
 * Satélite: disco na âncora; copy à direita ou à esquerda do disco (inlineMirror).
 * Empilhado: copy por baixo; stackedTightEnd desloca para a esquerda (nó à direita do diagrama).
 */
function OrbitSatelliteChrome({
  circle,
  copy,
  stacked,
  inlineMirror = false,
  stackedTightEnd = false,
}: {
  circle: ReactNode;
  copy: ReactNode;
  stacked: boolean;
  inlineMirror?: boolean;
  stackedTightEnd?: boolean;
}) {
  if (stacked) {
    return (
      <div
        className={cn(
          'relative flex w-full min-w-0 flex-col gap-3.5 py-0.5',
          stackedTightEnd ? 'items-start' : 'items-center',
        )}
        style={{
          maxWidth: stackedTightEnd ? 'min(17.5rem, calc(100vw - 1.35rem))' : STACKED_NODE_COPY_MAX,
        }}
      >
        <div className={cn('shrink-0', stackedTightEnd ? 'self-center' : undefined)}>{circle}</div>
        <div className="w-full min-w-0 text-left">{copy}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex w-max max-w-none flex-row items-center gap-2.5 py-0.5 md:gap-3.5',
        inlineMirror && 'flex-row-reverse',
        !inlineMirror && '-ml-7 md:-ml-[1.975rem]',
        'min-h-[4.05rem] md:min-h-[4.35rem]',
        'max-w-[min(100%,calc(100vw-1.25rem))] lg:max-w-none',
      )}
    >
      <span className="pointer-events-none relative z-2 shrink-0">{circle}</span>
      <div
        className={cn(
          // shrink-0 + largura mínima: evita colapso ~80px (abspos shrink-to-fit + min-w-0 no flex).
          'shrink-0 text-left',
          'min-w-54 sm:min-w-60 md:min-w-[16rem] lg:min-w-[20rem] xl:min-w-88',
          'max-w-[min(15.25rem,calc(100vw-10rem))] sm:max-w-[min(16.5rem,calc(100vw-10rem))] md:max-w-[min(17.5rem,calc(100vw-11rem))]',
          'lg:max-w-88 xl:max-w-96',
        )}
      >
        {copy}
      </div>
    </div>
  );
}

export function ApproachMethodFlow({
  eyebrow,
  title,
  lead,
  items,
  reduceMotion,
}: ApproachMethodFlowProps) {
  const headingId = useId();
  const uid = useId().replace(/:/g, '');
  const linesGradId = `orbit-grad-${uid}`;
  const filterBlurId = `orbit-soft-${uid}`;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const orbitMeasureRef = useRef<HTMLDivElement>(null);
  const [orbitScale, setOrbitScale] = useState(1);
  const [orbitWidthPx, setOrbitWidthPx] = useState(VB.w);

  const [orbitStackLayout, setOrbitStackLayout] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setOrbitStackLayout(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useLayoutEffect(() => {
    const el = orbitMeasureRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      setOrbitWidthPx((prev) => (Math.abs(prev - w) < 0.5 ? prev : w));
      const next = Math.min(ORBIT_SCALE_MAX, w / VB.w);
      setOrbitScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const steps = padSteps(items);
  const stackSatelliteCopy = orbitWidthPx < ORBIT_SATELLITE_STACK_COPY_UNDER_PX;
  const discCenters = useMemo(() => {
    const stacked = orbitWidthPx < ORBIT_SATELLITE_STACK_COPY_UNDER_PX;
    let t = orbitRadialPullT(orbitWidthPx);
    if (stacked) t *= ORBIT_STACKED_RADIAL_PULL_ATTENUATION;
    let centers = interpolateDiscCenters(NODE_DISC_CENTERS_BASE, t);
    if (stacked) centers = spreadDiscCentersFromHub(centers, ORBIT_STACKED_EXTRA_SPREAD);
    return centers;
  }, [orbitWidthPx]);
  const paths = useMemo(() => beamSpecs(discCenters), [discCenters]);
  const weavePaths = useMemo(() => secondaryWeaveSpecs(discCenters), [discCenters]);

  const processSplit = splitProcessHeading(title);
  const leadDisplayed = lead.trim() || PROCESS_SECTION_LEAD_DEFAULT;

  return (
    <div
      role="region"
      className="@container grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-10 lg:gap-y-14 xl:gap-x-14"
      aria-labelledby={headingId}
    >
      <div className="min-w-0 lg:col-span-5 lg:-translate-y-5 lg:justify-self-start xl:-translate-y-7">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.31em] text-zinc-500">
          {eyebrow}
        </p>
        <h2
          id={headingId}
          className="mt-5 max-w-[min(13.75rem,calc(100%-0.25rem))] text-pretty font-display text-[1.92rem] font-semibold leading-[1.04] tracking-[-0.034em] text-zinc-50 sm:mt-6 sm:max-w-59 sm:text-[2.2rem] sm:leading-[1.06] md:mt-7 md:max-w-63 md:text-[2.55rem]"
        >
          {processSplit ? (
            <>
              <span className="block">Processo de</span>
              <span className="block">{processSplit.tail}</span>
            </>
          ) : (
            title
          )}
        </h2>
        <div
          className="mt-6 h-px w-full max-w-[min(16.5rem,calc(100%-0.5rem))] bg-linear-to-r from-transparent via-zinc-400/42 to-transparent sm:mt-7 md:max-w-71"
          aria-hidden
        />
        <p className="mt-7 max-w-lg text-pretty text-[0.92rem] font-light leading-relaxed tracking-[-0.01em] text-zinc-300/93 sm:mt-7.5 sm:text-[0.98rem] md:mt-9">
          {leadDisplayed}
        </p>
      </div>

      <div className="relative min-h-0 min-w-0 max-lg:flex max-lg:justify-center lg:col-span-7 lg:justify-self-stretch">
        <div className="relative w-full origin-center">
        <div
          className={cn(
            'lancurie-orbit-panel relative isolate min-h-0 w-full min-w-0 overflow-x-visible bg-[#050505] px-1 pb-9 pt-[8%] sm:px-2 sm:pb-10 sm:pt-[9%] lg:max-h-none lg:min-h-[clamp(27.5rem,min(76cqw),38.5rem)] lg:pb-16',
            !stackSatelliteCopy && 'sm:min-h-120',
          )}
        >
          <div ref={orbitMeasureRef} className="relative mx-auto w-full min-w-0 max-w-full">
            <div
              className="relative mx-auto w-full min-w-0 overflow-x-visible overflow-y-visible"
              style={{
                height: VB.h * orbitScale + (stackSatelliteCopy ? STACKED_ORBIT_STAGE_EXTRA_PX : 0),
              }}
            >
              <div
                className="absolute left-0 top-0 will-change-transform"
                style={{
                  width: VB.w,
                  height: VB.h,
                  transform: `translate(${orbitStackLayout && !stackSatelliteCopy ? ORBIT_HUB_PAN_X_STACKED : 0}px, 0) scale(${orbitScale})`,
                  transformOrigin: 'top left',
                }}
              >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VB.w} ${VB.h}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id={`${uid}-atmos-vignette`} cx="52%" cy="42%" r="71%">
                <stop offset="0%" stopColor="rgba(255,251,245,0.125)" />
                <stop offset="38%" stopColor="rgba(16,17,21,0)" />
                <stop offset="100%" stopColor="rgba(2,3,6,0)" />
              </radialGradient>
              <linearGradient id={linesGradId} gradientUnits="userSpaceOnUse" x1={VB.cx - 242} y1={VB.cy} x2={VB.cx + 242} y2={VB.cy}>
                <stop offset="0%" stopColor="rgba(252,249,243,0.5)" />
                <stop offset="44%" stopColor="rgba(210,205,194,0.16)" />
                <stop offset="100%" stopColor="rgba(252,248,240,0.52)" />
              </linearGradient>
              <filter id={filterBlurId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.05" />
              </filter>
            </defs>

            <rect width={VB.w} height={VB.h} fill={`url(#${uid}-atmos-vignette)`} className="pointer-events-none opacity-[0.68]" />

            {/* Partículas / poeira de luz — campo profundo atrás das órbitas */}
            <g className="opacity-[0.97]">
              {SKY_SPEC.map((dot, idx) => (
                <circle
                  key={`p-${idx}`}
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.r}
                  fill="rgba(245,246,248,1)"
                  style={{ opacity: dot.o }}
                />
              ))}
            </g>

            <SecondaryWeaveGraphic paths={weavePaths} hoverIdx={hoverIdx} reduceMotion={reduceMotion} filterBlurId={filterBlurId} />
            <OrbitRails />
            <BeamsGraphic linesGradId={linesGradId} filterBlurId={filterBlurId} active={hoverIdx} reduceMotion={reduceMotion} paths={paths} />
            <OrbitMicroParticles reduceMotion={reduceMotion} />
          </svg>

          {/* Pontos luminosos ao longo dos feixes (aprox.: Bézier Q) */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VB.w} ${VB.h}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <g>
              {paths.map(({ d }, i) =>
                quadraticSamples(d, hoverIdx !== null ? (hoverIdx === i ? 0.96 : 0.2) : 0.64).map((pt, j) => (
                  <circle
                    key={`trail-${i}-${j}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoverIdx === i ? 1.95 : hoverIdx !== null ? 1 : 1.32}
                    fill="rgb(252 251 247)"
                    style={{ opacity: pt.o }}
                  />
                )),
              )}
            </g>
          </svg>

          {/* Núcleo — preto cheio */}
          <div
            className="pointer-events-none absolute z-20"
            style={{
              left: `${(VB.cx / VB.w) * 100}%`,
              top: `${(VB.cy / VB.h) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={cn(
                'relative isolate flex items-center justify-center',
                'motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
                hoverIdx !== null && 'motion-safe:scale-[1.018]',
              )}
              aria-hidden
            >
              {/* Halo suave atrás do núcleo — corona luminosa */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,252,248,0.16)_0%,rgba(255,248,242,0.05)_35%,transparent_68%)] blur-[1.5px] h-54 w-54 md:h-60 md:w-60"
                aria-hidden
              />
              {/* Anéis muito sutis ao redor do poço */}
              <div
                className={cn(
                  'pointer-events-none absolute left-1/2 top-1/2 aspect-square w-47 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/9',
                  'opacity-[0.48] md:w-52.5',
                )}
              />
              <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[9.65rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/11 opacity-[0.36] md:w-44" />

              {/* Poço único — preto sólido, bordo nítido (referência) */}
              <div
                className={cn(
                  'relative z-3 flex size-24 items-center justify-center rounded-full md:size-[6.85rem]',
                  'bg-black border border-[rgb(248_245_239)]/96 shadow-[0_0_28px_-4px_rgb(255_252_248/0.35),0_0_0_1px_rgb(255_255_255/0.12)]',
                  'motion-safe:transition-colors motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
                  hoverIdx !== null && 'border-white',
                )}
              >
                <img
                  src={HUB_LOGO_SRC}
                  alt=""
                  draggable={false}
                  className={cn(
                    'relative z-1 h-[56%] w-[56%] object-contain',
                    'filter-[drop-shadow(0_0_22px_rgba(255_251_239/0.3))]',
                  )}
                />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 z-8">
            {discCenters.map(({ bx, by }, i) => {
              const row = steps[i];
              const baseId = `approach-orbit-${uid}-${i}`;
              const isHot = hoverIdx === i;
              /** Satélite à direita do núcleo: copy à esquerda do disco (mais largura útil). */
              const inlineMirror = !stackSatelliteCopy && bx > VB.cx;
              /** Nó 02 empilhado: deslocar caixa para a esquerda e alargar (proporção como nós 1 e 3). */
              const stackedTightEnd = stackSatelliteCopy && i === 1;

              const satelliteTransform = stackSatelliteCopy
                ? stackedTightEnd
                  ? 'translateX(calc(-50% - 1.875rem))'
                  : 'translateX(-50%)'
                : inlineMirror
                  ? 'translateY(-50%) translateX(calc(-100% + 1.975rem))'
                  : 'translateY(-50%)';

              return (
                <div
                  key={baseId}
                  className="pointer-events-none absolute w-max max-w-none"
                  style={{
                    left: `${(bx / VB.w) * 100}%`,
                    top: stackSatelliteCopy
                      ? `calc(${(by / VB.h) * 100}% - ${SATELLITE_DISC_HALF_REM_MOBILE}rem)`
                      : `${(by / VB.h) * 100}%`,
                    transform: satelliteTransform,
                  }}
                >
                  <div className="pointer-events-auto w-max max-w-none">
                    <button
                      type="button"
                      id={`${baseId}-btn`}
                      onMouseEnter={() => setHoverIdx(i)}
                      onMouseLeave={() => setHoverIdx(null)}
                      onFocus={() => setHoverIdx(i)}
                      onBlur={() => setHoverIdx(null)}
                      className={cn(
                        'w-max rounded-[1.125rem] transition-[opacity,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        stackSatelliteCopy ? 'p-2.5 md:p-4' : 'p-3 md:p-4',
                        'bg-transparent hover:bg-transparent',
                        'focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent focus-visible:outline-none focus-visible:ring-white/55',
                      )}
                      style={{
                        opacity: hoverIdx !== null ? (hoverIdx === i ? 1 : 0.56) : 1,
                      }}
                      aria-labelledby={`${baseId}-tit`}
                      aria-describedby={row.body.trim() ? `${baseId}-body` : undefined}
                    >
                      <OrbitSatelliteChrome
                        stacked={stackSatelliteCopy}
                        inlineMirror={inlineMirror}
                        stackedTightEnd={stackedTightEnd}
                        circle={<SatelliteDisc index={i} active={isHot} />}
                        copy={<StepTexts baseId={baseId} row={row} isHot={isHot} comfortable={stackSatelliteCopy} />}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

    </div>
  );
}

/** Amostragem rudimentar de Bézier quadrática `M sx sy Q cx cy ex ey` para pontos luminosos. */
function quadraticSamples(pathD: string, opacityScale: number): { x: number; y: number; o: number }[] {
  const m = /^M\s+([\d.-]+)\s+([\d.-]+)\s+Q\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)$/i.exec(
    pathD.replace(/\s+/g, ' ').trim(),
  );
  if (!m || m.length < 7) return [];
  const sx = Number(m[1]);
  const sy = Number(m[2]);
  const qx = Number(m[3]);
  const qy = Number(m[4]);
  const ex = Number(m[5]);
  const ey = Number(m[6]);
  const pts: { x: number; y: number; o: number }[] = [];
  for (let t = 0.26; t < 1; t += 0.18) {
    const u = 1 - t;
    const x = u * u * sx + 2 * u * t * qx + t * t * ex;
    const y = u * u * sy + 2 * u * t * qy + t * t * ey;
    const base = t < 0.45 ? 0.16 + t * 0.24 : t > 0.78 ? 0.09 : 0.2;
    pts.push({ x, y, o: opacityScale * base });
  }
  return pts;
}
