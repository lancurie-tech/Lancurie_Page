import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsentStatus,
} from '@/lib/analyticsConsent';

/** Tempo até mostrar o aviso, para não sobrepor à sequência inicial (logo/boas-vindas). */
const CONSENT_MODAL_DELAY_MS = 10_000;

export function CookieConsentModal() {
  const [status, setStatus] = useState<AnalyticsConsentStatus | null>(() => readAnalyticsConsent());
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    const onConsentChange = () => {
      const next = readAnalyticsConsent();
      setStatus(next);
      if (next === null) {
        setDelayElapsed(false);
      }
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsentChange as EventListener);
    window.addEventListener('storage', onConsentChange);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsentChange as EventListener);
      window.removeEventListener('storage', onConsentChange);
    };
  }, []);

  useEffect(() => {
    if (status !== null) return;

    const id = window.setTimeout(() => setDelayElapsed(true), CONSENT_MODAL_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [status]);

  if (status !== null || !delayElapsed) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/65 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Preferência de cookies"
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-700/70 bg-zinc-950/95 p-3.5 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)] sm:p-4">
        <p className="text-xs font-semibold text-zinc-100 sm:text-[13px]">Cookies</p>
        <p className="mt-1.5 text-[11px] leading-snug text-zinc-400 sm:text-xs">
          Para melhor experiência, segurança e desempenho em nossa plataforma. — detalhes na{' '}
          <Link
            to="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-300 underline decoration-zinc-500/50 underline-offset-2 hover:text-zinc-100"
          >
            política de privacidade
          </Link>
          .
        </p>
        <div className="mt-3.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => writeAnalyticsConsent('rejected')}
            className="rounded-lg border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800/70"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => writeAnalyticsConsent('accepted')}
            className="rounded-lg border border-emerald-600/40 bg-emerald-700/90 px-3.5 py-2 text-xs font-semibold text-emerald-50 transition-colors hover:bg-emerald-600"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
