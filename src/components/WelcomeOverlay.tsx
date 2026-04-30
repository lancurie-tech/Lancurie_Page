import { useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@/i18n/useI18n';
import { useWelcomeLayout } from '@/contexts/useWelcomeLayout';
import { useSiteImageUrl } from '@/hooks/useSiteImage';

type Phase = 'curtain' | 'ready' | 'flight' | 'gone';

type FlightBox = {
  start: DOMRectReadOnly;
  end: DOMRectReadOnly;
};

const BACKDROP_FADE_DURATION = 1.05;
/** ~delay 0.08s + duração ~2.65s + margem */
const SHEEN_FALLBACK_MS = 3200;

/**
 * Recepção premium: entrada em mola, clarão em ecrã inteiro (E→D, depois D→E), depois voo até ao header.
 */
export function WelcomeOverlay() {
  const { publicText: p } = useI18n();
  const logoSrc = useSiteImageUrl('logoFull');
  const reduced = useReducedMotion();
  const { headerLogoAnchorRef, setSiteVisualUnlocked } = useWelcomeLayout();
  const [phase, setPhase] = useState<Phase>('curtain');
  const [flightBox, setFlightBox] = useState<FlightBox | null>(null);
  const centerLogoRef = useRef<HTMLImageElement | null>(null);
  const flightEnded = useRef(false);
  const exitStarted = useRef(false);

  const finishAndUnlock = useCallback(() => {
    if (flightEnded.current) return;
    flightEnded.current = true;
    setSiteVisualUnlocked(true);
    setPhase('gone');
    setFlightBox(null);
  }, [setSiteVisualUnlocked]);

  const beginExit = useCallback(() => {
    if (phase !== 'ready' || exitStarted.current) return;
    exitStarted.current = true;

    if (reduced) {
      finishAndUnlock();
      return;
    }

    const logoEl = centerLogoRef.current;
    const targetEl = headerLogoAnchorRef.current;
    if (!logoEl || !targetEl) {
      finishAndUnlock();
      return;
    }

    const start = logoEl.getBoundingClientRect();
    const end = targetEl.getBoundingClientRect();
    if (start.width < 8 || end.width < 8) {
      finishAndUnlock();
      return;
    }

    setFlightBox({ start, end });
    setPhase('flight');
  }, [phase, reduced, finishAndUnlock, headerLogoAnchorRef]);

  useEffect(() => {
    if (phase !== 'curtain') return;
    const id = requestAnimationFrame(() => setPhase('ready'));
    return () => cancelAnimationFrame(id);
  }, [phase]);

  /** Sem animação de reflexo: avança após breve pausa */
  useEffect(() => {
    if (phase !== 'ready' || !reduced) return;
    const timer = window.setTimeout(() => beginExit(), 950);
    return () => clearTimeout(timer);
  }, [phase, reduced, beginExit]);

  /** Fallback se `animationend` falhar */
  useEffect(() => {
    if (phase !== 'ready' || reduced) return;
    const timer = window.setTimeout(() => {
      if (!exitStarted.current) beginExit();
    }, SHEEN_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [phase, reduced, beginExit]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && phase === 'ready') beginExit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, beginExit]);

  if (phase === 'gone') return null;

  const showCenterPiece = phase === 'curtain' || phase === 'ready';
  const isFlight = phase === 'flight' && flightBox !== null;
  const showSheen = phase === 'ready' && !reduced;

  const springEnter = {
    type: 'spring' as const,
    stiffness: 200,
    damping: 28,
    mass: 1.05,
  };

  const springFlight = {
    type: 'spring' as const,
    stiffness: 280,
    damping: 32,
    mass: 0.95,
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-200',
        phase === 'ready' && 'cursor-pointer',
        phase === 'flight' && 'pointer-events-none',
        phase === 'curtain' && 'pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lancurie-welcome-brand"
      onClick={() => {
        if (phase === 'ready') beginExit();
      }}
    >
      <h1 id="lancurie-welcome-brand" className="sr-only">
        {p.brandName}
      </h1>

      <motion.div
        className="pointer-events-none absolute inset-0 bg-[#020203]"
        aria-hidden
        initial={false}
        animate={{
          /* curtain + ready: sempre opaco — evita 1 frame com a Home visível por baixo */
          opacity: isFlight ? 0 : 1,
        }}
        transition={
          isFlight
            ? { duration: BACKDROP_FADE_DURATION, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0 }
        }
      />

      {showCenterPiece ? (
        <div
          className={clsx(
            'relative z-210 flex h-full flex-col items-center justify-center px-6',
            phase === 'curtain' && 'opacity-0',
            phase === 'ready' && 'opacity-100'
          )}
        >
          <div className="relative flex flex-col items-center">
            <div className="relative">
              {logoSrc ? (
                <motion.img
                  ref={centerLogoRef}
                  src={logoSrc}
                  alt={p.brandName}
                  width={560}
                  height={160}
                  draggable={false}
                  className="relative z-1 h-auto w-[min(94vw,560px)] max-h-[min(38vh,220px)] object-contain object-center drop-shadow-[0_20px_64px_rgba(0,0,0,0.55)] sm:max-h-[min(42vh,260px)] md:max-h-[min(44vh,300px)]"
                  initial={{ opacity: 0, scale: 0.88, y: 40 }}
                  animate={
                    phase === 'ready'
                      ? { opacity: 1, scale: 1, y: 0 }
                      : { opacity: 0, scale: 0.88, y: 40 }
                  }
                  transition={{
                    ...springEnter,
                    delay: phase === 'ready' ? 0.09 : 0,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showSheen ? (
        <div
          className="pointer-events-none fixed inset-0 z-212 overflow-hidden"
          aria-hidden
        >
          <div
            className="lancurie-welcome-fullscreen-sweep"
            onAnimationEnd={() => {
              if (phase === 'ready' && !exitStarted.current) beginExit();
            }}
          />
        </div>
      ) : null}

      {isFlight && flightBox && logoSrc ? (
        <motion.img
          aria-hidden
          src={logoSrc}
          alt=""
          width={420}
          height={120}
          draggable={false}
          className="pointer-events-none fixed z-220 object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          initial={{
            left: flightBox.start.left,
            top: flightBox.start.top,
            width: flightBox.start.width,
            height: 'auto',
          }}
          animate={{
            left: flightBox.end.left,
            top: flightBox.end.top,
            width: flightBox.end.width,
          }}
          transition={springFlight}
          onAnimationComplete={() => {
            finishAndUnlock();
          }}
        />
      ) : null}
    </div>
  );
}
