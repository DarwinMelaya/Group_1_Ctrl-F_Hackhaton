"use client";

import { useI18n } from "@/components/mobile/i18n-provider";
import { useMe } from "@/components/mobile/session-provider";
import { firstName } from "@/lib/mobile/profile";

// Screen 1 keeps Home to a greeting. The four big actions and the registration card come in Screen 2.
export default function HomePage() {
  const { me } = useMe();
  const { t } = useI18n();
  const place = [me.barangay, me.municipality].filter(Boolean).join(", ") || "Marinduque";

  return (
    <section className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{t("home.greeting", { name: firstName(me.fullName) })}</h1>
      <p className="text-base text-muted-foreground">{t(me.role === "pic" ? "home.rolePic" : "home.roleFisher", { place })}</p>
    </section>
  );
}
