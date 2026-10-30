import type { Tone } from "@/theme";

import type { CommunityIconName } from "./icons";

export const ROLE_IDS = [
  "fisherfolk",
  "aquaculture",
  "bantay-dagat",
  "tourist",
  "community",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export interface Role {
  id: RoleId;
  title: string;
  titleFil: string;
  description: string;
  descriptionFil: string;
  // Used mid-sentence: "You're set up as {summaryLabel} in Gasan."
  summaryLabel: string;
  icon: CommunityIconName;
  tone: Tone;
}

export const ROLES: readonly Role[] = [
  {
    id: "fisherfolk",
    title: "Fisherfolk",
    titleFil: "Mangingisda",
    descriptionFil: "Lumalaot ka sakay ng bangka, may lambat, kawil o bubo.",
    description: "You go out on a banca with nets, lines, or traps.",
    summaryLabel: "fisherfolk",
    icon: "sail-boat",
    tone: "sea",
  },
  {
    id: "aquaculture",
    title: "Aquaculture / Seaweed Farmer",
    titleFil: "Magsasaka ng Seaweed / Aquaculture",
    descriptionFil: "Nag-aalaga ka ng seaweed, kulungan ng isda o palaisdaan.",
    description: "You tend seaweed lines, fish cages, or ponds.",
    summaryLabel: "a seaweed and aquaculture farmer",
    icon: "sprout",
    tone: "mangrove",
  },
  {
    id: "bantay-dagat",
    title: "Bantay Dagat / Barangay Official",
    titleFil: "Bantay Dagat / Opisyal ng Barangay",
    descriptionFil: "Nagbabantay ka sa karagatang sakop ng bayan.",
    description: "You patrol and keep watch over municipal waters.",
    summaryLabel: "Bantay Dagat or a barangay official",
    icon: "shield-account",
    tone: "coral",
  },
  {
    id: "tourist",
    title: "Tourist / Visitor",
    titleFil: "Turista / Bisita",
    descriptionFil: "Nandito ka para sa mga dalampasigan, isla at bahura.",
    description: "You're here for the beaches, islands, and reefs.",
    summaryLabel: "a visitor",
    icon: "beach",
    tone: "reef",
  },
  {
    id: "community",
    title: "Community Member",
    titleFil: "Miyembro ng Komunidad",
    descriptionFil:
      "Nakatira ka malapit sa dagat at gusto mong tumulong alagaan ito.",
    description: "You live near the coast and want to help care for it.",
    summaryLabel: "a community member",
    icon: "home-group",
    tone: "sea",
  },
];

export function isRoleId(value: unknown): value is RoleId {
  return (
    typeof value === "string" && (ROLE_IDS as readonly string[]).includes(value)
  );
}

export function getRole(id: RoleId): Role | undefined {
  return ROLES.find((role) => role.id === id);
}
