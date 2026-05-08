import { useEffect, useMemo, useState } from 'react';
import { WorldAccessMap } from '@/components/analytics/WorldAccessMap';
import { formatSaoPauloDayKey } from '@/lib/date/saoPauloDayKey';
import { subscribeSiteVisitsSince } from '@/lib/firestore/siteVisits';
import type { SiteVisit } from '@/types/siteVisit';

const FETCH_RANGE_DAYS = 90;
const RANGE_OPTIONS = [7, 15, 30, 90] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

function tsToDate(value: SiteVisit['createdAt']): Date | null {
  if (!value || typeof value !== 'object' || typeof value.toDate !== 'function') return null;
  try {
    return value.toDate();
  } catch {
    return null;
  }
}

function chartDayKeys(days: number, nowMs: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(nowMs - i * 24 * 60 * 60 * 1000);
    keys.push(formatSaoPauloDayKey(dt));
  }
  return keys;
}

function formatDayPt(dayKey: string): string {
  const parts = dayKey.split('-');
  if (parts.length !== 3) return dayKey;
  const [ys, ms, ds] = parts;
  const dt = new Date(`${ys}-${ms}-${ds}T15:00:00Z`);
  return dt.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  });
}

export function AdminSiteAccessPage() {
  const [items, setItems] = useState<SiteVisit[]>([]);
  const [banner, setBanner] = useState<{ type: 'err'; text: string } | null>(null);
  const [selectedRangeDays, setSelectedRangeDays] = useState<RangeOption>(7);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - FETCH_RANGE_DAYS);
    return subscribeSiteVisitsSince(
      since,
      setItems,
      (err) => setBanner({ type: 'err', text: err.message || 'Falha ao carregar métricas.' })
    );
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredItems = useMemo(() => {
    const minTs = nowMs - selectedRangeDays * 24 * 60 * 60 * 1000;
    return items.filter((v) => {
      const dt = tsToDate(v.createdAt);
      if (!dt) return false;
      return dt.getTime() >= minTs;
    });
  }, [items, selectedRangeDays, nowMs]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of filteredItems) {
      const dt = tsToDate(v.createdAt);
      if (!dt) continue;
      const key = formatSaoPauloDayKey(dt);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [filteredItems]);

  const stats = useMemo(() => {
    const todayKeyNow = formatSaoPauloDayKey(new Date(nowMs));
    const total = filteredItems.length;
    const today = byDay.get(todayKeyNow) ?? 0;
    const avgPerDay = total === 0 ? 0 : Math.round((total / selectedRangeDays) * 10) / 10;
    let peakDay = '';
    let peakCount = 0;
    for (const [day, n] of byDay) {
      if (n > peakCount) {
        peakCount = n;
        peakDay = day;
      }
    }
    return { total, today, avgPerDay, peakDay, peakCount };
  }, [filteredItems, byDay, selectedRangeDays, nowMs]);

  const chartKeys = useMemo(() => chartDayKeys(selectedRangeDays, nowMs), [selectedRangeDays, nowMs]);
  const chartMax = useMemo(() => {
    let m = 1;
    for (const k of chartKeys) {
      m = Math.max(m, byDay.get(k) ?? 0);
    }
    return m;
  }, [chartKeys, byDay]);

  const todayKey = formatSaoPauloDayKey(new Date(nowMs));

  const geoPoints = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        latitude: number;
        longitude: number;
        count: number;
        city?: string | null;
        region?: string | null;
        country?: string | null;
      }
    >();

    for (const v of filteredItems) {
      const geo = v.geo;
      if (!geo) continue;
      if (
        typeof geo.latitude !== 'number' ||
        typeof geo.longitude !== 'number' ||
        Number.isNaN(geo.latitude) ||
        Number.isNaN(geo.longitude)
      ) {
        continue;
      }
      const key = `${geo.latitude.toFixed(2)}:${geo.longitude.toFixed(2)}`;
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        map.set(key, {
          id: key,
          latitude: geo.latitude,
          longitude: geo.longitude,
          count: 1,
          city: geo.city,
          region: geo.region,
          country: geo.country,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredItems]);

  const topLocations = useMemo(() => geoPoints.slice(0, 6), [geoPoints]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-zinc-50">Acessos ao site</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-500">
          Visitantes únicos por dia registados automaticamente no site público (até {FETCH_RANGE_DAYS} dias). Cada
          navegador conta no máximo 1 acesso por dia (fuso São Paulo).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total ({selectedRangeDays} dias)</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Hoje (SP)</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{stats.today}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Média / dia</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{stats.avgPerDay}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Pico diário</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {stats.peakCount > 0 ? stats.peakCount : '—'}
          </p>
          {stats.peakDay ? (
            <p className="mt-1 text-xs text-zinc-500">{formatDayPt(stats.peakDay)}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">Sem dados ainda</p>
          )}
        </div>
      </div>

      {banner ? (
        <p
          className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {banner.text}
        </p>
      ) : null}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Últimos {selectedRangeDays} dias (fuso São Paulo)
          </h2>
          <div className="inline-flex rounded-lg border border-zinc-700/70 bg-zinc-950/70 p-1">
            {RANGE_OPTIONS.map((days) => {
              const active = selectedRangeDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedRangeDays(days)}
                  className={
                    active
                      ? 'rounded-md bg-cyan-500/25 px-2.5 py-1 text-xs font-medium text-cyan-200'
                      : 'rounded-md px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200'
                  }
                >
                  {days}d
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex min-w-[640px] items-end gap-1.5 sm:min-w-0 sm:gap-2" role="img" aria-label="Gráfico de barras de acessos únicos por dia">
            {chartKeys.map((key) => {
              const n = byDay.get(key) ?? 0;
              const h = Math.max(8, Math.round((n / chartMax) * 100));
              const isToday = key === todayKey;
              return (
                <div key={key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] tabular-nums text-zinc-500 sm:text-xs">{n}</span>
                  <div
                    className="flex w-full flex-col justify-end rounded-t-md bg-zinc-950/60"
                    style={{ height: '7rem' }}
                    title={`${key}: ${n} acessos únicos`}
                  >
                    <div
                      className={
                        isToday
                          ? 'min-h-2 w-full rounded-t-md bg-cyan-500/90'
                          : 'min-h-2 w-full rounded-t-md bg-zinc-600/85'
                      }
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="max-w-full truncate text-[9px] text-zinc-600 sm:text-[10px]">
                    {formatDayPt(key)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <WorldAccessMap points={geoPoints} />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Top locais</h3>
          {topLocations.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {topLocations.map((loc) => {
                const label =
                  [loc.city, loc.region, loc.country].filter(Boolean).join(', ') ||
                  `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`;
                return (
                  <div key={loc.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                    <p className="truncate text-sm text-zinc-200">{label}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{loc.count} acesso(s)</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">
              Ainda sem dados geograficos. Novos acessos com consentimento aceito vao preencher o mapa.
            </p>
          )}
        </div>
      </div>

      {filteredItems.length >= 5000 ? (
        <p className="text-xs text-amber-200/90">
          Limite de {5000} eventos mais recentes no período — valores podem estar truncados se o tráfego for muito alto.
        </p>
      ) : null}
    </div>
  );
}
