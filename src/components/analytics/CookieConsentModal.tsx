import { useEffect, useState } from 'react';
import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsentStatus,
} from '@/lib/analyticsConsent';

export function CookieConsentModal() {
  const [status, setStatus] = useState<AnalyticsConsentStatus | null>(() => readAnalyticsConsent());

  useEffect(() => {
    const onConsentChange = () => setStatus(readAnalyticsConsent());
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsentChange as EventListener);
    window.addEventListener('storage', onConsentChange);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsentChange as EventListener);
      window.removeEventListener('storage', onConsentChange);
    };
  }, []);

  if (status) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/65 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Consentimento de cookies e métricas"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-700/70 bg-zinc-950/95 p-4 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)] sm:p-5">
        <p className="text-sm font-semibold text-zinc-100">Privacidade e cookies</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">
          Usamos cookies essenciais para o site funcionar e, com sua permissao, metricas basicas de uso para melhoria
          interna. Voce pode aceitar ou recusar.
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-400 sm:text-xs">
          Ao continuar, voce confirma que leu nossa politica de privacidade e pode alterar sua escolha depois.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2.5">
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
