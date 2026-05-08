import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import createGlobe from 'cobe';

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

function markerSize(count: number, max: number): number {
  if (max <= 1) return 0.08;
  const t = Math.max(0, Math.min(1, count / max));
  return 0.07 + t * 0.12;
}

function projectMarker(
  marker: GlobeMarker,
  phi: number,
  theta: number,
  radius: number,
  center: number
): ProjectedMarker | null {
  const lat = (marker.latitude * Math.PI) / 180;
  const lon = (marker.longitude * Math.PI) / 180;
  const x = Math.cos(lat) * Math.cos(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.sin(lon);

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const x1 = x * cosPhi - z * sinPhi;
  const z1 = x * sinPhi + z * cosPhi;

  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const y1 = y * cosTheta - z1 * sinTheta;
  const z2 = y * sinTheta + z1 * cosTheta;

  if (z2 < 0.08) return null;

  return {
    id: marker.id,
    x: center + x1 * radius,
    y: center - y1 * radius,
    sizePx: 4 + marker.size * 28,
    label: marker.label,
    count: marker.count,
  };
}

export function WorldAccessMap({ points, totalVisits }: WorldAccessMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
  const [projectedMarkers, setProjectedMarkers] = useState<ProjectedMarker[]>([]);
  const [hovered, setHovered] = useState<ProjectedMarker | null>(null);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    phiRef.current = phiRef.current || 0.35;
    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.25,
      mapSamples: 20000,
      mapBrightness: 5.6,
      baseColor: [0.09, 0.16, 0.32],
      markerColor: [0.12, 0.95, 1],
      glowColor: [0.08, 0.25, 0.5],
      markers: markers.map((m) => ({ location: [m.latitude, m.longitude] as [number, number], size: m.size })),
      scale,
    });

    let frame = 0;
    let lastOverlayTs = 0;
    const animate = () => {
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

      globe.update({
        width: size * 2,
        height: size * 2,
        phi: phiRef.current,
        theta: thetaRef.current,
        markers: markers.map((m) => ({ location: [m.latitude, m.longitude] as [number, number], size: m.size })),
        scale,
      });

      if (now - lastOverlayTs > 60) {
        const radius = size * 0.47 * scale;
        const center = size / 2;
        setProjectedMarkers(
          markers
            .map((m) => projectMarker(m, phiRef.current, thetaRef.current, radius, center))
            .filter((m): m is ProjectedMarker => Boolean(m))
        );
        lastOverlayTs = now;
      }
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      globe.destroy();
    };
  }, [markers, size, scale]);

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
  };

  const onPointerUp = () => {
    draggingRef.current = false;
    setIsDragging(false);
    lastInteractionRef.current = performance.now();
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    setScale((prev) => Math.max(0.8, Math.min(1.4, Number((prev + delta).toFixed(2)))));
    lastInteractionRef.current = performance.now();
  };

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
        className="relative mt-4 flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-[radial-gradient(circle_at_50%_40%,rgba(10,68,122,0.2),rgba(5,8,15,0.95)_65%)]"
        onWheel={onWheel}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            maxWidth: '100%',
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          aria-label="Globo interativo com origem dos acessos"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div style={{ width: `${size}px`, height: `${size}px` }} className="relative">
            {projectedMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                onMouseEnter={() => setHovered(marker)}
                onMouseLeave={() => setHovered((prev) => (prev?.id === marker.id ? null : prev))}
                className="pointer-events-auto absolute rounded-full border border-cyan-200/60 bg-cyan-400/80 shadow-[0_0_16px_rgba(34,211,238,0.55)]"
                style={{
                  left: `${marker.x}px`,
                  top: `${marker.y}px`,
                  width: `${marker.sizePx}px`,
                  height: `${marker.sizePx}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                aria-label={`${marker.label}: ${marker.count} acessos`}
              />
            ))}
            {hovered ? (
              <div
                className="pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 text-left shadow-xl"
                style={{
                  left: `${Math.min(size - 20, hovered.x + 14)}px`,
                  top: `${Math.max(16, hovered.y - 10)}px`,
                }}
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
