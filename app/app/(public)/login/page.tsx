"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircle, Fish, Loader2, WifiOff } from "lucide-react";
import { useI18n } from "@/components/mobile/i18n-provider";
import { LangToggle } from "@/components/mobile/lang-toggle";
import { useOnline } from "@/components/mobile/use-online";
import { fetchAndCacheMe } from "@/lib/mobile/profile";
import { createClient } from "@/lib/supabase/client";
import { signInSchema } from "@/lib/validation/auth";

export default function MobileLoginPage() {
  const router = useRouter();
  const online = useOnline();
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!navigator.onLine) {
      setError(t("login.needSignal"));
      return;
    }
    const form = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) {
      setError(t("login.missing"));
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    if (authError || !data.user) {
      setPending(false);
      setError(authError?.message === "Invalid login credentials" ? t("login.wrong") : t("login.failed"));
      return;
    }

    try {
      const me = await fetchAndCacheMe(supabase, data.user.id);
      if (!me) {
        await supabase.auth.signOut({ scope: "local" });
        setPending(false);
        setError(t("login.noProfile"));
        return;
      }
      // Role-based redirect: admins use the dashboard, fishers and PICs the app.
      if (me.role === "admin") {
        window.location.assign("/admin");
        return;
      }
      router.replace("/app");
    } catch {
      setPending(false);
      setError(t("login.failed"));
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-lg bg-navy text-[#5EEAD4]">
            <Fish className="size-5" aria-hidden />
          </span>
          <span className="text-xl font-semibold tracking-tight">Huli Ko</span>
        </span>
        <LangToggle />
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col pt-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("login.title")}</h1>
          <p className="text-base text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        {!online && (
          <p className="mt-6 flex gap-2 rounded-xl bg-sand px-4 py-3 text-base text-sand-foreground" role="status">
            <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden />
            {t("login.needSignal")}
          </p>
        )}

        <div className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-base font-semibold">{t("login.email")}</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              required
              className="block h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-lg focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-base font-semibold">{t("login.password")}</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-lg focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-5 flex gap-2 rounded-xl border border-coral/30 bg-coral-soft px-4 py-3 text-base text-coral">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-10">
          <button
            type="submit"
            disabled={pending}
            className="flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
          >
            {pending && <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />}
            {pending ? t("login.submitting") : t("login.submit")}
          </button>
          <p className="text-center text-sm text-muted-foreground">{t("login.adminNote")}</p>
        </div>
      </form>
    </main>
  );
}
