/**
 * Canonical types + render metadata for the Brand Roadmap report.
 *
 * The report is organized around LRL's Get Clear → Get Noticed → Get Paid
 * framework, evaluated across nine areas (three per pillar). Each area gets a
 * qualitative status (no numeric scores) plus an evaluation and one next move.
 *
 * Shared by: the AI prompt (src/lib/website-audit-service.ts), the result
 * mapping (start-analysis route), the report UI, the Venn, and the PDF routes.
 */

export type AreaStatus = 'Strong' | 'Refine' | 'Prioritize';

export interface AreaEval {
  status: AreaStatus;
  evaluation: string;
  nextMove: string;
  /** Set on the 1–2 weakest areas to surface a "Start here" flag. */
  startHere?: boolean;
}

export type PillarKey = 'getClear' | 'getNoticed' | 'getPaid';

export type AreaKey =
  | 'brandPersonality'
  | 'signatureFramework'
  | 'elevatedAudience'
  | 'magneticVoice'
  | 'visualPositioning'
  | 'onlinePresence'
  | 'brandAuthority'
  | 'offerEvolution'
  | 'visionaryGrowth';

/** The shape stored in shared_reports.analysis_results (plus the status envelope). */
export interface RoadmapResults {
  legacyRead: string;
  pillars: Record<PillarKey, { areas: Partial<Record<AreaKey, AreaEval>> }>;
  sequencedMoves: string[];
}

export const AREA_LABELS: Record<AreaKey, string> = {
  brandPersonality: 'Brand personality',
  signatureFramework: 'Signature framework',
  elevatedAudience: 'Elevated audience',
  magneticVoice: 'Magnetic voice',
  visualPositioning: 'Visual positioning',
  onlinePresence: 'Online presence',
  brandAuthority: 'Brand authority',
  offerEvolution: 'Offer evolution',
  visionaryGrowth: 'Visionary growth',
};

export interface PillarMeta {
  key: PillarKey;
  label: string;
  tagline: string;
  areas: AreaKey[];
  /** Optional embed URL (YouTube/Vimeo/Wistia) for this pillar's lesson video. */
  videoUrl?: string;
}

export const PILLARS: PillarMeta[] = [
  {
    key: 'getClear',
    label: 'Get Clear',
    tagline: 'Is the foundation something only you could own?',
    areas: ['brandPersonality', 'signatureFramework', 'elevatedAudience'],
    videoUrl: undefined, // TODO: paste the Get Clear lesson embed URL
  },
  {
    key: 'getNoticed',
    label: 'Get Noticed',
    tagline: 'Does the expression match the vision?',
    areas: ['magneticVoice', 'visualPositioning', 'onlinePresence'],
    videoUrl: undefined, // TODO: paste the Get Noticed lesson embed URL
  },
  {
    key: 'getPaid',
    label: 'Get Paid',
    tagline: 'Is the brand built to convert and scale?',
    areas: ['brandAuthority', 'offerEvolution', 'visionaryGrowth'],
    videoUrl: undefined, // TODO: paste the Get Paid lesson embed URL
  },
];

/**
 * Venn outer-ring segment order, clockwise from 12 o'clock. Get Clear owns the
 * top three segments, Get Noticed the right/lower-right, Get Paid the bottom-left.
 */
export const VENN_SEGMENTS: { area: AreaKey; angle: number }[] = [
  { area: 'signatureFramework', angle: 0 },
  { area: 'elevatedAudience', angle: 40 },
  { area: 'magneticVoice', angle: 80 },
  { area: 'visualPositioning', angle: 120 },
  { area: 'onlinePresence', angle: 160 },
  { area: 'brandAuthority', angle: 200 },
  { area: 'offerEvolution', angle: 240 },
  { area: 'visionaryGrowth', angle: 280 },
  { area: 'brandPersonality', angle: 320 },
];

export interface StatusStyle {
  /** Solid brand color for dots, bars, text. */
  color: string;
  /** Ring-segment fill opacity (warm/weaker = hotter so gaps glow). */
  fillOpacity: number;
  /** Filled segments out of 3 for the strength cue. */
  segments: number;
}

export const STATUS_STYLE: Record<AreaStatus, StatusStyle> = {
  Strong: { color: '#A7C140', fillOpacity: 0.14, segments: 3 },
  Refine: { color: '#E9BD6A', fillOpacity: 0.24, segments: 2 },
  Prioritize: { color: '#E08363', fillOpacity: 0.4, segments: 1 },
};

export const VALID_STATUSES: AreaStatus[] = ['Strong', 'Refine', 'Prioritize'];

/** Normalize a model-supplied status string to a valid enum value. */
export function normalizeStatus(raw: unknown): AreaStatus {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s.startsWith('strong')) return 'Strong';
  if (s.startsWith('prior')) return 'Prioritize';
  return 'Refine';
}
