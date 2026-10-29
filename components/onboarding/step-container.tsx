"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { MOTION, stepVariants, stepVariantsReduced } from "@/lib/motion";

/**
 * Only the step content animates. popLayout keeps the old step in the flow while the new one enters,
 * so there is no blank frame and no layout jump. Focus moves to the new step's heading.
 */
export function StepContainer({ stepKey, direction, children }: { stepKey: string; direction: 1 | -1; children: ReactNode }) {
  const reduced = useReducedMotion();
  const regionRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Keep focus where it is on first load; after that, announce each new step by focusing its heading.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = requestAnimationFrame(() => {
      regionRef.current?.querySelector<HTMLElement>(`[data-step="${stepKey}"] [data-step-heading]`)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [stepKey]);

  return (
    <div ref={regionRef} className="relative min-h-0 flex-1 overflow-x-hidden">
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <m.div
          key={stepKey}
          data-step={stepKey}
          custom={direction}
          variants={reduced ? stepVariantsReduced : stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduced ? MOTION.stepReduced.transition : MOTION.step.transition}
          className="h-full w-full px-5 pb-6 pt-6"
        >
          {children}
        </m.div>
      </AnimatePresence>
    </div>
  );
}

/** Step heading that receives focus on transition (tabIndex -1: focusable by script, not in tab order). */
export function StepHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h1 id={id} data-step-heading tabIndex={-1} className="text-[1.75rem] font-semibold leading-tight tracking-tight focus:outline-none">
      {children}
    </h1>
  );
}
