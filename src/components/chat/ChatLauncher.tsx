import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import { usePublicSiteSettings } from '@/contexts/usePublicSiteSettings';
import { useSiteImageUrl } from '@/hooks/useSiteImage';
import { cn } from '@/lib/cn';

const WHATSAPP_INTRO = 'Olá, gostaria de saber mais sobre os serviços da Lancurie.';

/**
 * Lançador de chat (canto inferior direito) — placeholder até existir IA.
 * Por agora redireciona para WhatsApp; preserva slot para conversa real.
 */
export function ChatLauncher() {
  const { whatsappPhone } = usePublicSiteSettings();
  const reduceMotion = useReducedMotion();
  const avatarSrc = useSiteImageUrl('footerFavicon');
  const panelId = useId();

  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const whatsappHref = useMemo(() => {
    if (!whatsappPhone) return '';
    return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(WHATSAPP_INTRO)}`;
  }, [whatsappPhone]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = () => setOpen(true);
    window.addEventListener('lancurie:open-chat', handle);
    return () => window.removeEventListener('lancurie:open-chat', handle);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!whatsappPhone) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-6"
      aria-live="polite"
    >
      <div className="pointer-events-auto relative flex w-full max-w-88 flex-col items-end gap-3">
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="chat-panel"
              id={panelId}
              role="dialog"
              aria-modal="false"
              aria-label="Chat Lancurie"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: reduceMotion ? 0.18 : 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/95 backdrop-blur-xl',
                'shadow-[0_28px_64px_-24px_rgba(2,6,15,0.85),0_8px_22px_-12px_rgba(34,211,238,0.18)]'
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
              <div
                className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-cyan-400/15 blur-3xl"
                aria-hidden
              />

              <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black p-1 shadow-inner">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <MessageCircle className="h-4.5 w-4.5 text-cyan-200" strokeWidth={1.6} aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[0.95rem] leading-tight text-zinc-100">Lancurie</p>
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-zinc-500">Atendimento</p>
                  </div>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  aria-label="Fechar chat"
                  className="-m-1 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                </button>
              </header>

              <div className="space-y-3 px-4 pb-4 sm:px-5">
                <div className="rounded-2xl rounded-tl-md border border-white/5 bg-white/5 px-3.5 py-3 text-[0.86rem] leading-relaxed text-zinc-200/95">
                  Olá! Por aqui o atendimento acontece via WhatsApp — toque no botão para conversarmos em tempo real.
                </div>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'group flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-100 transition-all duration-300',
                    'hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-emerald-500/25 hover:shadow-[0_18px_40px_-18px_rgba(16,185,129,0.55)]',
                    'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-300/70'
                  )}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                  <span>Falar pelo WhatsApp</span>
                  <span
                    className="ml-1 text-emerald-200/80 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  >
                    →
                  </span>
                </a>

                <p className="flex items-center gap-1.5 text-[0.68rem] leading-relaxed text-zinc-500">
                  <Sparkles className="h-3 w-3 text-cyan-300/80" strokeWidth={1.8} aria-hidden />
                  Em breve: copiloto Lancurie para tirar dúvidas e iniciar projetos por aqui.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Fechar chat Lancurie' : 'Abrir chat Lancurie'}
          aria-expanded={open}
          aria-controls={panelId}
          initial={false}
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className={cn(
            'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10',
            'bg-linear-to-br from-[#0c1628] via-[#0a1322] to-[#060a14] text-zinc-100',
            'shadow-[0_18px_48px_-16px_rgba(2,6,15,0.85),0_4px_14px_-6px_rgba(34,211,238,0.35)]',
            'transition-colors duration-300 hover:border-cyan-300/40 hover:text-white',
            'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-300/70'
          )}
        >
          {!open && !reduceMotion ? (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full bg-cyan-400/25"
              initial={{ opacity: 0.55, scale: 1 }}
              animate={{ opacity: [0.55, 0, 0.55], scale: [1, 1.45, 1] }}
              transition={{ duration: 2.6, ease: 'easeOut', repeat: Infinity }}
              aria-hidden
            />
          ) : null}
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="icon-x"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -90 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative"
              >
                <X className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="icon-chat"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 90 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={1.7} aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
