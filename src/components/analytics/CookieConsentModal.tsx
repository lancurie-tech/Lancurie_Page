import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
          Usamos armazenamento necessário ao funcionamento do site e, com a sua permissão, métricas básicas de uso para
          melhoria interna. Pode aceitar ou recusar.
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-400 sm:text-xs">
          Ao continuar, confirma que leu a nossa{' '}
          <Link
            to="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-cyan-300 underline decoration-cyan-500/50 underline-offset-2 hover:text-cyan-200"
          >
            política de privacidade
          </Link>{' '}
          e pode alterar a sua escolha depois, inclusive pelo rodapé (Gerenciar cookies).
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
