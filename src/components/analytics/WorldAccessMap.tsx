import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import createGlobe, { type Globe } from 'cobe';

type GeoPoint = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

type WorldAccessMapProps = {
  points: GeoPoint[];
  totalVisits: number;
};

type GlobeMarker = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  label: string;
  size: number;
};

type ProjectedMarker = {
  id: string;
  x: number;
  y: number;
  sizePx: number;
  count: number;
  label: string;
};

type HoveredMarkerMeta = { id: string; label: string; count: number };

/** Tamanhos para o cobe ficam ~3x menores que antes (globo mais limpo). */
function markerSize(count: number, max: number): number {
  if (max <= 1) return 0.028;
  const t = Math.max(0, Math.min(1, count / max));
  return 0.022 + t * 0.038;
}

/** Igual ao `U()` interno do cobe: lat/lon em graus → vetor na esfera normalizada. */
function latLonToCobeUnit(latDeg: number, lonDeg: number): [number, number, number] {
  const latRad = (latDeg * Math.PI) / 180;
  const lonAdj = (lonDeg * Math.PI) / 180 - Math.PI;
  const cl = Math.cos(latRad);
  return [-cl * Math.cos(lonAdj), Math.sin(latRad), cl * Math.sin(lonAdj)];
}

const COBE_BASE_RADIUS = 0.8;
const COBE_MARKER_ELEVATION = 0.05;

/** Mesma rotação que o vertex shader dos marcadores do cobe (componentes `l.xy` e `l.z`). */
function markerRotatedPlane(
  marker: GlobeMarker,
  phi: number,
  theta: number
): { c: number; s: number; nz: number } {
  const base = latLonToCobeUnit(marker.latitude, marker.longitude);
  const rScale = COBE_BASE_RADIUS + COBE_MARKER_ELEVATION;
  const tx = base[0] * rScale;
  const ty = base[1] * rScale;
  const tz = base[2] * rScale;

  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);

  const c = cp * tx + sp * tz;
  const s = st * sp * tx + ct * ty - cp * st * tz;
  const nz = -sp * ct * tx + st * ty + cp * ct * tz;
  return { c, s, nz };
}

/**
 * Overlay: só projeta com `nz ≥ 0` (face voltada à câmera), alinhado ao vertex shader do cobe.
 */

function projectMarkerOverlay(
  marker: GlobeMarker,
  phi: number,
  theta: number,
  canvas: HTMLCanvasElement,
  scaleB: number,
  devicePixelRatioOption: number
): ProjectedMarker | null {
  const bw = canvas.width;
  const bh = canvas.height;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  if (bw < 16 || bh < 16 || cw < 8 || ch < 8) return null;

  const { c, s, nz } = markerRotatedPlane(marker, phi, theta);
  if (nz < 0) return null;

  const B = scaleB;
  const T0 = 0;
  const T1 = 0;
  const n = devicePixelRatioOption;

  const xNorm = (c / (bw / bh) * B + (T0 * B * n) / bw + 1) / 2;
  const yNorm = (-s * B + (T1 * B * n) / bh + 1) / 2;

  return {
    id: marker.id,
    x: xNorm * cw,
    y: yNorm * ch,
    sizePx: Math.max(10, 6 + marker.size * 95),
    label: marker.label,
    count: marker.count,
  };
}

