import { useEffect, useMemo, useState } from 'react';
import { formatSaoPauloDayKey } from '@/lib/date/saoPauloDayKey';
import { subscribeSiteVisitsSince } from '@/lib/firestore/siteVisits';
import type { SiteVisit } from '@/types/siteVisit';

const RANGE_DAYS = 30;
const CHART_DAYS = 14;
const RECENT_ROWS = 40;

function tsToDate(value: SiteVisit['createdAt']): Date | null {
  if (!value || typeof value !== 'object' || typeof value.toDate !== 'function') return null;
  try {
    return value.toDate();
  } catch {
    return null;
  }
}

function chartDayKeys(): string[] {
  const keys: string[] = [];
  const now = Date.now();
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const dt = new Date(now - i * 24 * 60 * 60 * 1000);
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

  useEffect(() => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - RANGE_DAYS);
    return subscribeSiteVisitsSince(
      since,
      setItems,
      (err) => setBanner({ type: 'err', text: err.message || 'Falha ao carregar métricas.' })
    );
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of items) {
      const dt = tsToDate(v.createdAt);
      if (!dt) continue;
      const key = formatSaoPauloDayKey(dt);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const stats = useMemo(() => {
    const todayKeyNow = formatSaoPauloDayKey(new Date());
    const total = items.length;
    const today = byDay.get(todayKeyNow) ?? 0;
    const avgPerDay = total === 0 ? 0 : Math.round((total / RANGE_DAYS) * 10) / 10;
    let peakDay = '';
    let peakCount = 0;
    for (const [day, n] of byDay) {
      if (n > peakCount) {
        peakCount = n;
        peakDay = day;
      }
    }
    return { total, today, avgPerDay, peakDay, peakCount };
  }, [items, byDay]);

  const chartKeys = useMemo(() => chartDayKeys(), []);
  const chartMax = useMemo(() => {
    let m = 1;
    for (const k of chartKeys) {
      m = Math.max(m, byDay.get(k) ?? 0);
    }
    return m;
  }, [chartKeys, byDay]);

  const todayKey = formatSaoPauloDayKey(new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-zinc-50">Acessos ao site</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-500">
          Visualizações de página registadas automaticamente quando alguém navega no site público (últimos{' '}
          {RANGE_DAYS} dias). Não equivale a visitantes únicos — apenas eventos de navegação.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total ({RANGE_DAYS} dias)</p>
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
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Últimos {CHART_DAYS} dias (fuso São Paulo)
        </h2>
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex min-w-[640px] items-end gap-1.5 sm:min-w-0 sm:gap-2" role="img" aria-label="Gráfico de barras de visualizações por dia">
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
                    title={`${key}: ${n} visualizações`}
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

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
          <thead className="bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Data / hora</th>
              <th className="px-4 py-3 font-medium">Caminho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/20">
            {items.slice(0, RECENT_ROWS).map((row) => {
              const dt = tsToDate(row.createdAt);
              const label = dt
                ? dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                : '—';
              return (
                <tr key={row.id} className="text-zinc-300">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">{label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-200">{row.path || '/'}</td>
                </tr>
              );
            })}
            {items.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-10 text-center text-zinc-500">
                  Ainda não há registros de navegação. Visite o site público com esta versão publicada e as regras do
                  Firestore atualizadas para começar a acumular dados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {items.length >= 5000 ? (
        <p className="text-xs text-amber-200/90">
          Limite de {5000} eventos mais recentes no período — valores podem estar truncados se o tráfego for muito alto.
        </p>
      ) : null}
    </div>
  );
}
