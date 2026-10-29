"use client";

import { m, useReducedMotion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** A group of large, single-choice cards (role="radiogroup") with arrow-key navigation. */
export function ChoiceGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const radios = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []);
    const i = radios.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = radios[(i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + radios.length) % radios.length];
    next.focus();
    next.click();
  }

  return (
    <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={cn("grid gap-3", className)}>
      {children}
    </div>
  );
}

type ChoiceCardProps = {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Roving tabindex: only the selected card (or the first one when none is selected) is in the tab order. */
  tabbable: boolean;
};

/** Press: scale 1 → 0.98 for 120ms. Selection: border and background color transition. No bounce. */
export function ChoiceCard({ selected, onSelect, title, description, icon: Icon, tabbable }: ChoiceCardProps) {
  const reduced = useReducedMotion();
  return (
    <m.button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabbable ? 0 : -1}
      onClick={onSelect}
      whileTap={reduced ? undefined : { scale: MOTION.press.scale }}
      transition={MOTION.press.transition}
      style={{ transitionDuration: `${MOTION.colorMs}ms` }}
      className={cn(
        "flex min-h-[72px] w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40",
        selected ? "border-teal bg-teal-soft" : "border-border bg-card hover:border-foreground/30",
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors",
            selected ? "bg-teal text-teal-foreground" : "bg-muted text-foreground",
          )}
          style={{ transitionDuration: `${MOTION.colorMs}ms` }}
        >
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold leading-snug">{title}</span>
        {description && <span className="mt-0.5 block text-base leading-relaxed text-muted-foreground">{description}</span>}
      </span>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-teal bg-teal text-teal-foreground" : "border-border",
        )}
        style={{ transitionDuration: `${MOTION.colorMs}ms` }}
        aria-hidden
      >
        {selected && <Check className="size-4" strokeWidth={3} />}
      </span>
    </m.button>
  );
}