export function WorldAccessMap({ points, totalVisits }: WorldAccessMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeRef = useRef<Globe | null>(null);
  const globeDprRef = useRef(1);
  const markersRef = useRef<GlobeMarker[]>([]);
  const markerBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hoveredRef = useRef<HoveredMarkerMeta | null>(null);
  const scaleRef = useRef(1);
  const sizeRef = useRef(420);
  const phiRef = useRef(0.35);
  const thetaRef = useRef(0.3);
  const velocityPhiRef = useRef(0);
  const velocityThetaRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const lastInteractionRef = useRef(0);
  const [size, setSize] = useState(420);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState<HoveredMarkerMeta | null>(null);

  const pushGlobeGLFrame = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const currentSize = Math.max(64, sizeRef.current);
    globe.update({
      width: currentSize * 2,
      height: currentSize * 2,
      phi: phiRef.current,
      theta: thetaRef.current,
      scale: scaleRef.current,
    });
  }, []);

  /** Posições dos pins sem passar por setState (alinha ao mesmo frame que o GL / pointermove). */
  const syncMarkerOverlayDom = useCallback(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const phi = phiRef.current;
    const theta = thetaRef.current;
    const currentScale = scaleRef.current;
    const dpr = globeDprRef.current;
    const list = markersRef.current;
    const sz = sizeRef.current;

    for (const m of list) {
      const el = markerBtnRefs.current.get(m.id);
      if (!el) continue;

      const p = projectMarkerOverlay(m, phi, theta, canvasEl, currentScale, dpr);
      if (!p) {
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        continue;
      }
      el.style.visibility = 'visible';
      el.style.pointerEvents = 'auto';
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      el.style.width = `${p.sizePx}px`;
      el.style.height = `${p.sizePx}px`;
    }

    const tip = tooltipRef.current;
    const hov = hoveredRef.current;
    if (!tip) return;

    if (!hov) {
      tip.style.visibility = 'hidden';
      return;
    }

    const m = list.find((x) => x.id === hov.id);
    const tp = m ? projectMarkerOverlay(m, phi, theta, canvasEl, currentScale, dpr) : null;
    if (tp) {
      tip.style.visibility = 'visible';
      tip.style.left = `${Math.min(sz - 20, tp.x + 14)}px`;
      tip.style.top = `${Math.max(16, tp.y - 10)}px`;
    } else {
      tip.style.visibility = 'hidden';
    }
  }, []);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const syncSize = () => {
      const next = Math.max(280, Math.min(560, Math.floor(host.clientWidth)));
      setSize(next);
    };
    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const markers = useMemo<GlobeMarker[]>(() => {
    const maxCount = points.reduce((m, p) => Math.max(m, p.count), 1);
    return points.map((point) => {
      const label = [point.city, point.region, point.country].filter(Boolean).join(', ') || point.id;
      return {
        id: point.id,
        latitude: point.latitude,
        longitude: point.longitude,
        count: point.count,
        label,
        size: markerSize(point.count, maxCount),
      };
    });
  }, [points]);

  useLayoutEffect(() => {
    markersRef.current = markers;
    scaleRef.current = scale;
    sizeRef.current = size;
    syncMarkerOverlayDom();
  }, [markers, scale, size, hovered, syncMarkerOverlayDom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pxSize = Math.max(64, size);
    let cancelled = false;
    let rafId = 0;

    const boot = () => {
      if (cancelled || !canvasRef.current) return;
      const c = canvasRef.current;
      phiRef.current = phiRef.current || 0.35;
      const dprOpt = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 2);
      globeDprRef.current = dprOpt;
      // Marcadores só no overlay HTML — o WebGL do cobe também os desenharia e ficariam duplicados.
      const globe = createGlobe(c, {
        devicePixelRatio: dprOpt,
        width: pxSize * 2,
        height: pxSize * 2,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: 1,
        diffuse: 1.25,
        mapSamples: 20000,
        mapBrightness: 5.6,
        baseColor: [0.09, 0.16, 0.32],
        markerColor: [0.12, 0.95, 1],
        glowColor: [0.08, 0.25, 0.5],
        scale: scaleRef.current,
      });
      globeRef.current = globe;

      const animate = () => {
        if (cancelled) return;
        const now = performance.now();

        if (!draggingRef.current) {
          if (now - lastInteractionRef.current > 900) {
            velocityPhiRef.current += 0.00045;
          }
          phiRef.current += velocityPhiRef.current;
          thetaRef.current += velocityThetaRef.current;

          velocityPhiRef.current *= 0.94;
          velocityThetaRef.current *= 0.9;

          if (Math.abs(velocityPhiRef.current) < 0.00002) velocityPhiRef.current = 0;
          if (Math.abs(velocityThetaRef.current) < 0.00002) velocityThetaRef.current = 0;
        }
        thetaRef.current = Math.max(-0.95, Math.min(0.95, thetaRef.current));

        pushGlobeGLFrame();

        syncMarkerOverlayDom();
        rafId = window.requestAnimationFrame(animate);
      };
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(boot);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      globeRef.current?.destroy();
      globeRef.current = null;
    };
  }, [size, pushGlobeGLFrame, syncMarkerOverlayDom]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    setIsDragging(true);
    lastXRef.current = event.clientX;
    lastYRef.current = event.clientY;
    velocityPhiRef.current = 0;
    velocityThetaRef.current = 0;
    lastInteractionRef.current = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const deltaX = event.clientX - lastXRef.current;
    const deltaY = event.clientY - lastYRef.current;
    lastXRef.current = event.clientX;
    lastYRef.current = event.clientY;

    const nextVelocityPhi = deltaX * 0.00085;
    const nextVelocityTheta = deltaY * 0.00085;
    velocityPhiRef.current = nextVelocityPhi;
    velocityThetaRef.current = nextVelocityTheta;
    phiRef.current += deltaX * 0.01;
    thetaRef.current += deltaY * 0.01;
    thetaRef.current = Math.max(-0.95, Math.min(0.95, thetaRef.current));
    lastInteractionRef.current = performance.now();

    // Sem isto o GL e os pins só atualizam no próximo RAF (normalmente após o pointermove).
    pushGlobeGLFrame();
    syncMarkerOverlayDom();
  };

  const onPointerUp = () => {
    draggingRef.current = false;
    setIsDragging(false);
    lastInteractionRef.current = performance.now();
  };

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.05 : 0.05;
      setScale((prev) => Math.max(0.8, Math.min(1.4, Number((prev + delta).toFixed(2)))));
      lastInteractionRef.current = performance.now();
    };

    host.addEventListener('wheel', onWheel, { passive: false });
    return () => host.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Origem dos acessos no mundo</h2>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Total na base: {totalVisits}</p>
          <p className="text-xs text-zinc-500">{points.length} ponto(s) geolocalizado(s)</p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mt-4 flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-[radial-gradient(circle_at_50%_40%,rgba(10,68,122,0.2),rgba(5,8,15,0.95)_65%)]"
      >
        {/*
          Quadrado explícito + mx-auto: o cobe envolve o canvas num div width/height 100%;
          sem isto o wrapper estica na flex e o globo fica visualmente à esquerda.
        */}
        <div
          className="relative mx-auto shrink-0"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            maxWidth: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="block h-full w-full max-w-full"
            style={{
              touchAction: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            aria-label="Globo interativo com origem dos acessos"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div style={{ width: `${size}px`, height: `${size}px`, maxWidth: '100%' }} className="relative aspect-square">
            {markers.map((m) => (
              <button
                key={m.id}
                ref={(el) => {
                  const map = markerBtnRefs.current;
                  if (el) map.set(m.id, el);
                  else map.delete(m.id);
                }}
                type="button"
                onMouseEnter={() => {
                  const meta: HoveredMarkerMeta = { id: m.id, label: m.label, count: m.count };
                  hoveredRef.current = meta;
                  setHovered(meta);
                }}
                onMouseLeave={() => {
                  hoveredRef.current = null;
                  setHovered(null);
                }}
                className="pointer-events-auto absolute rounded-full border border-cyan-200/60 bg-cyan-400/80 shadow-[0_0_16px_rgba(34,211,238,0.55)]"
                style={{
                  left: 0,
                  top: 0,
                  width: 12,
                  height: 12,
                  visibility: 'hidden',
                  transform: 'translate(-50%, -50%)',
                }}
                aria-label={`${m.label}: ${m.count} acessos`}
              />
            ))}
            {hovered ? (
              <div
                ref={tooltipRef}
                className="pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 text-left shadow-xl"
                style={{ visibility: 'hidden', left: 0, top: 0 }}
              >
                <p className="text-xs font-semibold text-zinc-100">{hovered.label}</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">{hovered.count} acesso(s)</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-zinc-700/70 bg-zinc-950/80 p-1">
          <button
            type="button"
            onClick={() => setScale((prev) => Math.max(0.8, Number((prev - 0.05).toFixed(2))))}
            className="h-6 w-6 rounded bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700"
            aria-label="Diminuir zoom do globo"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setScale((prev) => Math.min(1.4, Number((prev + 0.05).toFixed(2))))}
            className="h-6 w-6 rounded bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700"
            aria-label="Aumentar zoom do globo"
          >
            +
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Localizacao aproximada por IP (cidade/estado/pais). Pode haver imprecisao por VPN, rede corporativa ou proxy.
      </p>
    </div>
  );
}
