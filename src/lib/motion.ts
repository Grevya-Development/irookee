import { Variants } from "framer-motion";

// Standard transition timings
export const transitions = {
  fast: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  normal: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  slow: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  spring: { type: "spring", stiffness: 400, damping: 30 },
  springBouncy: { type: "spring", stiffness: 500, damping: 25 },
};

// Container stagger animation variants
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

// Fade up item variant
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
};

// Fade in variant
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: transitions.fast,
  },
};

// Scale in modal / card variant
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: transitions.fast,
  },
};

// Slide in right / left
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: transitions.fast,
  },
};

// Hover elevation & glow micro-interaction props
export const hoverLift = {
  whileHover: { y: -4, transition: transitions.fast },
  whileTap: { scale: 0.98 },
};

export const hoverGlow = {
  whileHover: { scale: 1.02, transition: transitions.fast },
  whileTap: { scale: 0.98 },
};
