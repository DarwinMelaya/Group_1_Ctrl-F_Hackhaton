import type { CommunityIconName } from './icons';

// Mirrors the report_type enum in the Huli Ko database.
export const REPORT_TYPE_IDS = [
  'illegal_fishing',
  'destructive_fishing',
  'commercial_intrusion',
  'pollution',
  'habitat_damage',
  'other',
] as const;

export type ReportTypeId = (typeof REPORT_TYPE_IDS)[number];

export interface ReportType {
  id: ReportTypeId;
  title: string;
  example: string;
  icon: CommunityIconName;
}

export const REPORT_TYPES: readonly ReportType[] = [
  { id: 'illegal_fishing', title: 'Illegal fishing', example: 'Fishing inside a sanctuary or during a closed season', icon: 'fish-off' },
  { id: 'destructive_fishing', title: 'Dynamite or poison', example: 'Blast fishing, cyanide, fine-mesh nets', icon: 'alert-decagram-outline' },
  { id: 'commercial_intrusion', title: 'Commercial boat', example: 'A big vessel fishing in municipal waters', icon: 'ferry' },
  { id: 'pollution', title: 'Pollution or trash', example: 'Oil, sewage, garbage washing in', icon: 'delete-outline' },
  { id: 'habitat_damage', title: 'Reef or mangrove damage', example: 'Coral bleaching, anchors on coral, mangrove cutting', icon: 'tree-outline' },
  { id: 'other', title: 'Something else', example: 'Anything the MAO or Bantay Dagat should know', icon: 'dots-horizontal-circle-outline' },
];

export function isReportTypeId(v: unknown): v is ReportTypeId {
  return typeof v === 'string' && (REPORT_TYPE_IDS as readonly string[]).includes(v);
}

export function getReportType(id: ReportTypeId): ReportType {
  return REPORT_TYPES.find((t) => t.id === id) ?? REPORT_TYPES[REPORT_TYPES.length - 1]!;
}
