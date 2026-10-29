"use client";

// SHELL DEMO: two dummy steps to judge the motion (step transitions, progress bar, choice-card press,
// message fade). The real steps, state machine, resume and route guard replace this after review.

import { useState } from "react";
import { Languages } from "lucide-react";
import { ChoiceCard, ChoiceGroup } from "@/components/onboarding/choice-card";
import { OnboardingShell, StepMessage } from "@/components/onboarding/onboarding-shell";
import { PhotoSlot } from "@/components/onboarding/photo-slot";
import { StepHeading } from "@/components/onboarding/step-container";
import { useI18n } from "@/components/mobile/i18n-provider";
import type { Lang } from "@/lib/i18n";

const TOTAL_STEPS = 6;
type DemoScreen = "lang" | "intro-1";

export default function OnboardingPage() {
  const { t, lang, setLang } = useI18n();
  const [screen, setScreen] = useState<DemoScreen>("lang");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [chosen, setChosen] = useState<Lang | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const go = (next: DemoScreen, dir: 1 | -1) => {
    setDirection(dir);
    setScreen(next);
  };

  const step = screen === "lang" ? 1 : 2;

  return (
    <OnboardingShell
      stepKey={screen}
      direction={direction}
      progress={step / TOTAL_STEPS}
      progressLabel={t("onb.progress", { n: step, total: TOTAL_STEPS })}
      onBack={screen === "lang" ? undefined : () => go("lang", -1)}
      onSkip={screen === "intro-1" ? () => go("lang", -1) : undefined}
      primary={
        screen === "lang"
          ? { label: t("onb.next"), onClick: () => go("intro-1", 1), disabled: chosen === null }
          : { label: t("onb.demo.restart"), onClick: () => go("lang", -1) }
      }
      secondary={
        screen === "intro-1"
          ? { label: showMessage ? t("onb.demo.hideMessage") : t("onb.demo.showMessage"), onClick: () => setShowMessage((v) => !v) }
          : undefined
      }
    >
      {screen === "lang" ? (
        <div className="space-y-6">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-teal-soft text-teal">
            <Languages className="size-7" aria-hidden />
          </span>
          <div className="space-y-2">
            <StepHeading>{t("onb.lang.title")}</StepHeading>
            <p className="text-base leading-relaxed text-muted-foreground">{t("onb.lang.hint")}</p>
          </div>
          <ChoiceGroup label={t("onb.lang.title")}>
            {(["tl", "en"] as const).map((l, i) => (
              <ChoiceCard
                key={l}
                title={l === "tl" ? "Filipino" : "English"}
                selected={chosen === l}
                tabbable={chosen === l || (chosen === null && i === 0)}
                onSelect={() => {
                  setChosen(l);
                  if (l !== lang) setLang(l); // applies instantly
                }}
              />
            ))}
          </ChoiceGroup>
        </div>
      ) : (
        <div className="space-y-6">
          <PhotoSlot alt={t("onb.photo.boat")} />
          <div className="space-y-2">
            <StepHeading>{t("onb.intro1.title")}</StepHeading>
            <p className="text-lg leading-relaxed text-muted-foreground">{t("onb.intro1.body")}</p>
          </div>
          {/* Reserved height so the message never pushes content around. */}
          <div className="min-h-[5.5rem]">
            <StepMessage show={showMessage}>{t("onb.demo.message")}</StepMessage>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
