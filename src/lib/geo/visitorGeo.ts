export type VisitorGeo = {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
};

const TIMEOUT_MS = 3500;
const CACHE_PREFIX = 'lancurie:visitorGeo:';

function toNum(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function normalizeGeo(raw: unknown): VisitorGeo | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const latitude = toNum(obj.latitude ?? obj.lat);
  const longitude = toNum(obj.longitude ?? obj.lon ?? obj.lng);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return {
    city: typeof obj.city === 'string' ? obj.city : null,
    region: typeof obj.region === 'string' ? obj.region : null,
    country: typeof obj.country_name === 'string' ? obj.country_name : null,
    countryCode: typeof obj.country_code === 'string' ? obj.country_code : null,
    latitude,
    longitude,
  };
}

function cacheKey(dayKey: string): string {
  return `${CACHE_PREFIX}${dayKey}`;
}

function readCache(dayKey: string): VisitorGeo | null {
  try {
    const raw = localStorage.getItem(cacheKey(dayKey));
    if (!raw) return null;
    return normalizeGeo(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeCache(dayKey: string, geo: VisitorGeo): void {
  try {
    localStorage.setItem(cacheKey(dayKey), JSON.stringify(geo));
  } catch {
    /* ignore */
  }
}

export async function getVisitorGeo(dayKey: string): Promise<VisitorGeo | null> {
  if (typeof window === 'undefined') return null;
  const cached = readCache(dayKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    const parsed = normalizeGeo(json);
    if (parsed) writeCache(dayKey, parsed);
    return parsed;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
