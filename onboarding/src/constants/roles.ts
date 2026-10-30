import type { Tone } from '@/theme';

import type { CommunityIconName } from './icons';

export const ROLE_IDS = [
  'fisherfolk',
  'aquaculture',
  'bantay-dagat',
  'tourist',
  'community',
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export interface Role {
  id: RoleId;
  title: string;
  description: string;
  // Used mid-sentence: "You're set up as {summaryLabel} in Gasan."
  summaryLabel: string;
  icon: CommunityIconName;
  tone: Tone;
}

export const ROLES: readonly Role[] = [
  {
    id: 'fisherfolk',
    title: 'Fisherfolk',
    description: 'You go out on a banca with nets, lines, or traps.',
    summaryLabel: 'fisherfolk',
    icon: 'sail-boat',
    tone: 'sea',
  },
  {
    id: 'aquaculture',
    title: 'Aquaculture / Seaweed Farmer',
    description: 'You tend seaweed lines, fish cages, or ponds.',
    summaryLabel: 'a seaweed and aquaculture farmer',
    icon: 'sprout',
    tone: 'mangrove',
  },
  {
    id: 'bantay-dagat',
    title: 'Bantay Dagat / Barangay Official',
    description: 'You patrol and keep watch over municipal waters.',
    summaryLabel: 'Bantay Dagat or a barangay official',
    icon: 'shield-account',
    tone: 'coral',
  },
  {
    id: 'tourist',
    title: 'Tourist / Visitor',
    description: "You're here for the beaches, islands, and reefs.",
    summaryLabel: 'a visitor',
    icon: 'beach',
    tone: 'reef',
  },
  {
    id: 'community',
    title: 'Community Member',
    description: 'You live near the coast and want to help care for it.',
    summaryLabel: 'a community member',
    icon: 'home-group',
    tone: 'sea',
  },
];

export function isRoleId(value: unknown): value is RoleId {
  return typeof value === 'string' && (ROLE_IDS as readonly string[]).includes(value);
}

export function getRole(id: RoleId): Role | undefined {
  return ROLES.find((role) => role.id === id);
}
