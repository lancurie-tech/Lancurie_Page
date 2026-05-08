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
const FAILURE_SUFFIX = ':failed';
const GEO_PROVIDERS = ['https://ipapi.co/json/', 'https://ipwho.is/'] as const;

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
    country:
      typeof obj.country_name === 'string'
        ? obj.country_name
        : typeof obj.country === 'string'
          ? obj.country
          : null,
    countryCode:
      typeof obj.country_code === 'string'
        ? obj.country_code
        : typeof obj.countryCode === 'string'
          ? obj.countryCode
          : null,
    latitude,
    longitude,
  };
}

function cacheKey(dayKey: string): string {
  return `${CACHE_PREFIX}${dayKey}`;
}

function failureCacheKey(dayKey: string): string {
  return `${cacheKey(dayKey)}${FAILURE_SUFFIX}`;
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

function readFailureCache(dayKey: string): boolean {
  try {
    return localStorage.getItem(failureCacheKey(dayKey)) === '1';
  } catch {
    return false;
  }
}

function writeFailureCache(dayKey: string): void {
  try {
    localStorage.setItem(failureCacheKey(dayKey), '1');
  } catch {
    /* ignore */
  }
}

function writeCache(dayKey: string, geo: VisitorGeo): void {
  try {
    localStorage.setItem(cacheKey(dayKey), JSON.stringify(geo));
    localStorage.removeItem(failureCacheKey(dayKey));
  } catch {
    /* ignore */
  }
}

function getGeoFromBrowser(): Promise<VisitorGeo | null> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          resolve(null);
          return;
        }
        resolve({
          city: null,
          region: null,
          country: null,
          countryCode: null,
          latitude,
          longitude,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 1000 * 60 * 60,
      }
    );
  });
}

export async function getVisitorGeo(dayKey: string): Promise<VisitorGeo | null> {
  if (typeof window === 'undefined') return null;
  const cached = readCache(dayKey);
  if (cached) return cached;
  if (readFailureCache(dayKey)) return null;

  for (const endpoint of GEO_PROVIDERS) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) continue;
      const json = (await res.json()) as unknown;
      const parsed = normalizeGeo(json);
      if (parsed) {
        writeCache(dayKey, parsed);
        return parsed;
      }
    } catch {
      /* tenta o próximo provedor */
    } finally {
      window.clearTimeout(timer);
    }
  }

  const fromBrowser = await getGeoFromBrowser();
  if (fromBrowser) {
    writeCache(dayKey, fromBrowser);
    return fromBrowser;
  }

  writeFailureCache(dayKey);
  return null;
}
