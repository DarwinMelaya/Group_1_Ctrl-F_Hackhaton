"use client";

import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/components/mobile/i18n-provider";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./progress-bar";
import { StepContainer } from "./step-container";

type Action = { label: string; onClick: () => void; disabled?: boolean; loading?: boolean };

type OnboardingShellProps = {
  stepKey: string;
  direction: 1 | -1;
  /** 0..1 */
  progress: number;
  /** "Hakbang 2 ng 6" for screen readers */
  progressLabel: string;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  primary: Action;
  secondary?: Action;
  children: ReactNode;
};

/**
 * Header, progress bar and bottom actions stay mounted and never re-animate between steps;
 * only the content area transitions (StepContainer).
 */
export function OnboardingShell(props: OnboardingShellProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <ShellLayout {...props} />
    </LazyMotion>
  );
}

function ShellLayout({ stepKey, direction, progress, progressLabel, onBack, onSkip, skipLabel, primary, secondary, children }: OnboardingShellProps) {
  const { t } = useI18n();
  const keyboard = useKeyboardInset();
  const reduced = useReducedMotion();

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col bg-background">
      <header className="shrink-0 px-2 pt-[max(env(safe-area-inset-top),0.5rem)]">
        <div className="flex h-14 items-center justify-between">
          {/* Space is kept even when there is no back button, so the header never shifts. */}
          <button
            type="button"
            onClick={onBack}
            aria-label={t("onb.back")}
            className={cn(
              "flex size-14 items-center justify-center rounded-xl text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40",
              !onBack && "invisible",
            )}
            tabIndex={onBack ? 0 : -1}
            aria-hidden={!onBack}
          >
            <ArrowLeft className="size-6" aria-hidden />
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex min-h-14 items-center rounded-xl px-4 text-base font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
            >
              {skipLabel ?? t("onb.skip")}
            </button>
          )}
        </div>
        <div className="px-3 pb-1">
          <ProgressBar value={progress} label={progressLabel} />
        </div>
      </header>

      <StepContainer stepKey={stepKey} direction={direction}>
        {children}
      </StepContainer>

      <footer
        className="shrink-0 space-y-1 border-t bg-background px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3"
        // Lift the actions above the on-screen keyboard with a transform (no layout change).
        style={{ transform: keyboard ? `translateY(-${keyboard}px)` : undefined }}
      >
        <m.button
          type="button"
          onClick={primary.onClick}
          disabled={primary.disabled || primary.loading}
          whileTap={reduced || primary.disabled ? undefined : { scale: MOTION.press.scale }}
          transition={MOTION.press.transition}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground",
            "transition-opacity focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40",
            "disabled:opacity-40",
          )}
        >
          {primary.loading && <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />}
          {primary.label}
        </m.button>
        {/* Secondary action as a quiet text button; the slot is always reserved so the layout never jumps. */}
        <div className="flex min-h-14 items-center justify-center">
          {secondary && (
            <button
              type="button"
              onClick={secondary.onClick}
              disabled={secondary.disabled}
              className="min-h-14 rounded-xl px-4 text-base font-semibold text-teal hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 disabled:opacity-50"
            >
              {secondary.label}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

/** Height of the on-screen keyboard (0 when closed), from the Visual Viewport API. */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return inset;
}

/** Permission notes and errors: fade in while rising 8px over 200ms. Space is reserved by the caller. */
export function StepMessage({ show, tone = "info", children }: { show: boolean; tone?: "info" | "error"; children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <div aria-live={tone === "error" ? "assertive" : "polite"}>
      <AnimatePresence initial={false}>
        {show && (
          <m.p
            initial={{ opacity: 0, y: reduced ? 0 : MOTION.message.distance }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : MOTION.message.distance }}
            transition={MOTION.message.transition}
            role={tone === "error" ? "alert" : undefined}
            className={cn(
              "rounded-xl border px-4 py-3 text-base leading-relaxed",
              tone === "error" ? "border-coral/30 bg-coral-soft text-coral" : "border-border bg-sand text-sand-foreground",
            )}
          >
            {children}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}
