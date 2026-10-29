"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useContext, useState, type ReactNode } from "react";
import { countUnsynced } from "@/lib/offline/db";

// Screen 1: exposes the unsynced count and a `syncing` flag for the status chip.
// The sync engine (Screen 4) plugs into `requestSync` and drives `syncing`.

type SyncCtx = { unsynced: number; syncing: boolean; requestSync: () => void; setSyncing: (v: boolean) => void };

const Ctx = createContext<SyncCtx | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const unsynced = useLiveQuery(countUnsynced, [], 0);
  const [syncing, setSyncing] = useState(false);
  return <Ctx.Provider value={{ unsynced, syncing, setSyncing, requestSync: () => {} }}>{children}</Ctx.Provider>;
}

export function useSync() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSync must be used inside SyncProvider");
  return ctx;
}
