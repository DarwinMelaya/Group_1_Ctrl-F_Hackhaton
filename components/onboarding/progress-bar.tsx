"use client";

import { m } from "framer-motion";
import { MOTION } from "@/lib/motion";

/** Thin, quiet progress bar. Fills with scaleX from the left (transform only). */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className="h-1 w-full overflow-hidden rounded-full bg-muted"
    >
      <m.div
        className="h-full w-full origin-left rounded-full bg-teal"
        initial={false}
        animate={{ scaleX: clamped }}
        transition={MOTION.progress.transition}
      />
    </div>
  );
}
