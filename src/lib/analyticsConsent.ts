export type AnalyticsConsentStatus = 'accepted' | 'rejected';

export const ANALYTICS_CONSENT_KEY = 'lancurie:analyticsConsent';
export const ANALYTICS_CONSENT_EVENT = 'lancurie:analytics-consent-changed';

export function readAnalyticsConsent(): AnalyticsConsentStatus | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return raw === 'accepted' || raw === 'rejected' ? raw : null;
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(value: AnalyticsConsentStatus): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: value }));
}

export function clearAnalyticsConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ANALYTICS_CONSENT_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT));
}

export function hasAnalyticsConsent(): boolean {
  return readAnalyticsConsent() === 'accepted';
}
