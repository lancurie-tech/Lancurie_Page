import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { useI18n } from '@/i18n/useI18n';
import { useSiteImageUrl } from '@/hooks/useSiteImage';
import { firebaseReady } from '@/lib/firebase/config';

export function AdminLoginPage() {
  const { publicText: p } = useI18n();
  const faviconSrc = useSiteImageUrl('footerFavicon');
  const { login, error, clearError, user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  /** Após signIn bem-sucedido, esperamos o listener carregar o perfil antes de navegar (evita corrida com AdminRoute). */
  const [awaitingSession, setAwaitingSession] = useState(false);

  useEffect(() => {
    if (!awaitingSession) return;
    if (loading) return;
    if (user && profile?.role === 'admin') {
      setAwaitingSession(false);
      navigate('/admin', { replace: true });
      return;
    }
    if (!user) {
      setAwaitingSession(false);
    }
  }, [awaitingSession, loading, user, profile, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!firebaseReady) {
      setLocalError('Firebase não está configurado. Adicione as variáveis VITE_FIREBASE_* ao .env.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      setAwaitingSession(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Falha no login.');
    } finally {
      setBusy(false);
    }
  }

  const displayError = localError || error;

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center px-5 py-16 sm:px-8">
      <Link
        to="/"
        className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-800 hover:bg-zinc-900/60 hover:text-zinc-200 sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Voltar ao site
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/90 p-8 shadow-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900/80 p-1">
            {faviconSrc ? (
              <img
                src={faviconSrc}
                alt=""
                width={48}
                height={48}
                className="h-full w-full rounded-full object-cover"
              />
            ) : null}
          </div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-zinc-100">
            {p.login.title}
          </h1>
          <p className="text-xs leading-relaxed text-zinc-500">
            Área reservada ao administrador do site. O conteúdo público continua igual para visitantes.
          </p>
        </div>

        {!firebaseReady ? (
          <p className="mt-6 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-sm text-amber-200/90">
            Configure o Firebase no ficheiro <code className="text-amber-100">.env</code> (veja{' '}
            <code className="text-amber-100">.env.example</code>) e reinicie o servidor de desenvolvimento.
          </p>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-zinc-200"
            >
              {p.login.emailLabel || 'Email'}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="seu@email.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              className="lancurie-dark-input w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-zinc-200"
            >
              {p.login.passwordLabel || 'Senha'}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              className="lancurie-dark-input w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          {displayError ? (
            <p className="text-sm text-red-400" role="alert">
              {displayError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || awaitingSession}
            className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-900 transition-opacity hover:bg-white disabled:opacity-60"
          >
            {busy || awaitingSession ? 'A entrar…' : p.login.submit?.trim() || 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
