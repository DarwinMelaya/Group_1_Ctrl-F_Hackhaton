"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchAndCacheMe } from "@/lib/mobile/profile";
import { getDb, type Me } from "@/lib/offline/db";
import { createClient } from "@/lib/supabase/client";

type SessionState =
  | { status: "loading" }
  | { status: "ready"; me: Me; signedIn: boolean } // signedIn=false: offline with the phone's cached profile
  | { status: "signedOut" };

type SessionCtx = SessionState & { signOut: () => Promise<void>; refresh: () => Promise<void> };

const Ctx = createContext<SessionCtx | null>(null);

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

/**
 * Client-side guard for /app. Pages are static so they open offline; the check runs on the phone:
 * a Supabase session, or (offline) the profile cached at the last login. RLS still protects every row.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const load = useCallback(async () => {
    const db = getDb();
    const cached = await db.me.toCollection().first();
    const supabase = createClient();

    let userId: string | null = null;
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 4000);
      userId = data.session?.user.id ?? null;
    } catch {
      userId = null; // no signal or storage blocked: fall back to the cached profile
    }

    if (userId) {
      let me = cached?.id === userId ? cached : undefined;
      if (navigator.onLine) {
        try {
          me = (await fetchAndCacheMe(supabase, userId)) ?? undefined;
        } catch {
          // keep the cached copy
        }
      }
      if (me?.role === "admin") {
        window.location.replace("/admin");
        return;
      }
      if (me) {
        setState({ status: "ready", me, signedIn: true });
        return;
      }
    } else if (cached && !navigator.onLine) {
      setState({ status: "ready", me: cached, signedIn: false });
      return;
    }
    setState({ status: "signedOut" });
    router.replace("/app/login");
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // offline: the local session is still cleared below
    }
    // The outbox stays on the phone (never lose data); only the cached profile is removed.
    await getDb().me.clear();
    setState({ status: "signedOut" });
    router.replace("/app/login");
  }, [router]);

  return <Ctx.Provider value={{ ...state, signOut, refresh: load }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

/** For screens inside the shell, where the session is guaranteed to be ready. */
export function useMe() {
  const s = useSession();
  if (s.status !== "ready") throw new Error("useMe used before the session is ready");
  return { me: s.me, signedIn: s.signedIn };
}
