// On-device database (IndexedDB via Dexie). The phone's copy of everything the fisher needs offline,
// plus the outbox of logs waiting to sync. Schema matches the approved plan; bump the version to change it.

import Dexie, { type EntityTable } from "dexie";
import type { CatchStatus, ReefCondition, ReportType, UserRole, ZoneStatus, ZoneType } from "@/lib/types";

export type SyncState = "pending" | "syncing" | "synced" | "failed";

/** Fields every queued record carries. */
export type Outbox = {
  clientUuid: string;
  state: SyncState;
  attempts: number;
  /** epoch ms; the sync engine skips the item until then */
  nextAttemptAt: number;
  lastError: string | null;
  /** true = the server rejected the data; needs the user, not another retry */
  permanent: boolean;
  createdAt: number;
};

export type LocalCatch = Outbox & {
  fisherId: string;
  loggedBy: string;
  source: "app" | "pic";
  speciesId: string;
  weightKg: number;
  sizeCm: number | null;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  /** ISO time of the catch (defaults to when it was saved) */
  caughtAt: string;
  /** ISO time the phone saved it; sent as catches.recorded_at for the late-entry check */
  recordedAt: string;
  lateEntryReason: string | null;
  photoKey: string | null;
  /** Result of the on-device zone check at save time. A preview only; the server decides. */
  localCheck: { zoneName: string | null; zoneType: ZoneType | null; nearMeters: number | null };
  server?: { id: string; status: CatchStatus; flagReasons: string[]; qrToken: string; zoneStatus: ZoneStatus };
};

export type LocalReport = Outbox & {
  reporterId: string | null;
  type: ReportType;
  description: string;
  lat: number | null;
  lng: number | null;
  photoKey: string | null;
};

export type LocalSpot = Outbox & {
  userId: string;
  title: string;
  reefCondition: ReefCondition | null;
  lat: number | null;
  lng: number | null;
  photoKey: string | null;
};

export type LocalPhoto = { key: string; blob: Blob; thumbnail: boolean };

export type CachedZone = { id: string; name: string; type: ZoneType; reason: string | null; active: boolean; geojson: GeoJSON.Polygon };

export type CachedSpecies = { id: string; localName: string; englishName: string; minLegalSizeCm: number | null };

export type CachedFisher = { id: string; name: string; phone: string | null; municipality: string | null; barangay: string | null };

export type Me = {
  id: string;
  role: UserRole;
  fullName: string;
  municipality: string | null;
  barangay: string | null;
  phone: string | null;
  fishrNo: string | null;
  licenseExpiry: string | null;
  boats: { name: string; boatrNo: string | null; grossTons: number | null }[];
  cachedAt: number;
};

export type KeyValue = { key: string; value: unknown; updatedAt: number };

export class HuliKoDb extends Dexie {
  catches!: EntityTable<LocalCatch, "clientUuid">;
  reports!: EntityTable<LocalReport, "clientUuid">;
  spots!: EntityTable<LocalSpot, "clientUuid">;
  photos!: EntityTable<LocalPhoto, "key">;
  zones!: EntityTable<CachedZone, "id">;
  species!: EntityTable<CachedSpecies, "id">;
  fishers!: EntityTable<CachedFisher, "id">;
  me!: EntityTable<Me, "id">;
  kv!: EntityTable<KeyValue, "key">;

  constructor() {
    super("huliko");
    this.version(1).stores({
      catches: "clientUuid, state, nextAttemptAt, createdAt, fisherId",
      reports: "clientUuid, state, nextAttemptAt, createdAt",
      spots: "clientUuid, state, nextAttemptAt, createdAt",
      photos: "key",
      zones: "id, type, active",
      species: "id, localName",
      fishers: "id, name, phone",
      me: "id",
      kv: "key",
    });
  }
}

let instance: HuliKoDb | null = null;

/** Browser-only singleton. */
export function getDb() {
  if (typeof window === "undefined") throw new Error("The on-device database is only available in the browser.");
  instance ??= new HuliKoDb();
  return instance;
}

/** Items still waiting to reach the server, across all queues. */
export async function countUnsynced() {
  const db = getDb();
  const open = (s: SyncState) => s !== "synced";
  const [c, r, s] = await Promise.all([
    db.catches.filter((x) => open(x.state)).count(),
    db.reports.filter((x) => open(x.state)).count(),
    db.spots.filter((x) => open(x.state)).count(),
  ]);
  return c + r + s;
}
