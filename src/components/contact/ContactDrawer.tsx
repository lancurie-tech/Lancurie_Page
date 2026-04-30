import { X } from 'lucide-react';
import * as React from 'react';
import { useContactDrawer } from '@/contexts/useContactDrawer';
import type { ContactNeedType } from '@/types/contactIntent';
import { useI18n } from '@/i18n/useI18n';
import { createContactRequest } from '@/lib/firestore/contactRequests';
import type { PublicPageText } from '@/types/sitePublicContent';

const NEED_TO_FORM: Record<ContactNeedType, keyof PublicPageText['contact']['form']> = {
  modular: 'needModular',
  bespoke: 'needBespoke',
  clientinfra: 'needClientInfra',
  automation: 'needAutomation',
  consulting: 'needConsulting',
  other: 'needOther',
};

function needLabel(f: PublicPageText['contact']['form'], v: ContactNeedType): string {
  const key = NEED_TO_FORM[v];
  return f[key] ?? v;
}

export function ContactDrawer() {
  const { publicText: p } = useI18n();
  const f = p.contact.form;
  const d = p.contact.drawer;
  const { isOpen, close, intent } = useContactDrawer();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [need, setNeed] = React.useState<ContactNeedType>('other');
  const [message, setMessage] = React.useState('');
  const [privacy, setPrivacy] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitOk, setSubmitOk] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const tmr = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLInputElement>('input[name="contact-name"]')?.focus();
    }, 50);
    return () => window.clearTimeout(tmr);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    if (intent?.needType) setNeed(intent.needType);
  }, [isOpen, intent?.needType]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  React.useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setWhatsapp('');
      setCompany('');
      setNeed('other');
      setMessage('');
      setPrivacy(false);
      setSending(false);
      setSubmitError(null);
      setSubmitOk(null);
      previouslyFocused.current?.focus?.();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const needLabelText = needLabel(f, need);
  const canSubmit = name.trim() && email.trim() && whatsapp.trim() && message.trim() && privacy;
  const a11y = p.a11y;

  async function submitContactRequest() {
    if (!canSubmit || sending) return;
    setSubmitError(null);
    setSubmitOk(null);
    setSending(true);
    try {
      await createContactRequest({
        name: name.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        company: company.trim(),
        needType: need,
        needLabel: needLabelText,
        message: message.trim(),
        privacyAccepted: true,
        origin: intent?.origin ?? 'contact_drawer',
        productId: intent?.productId ?? '',
        productTitle: intent?.productTitle ?? '',
      });
      setSubmitOk('Pedido enviado com sucesso. A equipa vai analisar e entrar em contato manualmente.');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Não foi possível enviar o pedido agora.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-230" aria-hidden={false}>
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label={a11y.closeContactDrawer.trim() ? a11y.closeContactDrawer : 'Fechar'}
        onClick={close}
      />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-drawer-title"
          className="flex max-h-[92dvh] w-full max-w-[min(94vw,44rem)] flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#0c0c10]/98 shadow-[0_26px_90px_-28px_rgba(0,0,0,0.82)] ring-1 ring-inset ring-white/6 transition-transform duration-300 motion-safe:hover:-translate-y-0.5 sm:rounded-3xl"
          style={{ transform: 'perspective(1200px) translateZ(0)' }}
        >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/90 px-5 py-4">
          <div>
            <h2 id="contact-drawer-title" className="font-display text-xl font-normal text-zinc-100">
              {d.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200"
            aria-label={a11y.closeContactDrawer.trim() ? a11y.closeContactDrawer : 'Fechar'}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

          <form
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submitContactRequest();
            }}
          >
          <label className="block text-xs font-medium text-zinc-400">
            {f.name}
            <input
              name="contact-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-700/90 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/0 transition-shadow focus:ring-2 focus:ring-emerald-500/35"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            {f.email}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-700/90 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/0 transition-shadow focus:ring-2 focus:ring-emerald-500/35"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            WhatsApp
            <input
              required
              inputMode="tel"
              autoComplete="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-700/90 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/0 transition-shadow focus:ring-2 focus:ring-emerald-500/35"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            Empresa (opcional)
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-700/90 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/0 transition-shadow focus:ring-2 focus:ring-emerald-500/35"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            {f.needType}
            <select
              value={need}
              onChange={(e) => setNeed(e.target.value as ContactNeedType)}
              className="mt-1.5 w-full rounded-lg border border-zinc-700/90 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/0 transition-shadow focus:ring-2 focus:ring-emerald-500/35"
            >
              {(
                [
                  ['modular', f.needModular],
                  ['bespoke', f.needBespoke],
                  ['clientinfra', f.needClientInfra],
                  ['automation', f.needAutomation],
                  ['consulting', f.needConsulting],
                  ['other', f.needOther],
                ] as const
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            {f.message}
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full resize-y rounded-lg border border-zinc-700/90 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/0 transition-shadow focus:ring-2 focus:ring-emerald-500/35"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              className="mt-0.5 rounded border-zinc-600"
              required
            />
            <span>{f.privacy}</span>
          </label>
          {submitError ? (
            <p className="text-xs text-red-400" role="alert">
              {submitError}
            </p>
          ) : null}
          {submitOk ? (
            <p className="text-xs text-emerald-300" role="status">
              {submitOk}
            </p>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 border-t border-zinc-800/80 pt-4">
            <button
              type="submit"
              disabled={!canSubmit || sending}
              className="w-full rounded-xl bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {sending ? 'A enviar…' : 'Enviar pedido'}
            </button>
            <button
              type="button"
              onClick={close}
              className="w-full py-2 text-sm text-zinc-500 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-300"
            >
              {f.cancel}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
