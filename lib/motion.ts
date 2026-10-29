// Every animation in onboarding, in one place. Tune here; the README lists the same values.
// Rules: animate transform and opacity only (60 fps on low-end Android). No springs, no overshoot.
//
// Distances and transitions are kept apart on purpose: framer-motion reads any property name inside a
// transition object (x, y, scale) as a per-property override, and an unknown override falls back to a spring.

/** Fast out, gentle settle. No overshoot: both control-point y values are within 0..1. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const MOTION = {
  /** Step content enters from the side it is coming from; header, progress bar and button do not move. */
  step: { distance: 24, transition: { duration: 0.28, ease: EASE } },
  /** prefers-reduced-motion: no sliding, a short cross-fade. */
  stepReduced: { transition: { duration: 0.12, ease: "linear" } },
  /** Press feedback on choice cards and the primary button. */
  press: { scale: 0.98, transition: { duration: 0.12, ease: EASE } },
  /** Border and background color change on selection (CSS transition, milliseconds). */
  colorMs: 120,
  /** Progress bar fill (scaleX from the left, never width). */
  progress: { transition: { duration: 0.3, ease: EASE } },
  /** Permission notes and error messages: fade in while rising 8px. */
  message: { distance: 8, transition: { duration: 0.2, ease: EASE } },
  /** "Simulan" → Home: one fade. */
  handoff: { transition: { duration: 0.25, ease: EASE } },
} as const;

/** Variants for step content. `custom` is the direction: 1 forward, -1 back. */
export const stepVariants = {
  enter: (direction: number) => ({ x: direction * MOTION.step.distance, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -MOTION.step.distance, opacity: 0 }),
};

export const stepVariantsReduced = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};
