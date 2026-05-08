import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { usePublicSiteSettings } from '@/contexts/usePublicSiteSettings';
import { useSiteImageUrl } from '@/hooks/useSiteImage';
import { cn } from '@/lib/cn';

const WHATSAPP_INTRO = 'Olá, gostaria de saber mais sobre os serviços da Lancurie.';

type ChatEntry =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; showWhatsapp?: boolean; whatsappPrefill?: string };

const INITIAL_MESSAGES: ChatEntry[] = [
  { id: 'welcome', role: 'assistant', text: 'Qual é a sua dúvida?' },
];

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function freshInitialMessages(): ChatEntry[] {
  return INITIAL_MESSAGES.map((m) => ({ ...m }));
}

export function ChatLauncher() {
  const { whatsappPhone } = usePublicSiteSettings();
  const reduceMotion = useReducedMotion();
  const avatarSrc = useSiteImageUrl('footerFavicon');
  const panelId = useId();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>(() => freshInitialMessages());
  const [draft, setDraft] = useState('');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const whatsappHrefFor = useMemo(
    () => (extraUserLine?: string) => {
      if (!whatsappPhone) return '';
      const body =
        extraUserLine && extraUserLine.trim().length > 0
          ? `${WHATSAPP_INTRO}\n\nMinha dúvida: ${extraUserLine.trim()}`
          : WHATSAPP_INTRO;
      return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(body)}`;
    },
    [whatsappPhone]
  );

  const openChatPanel = useCallback(() => {
    setMessages(freshInitialMessages());
    setDraft('');
    setOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = () => openChatPanel();
    window.addEventListener('lancurie:open-chat', handle);
    return () => window.removeEventListener('lancurie:open-chat', handle);
  }, [openChatPanel]);

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

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [messages, open, reduceMotion]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;

    const userLine = text;
    setDraft('');
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: 'user', text: userLine },
      {
        id: newId(),
        role: 'assistant',
        text: 'Entre em contato pelo nosso WhatsApp.',
        showWhatsapp: true,
        whatsappPrefill: userLine,
      },
    ]);
  }

  if (!whatsappPhone) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-6"
      aria-live="polite"
    >
      <div className="pointer-events-auto relative flex w-full max-w-[min(100%,20rem)] flex-col items-end gap-2.5 sm:max-w-88">
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="chat-panel"
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Chat Lancurie"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: reduceMotion ? 0.18 : 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'relative flex min-h-67 max-h-[min(26rem,62vh)] w-full flex-col overflow-hidden rounded-xl border border-zinc-700/70 bg-[#12131a] text-[13px] leading-snug antialiased shadow-[0_24px_56px_-20px_rgba(0,0,0,0.82)] sm:min-h-70'
              )}
            >
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800/90 px-3 py-2.5 sm:px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-zinc-950 p-0.5">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <MessageCircle className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] font-semibold leading-none tracking-tight text-zinc-100">
                      Lancurie
                    </p>
                    <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
                      Assistente
                    </p>
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
                  className="-m-0.5 rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/4 hover:text-zinc-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </header>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-5 pt-3 sm:px-3.5 sm:pb-6 [scrollbar-width:thin]"
                role="log"
                aria-label="Mensagens da conversa"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'user' ? (
                      <div
                        className={cn(
                          'max-w-[min(100%,88%)] rounded-[14px] rounded-br-[4px] border border-zinc-600/35',
                          'bg-zinc-800/55 px-2.5 py-2 text-[13px] leading-[1.45] text-zinc-100'
                        )}
                      >
                        {msg.text}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'max-w-[min(100%,92%)] rounded-[14px] rounded-bl-[4px] border border-zinc-700/55',
                          'bg-zinc-900/65 px-2.5 py-2 text-[13px] leading-[1.45] text-zinc-200'
                        )}
                      >
                        <p className="font-normal">{msg.text}</p>
                        {msg.showWhatsapp ? (
                          <a
                            href={whatsappHrefFor(msg.whatsappPrefill)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setOpen(false)}
                            className={cn(
                              'mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-600/35',
                              'bg-emerald-700/85 px-2.5 py-1.5 text-[11px] font-medium text-emerald-50 transition-colors',
                              'hover:bg-emerald-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400/45'
                            )}
                          >
                            <MessageCircle className="h-3 w-3 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
                            <span>Abrir WhatsApp</span>
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form
                className="shrink-0 border-t border-zinc-800/90 bg-[#0e0f14] px-3 pb-2.5 pt-2 sm:px-3.5 sm:pb-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <div className="flex items-end gap-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escreva sua mensagem…"
                    autoComplete="off"
                    aria-label="Sua mensagem"
                    className={cn(
                      'min-h-9 flex-1 rounded-lg border border-zinc-700/65 bg-zinc-900/80 px-2.5 py-2 text-[13px] text-zinc-100',
                      'placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-cyan-500/25'
                    )}
                  />
                  <button
                    type="submit"
                    aria-label="Enviar mensagem"
                    disabled={!draft.trim()}
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white transition-colors',
                      'hover:bg-emerald-600 disabled:pointer-events-none disabled:opacity-35',
                      'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400/40'
                    )}
                  >
                    <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </form>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          ref={buttonRef}
          type="button"
          onClick={() => (open ? setOpen(false) : openChatPanel())}
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
