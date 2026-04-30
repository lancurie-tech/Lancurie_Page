import type { Variants } from 'framer-motion';

export function fadeUpVariants(reduceMotion: boolean | null): Variants {
  const y = reduceMotion ? 0 : 22;
  return {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.2 : 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

export function staggerContainerVariants(reduceMotion: boolean | null, stagger = 0.1): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : stagger,
        delayChildren: reduceMotion ? 0 : 0.06,
      },
    },
  };
}

export const viewportOnce = { once: true as const, amount: 0.2 as const, margin: '0px 0px -8% 0px' };
