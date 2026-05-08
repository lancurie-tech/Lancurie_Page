import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePublicSiteSettings } from '@/contexts/usePublicSiteSettings';
import { cn } from '@/lib/cn';

const WHATSAPP_INTRO = 'Olá, gostaria de saber mais sobre os serviços da Lancurie.';

export function ChatLauncher() {
  const { whatsappPhone } = usePublicSiteSettings();
  const reduceMotion = useReducedMotion();
  const whatsappHref = useMemo(() => {
    if (!whatsappPhone) return '';
    return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(WHATSAPP_INTRO)}`;
  }, [whatsappPhone]);

  if (!whatsappPhone) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-6"
      aria-live="off"
    >
      <div className="pointer-events-auto relative flex shrink-0 flex-col items-end">
        <motion.a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir WhatsApp da Lancurie"
          title="Falar no WhatsApp"
          initial={false}
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className={cn(
            'relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-emerald-300/25',
            'bg-linear-to-br from-[#22c55e] via-[#1fb455] to-[#159947] text-white',
            'shadow-[0_18px_48px_-16px_rgba(12,78,39,0.65),0_4px_14px_-6px_rgba(74,222,128,0.55)]',
            'transition-colors duration-300 hover:from-[#25d366] hover:to-[#1aa44f]',
            'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-300/80'
          )}
        >
          {!reduceMotion ? (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full bg-emerald-300/30"
              initial={{ opacity: 0.55, scale: 1 }}
              animate={{ opacity: [0.55, 0, 0.55], scale: [1, 1.45, 1] }}
              transition={{ duration: 2.6, ease: 'easeOut', repeat: Infinity }}
              aria-hidden
            />
          ) : null}
          <span className="relative" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              <path d="M19.05 4.94A9.94 9.94 0 0 0 12.02 2c-5.5 0-9.97 4.47-9.97 9.98a9.93 9.93 0 0 0 1.35 5.01L2 22l5.13-1.34a9.9 9.9 0 0 0 4.89 1.25h.01c5.5 0 9.97-4.48 9.97-9.98a9.9 9.9 0 0 0-2.95-6.99Zm-7.03 15.29h-.01a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.04.79.81-2.96-.2-.31a8.32 8.32 0 0 1-1.28-4.43c0-4.61 3.75-8.36 8.37-8.36 2.23 0 4.33.87 5.9 2.45a8.3 8.3 0 0 1 2.45 5.9c0 4.62-3.76 8.36-8.37 8.36Zm4.59-6.26c-.25-.13-1.47-.73-1.69-.82-.23-.08-.39-.13-.56.13-.16.25-.64.82-.78.98-.14.17-.28.19-.53.07-.25-.13-1.05-.39-2-1.24a7.43 7.43 0 0 1-1.39-1.72c-.15-.26-.01-.4.11-.53.11-.11.25-.28.38-.42.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.44.07-.67.32-.23.25-.88.86-.88 2.1s.91 2.44 1.04 2.61c.13.17 1.79 2.73 4.33 3.83.6.26 1.08.42 1.45.53.61.19 1.16.16 1.6.1.49-.07 1.47-.6 1.67-1.18.21-.59.21-1.09.15-1.19-.06-.09-.23-.14-.48-.27Z" />
            </svg>
          </span>
        </motion.a>
      </div>
    </div>
  );
}
