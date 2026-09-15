/**
 * Canonical types + render metadata for the Brand Elevation Roadmap report.
 *
 * The report is organized around LRL's Get Clear → Get Noticed → Get Paid
 * framework, evaluated across nine areas (three per pillar). Each area gets a
 * qualitative status (no numeric scores) plus an evaluation and one next move.
 *
 * Shared by: the AI prompt (src/lib/website-audit-service.ts), the result
 * mapping (start-analysis route), the report UI, and the Venn.
 */

export type AreaStatus = 'Strong' | 'Refine' | 'Prioritize';

export interface AreaEval {
  status: AreaStatus;
  /** FREE — the core diagnostic read, shown identically to free and paid. */
  shortRead: string;
  /** FREE — one line describing the target state / payoff. */
  whatGoodLooksLike?: string;
  /** PAID — the specific action (the gated "next move" box). */
  nextMove: string;
  /** PAID — a concrete "in your voice" example, for priority areas. */
  exampleRewrite?: string;
  /** Set on the start-here area(s) to surface a "Start here" flag. */
  startHere?: boolean;
}

/** PAID — one phase of the 30/60/90-day action plan. */
export interface RoadmapPhase {
  label: string;
  moves: string[];
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
  /** FREE — one directional sentence: where to focus first (which pillar + why). */
  roadmapNudge: string;
  pillars: Record<PillarKey, { areas: Partial<Record<AreaKey, AreaEval>> }>;
  /** PAID — 30/60/90-day phased plan (replaces the flat sequencedMoves). */
  phasedPlan: RoadmapPhase[];
}

export const AREA_LABELS: Record<AreaKey, string> = {
  brandPersonality: 'Brand personality',
  signatureFramework: 'Signature framework',
  elevatedAudience: 'Elevated audience',
  magneticVoice: 'Magnetic voice',
  visualPositioning: 'Visual positioning',
  onlinePresence: 'Online presence',
  brandAuthority: 'Brand authority',
  offerEvolution: 'Offer positioning',
  visionaryGrowth: 'Visionary growth',
};

export interface PillarMeta {
  key: PillarKey;
  label: string;
  tagline: string;
  areas: AreaKey[];
  /** Optional embed URL (YouTube/Vimeo/Wistia) for this pillar's lesson video. */
  videoUrl?: string;
  /**
   * Optional background image for this pillar's band. Drop the file in
   * `public/images/` and set the path here, e.g. '/images/get-clear-bg.jpg'.
   * A dark/light scrim is applied automatically so text stays readable.
   */
  bgImage?: string;
}

export const PILLARS: PillarMeta[] = [
  {
    key: 'getClear',
    label: 'Get Clear',
    tagline: 'Is the foundation something only you could own?',
    areas: ['brandPersonality', 'signatureFramework', 'elevatedAudience'],
    // Vimeo unlisted video: player URL + `h=` privacy hash from the share link.
    videoUrl: 'https://player.vimeo.com/video/1213333895?h=d123a76518&title=0&byline=0&portrait=0',
    bgImage: '/images/Architecture-Bird.webp',
  },
  {
    key: 'getNoticed',
    label: 'Get Noticed',
    tagline: 'Does the expression match the vision?',
    areas: ['magneticVoice', 'visualPositioning', 'onlinePresence'],
    videoUrl: 'https://player.vimeo.com/video/1213333893?h=bcb88ea84f&title=0&byline=0&portrait=0',
    bgImage: '/images/people-networking.webp',
  },
  {
    key: 'getPaid',
    label: 'Get Paid',
    tagline: 'Is the brand built to convert and scale?',
    areas: ['brandAuthority', 'offerEvolution', 'visionaryGrowth'],
    videoUrl: 'https://player.vimeo.com/video/1213333892?h=4070ac74c4&title=0&byline=0&portrait=0',
    bgImage: '/images/blurred-hotel.webp',
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
  /** Identifying hue: legend dot, ring rim, strength bar, and the strip across
   *  the top of each lever card. It has to read on navy *and* on white. */
  color: string;
  /** Solid ring fill on navy. A finished colour rather than an alpha blend:
   *  the old low-opacity warm fills averaged with the navy behind them and
   *  came out mud (Refine rendered as olive-grey, Prioritize as plum). */
  ring: string;
  /** Ring fill on hover. Lifted, but still dark enough for white labels. */
  ringHover: string;
  /** Filled segments out of 3 for the strength cue. */
  segments: number;
}

export const STATUS_STYLE: Record<AreaStatus, StatusStyle> = {
  // Lime is the brand accent; terracotta is the one warm alert, so the eye
  // lands on what needs attention. Refine sits on a cool slate rather than
  // gold: gold is retired in [CANON] Brand, and five gold segments shouted
  // louder than the two that actually needed the reader.
  Strong: { color: '#A7C140', ring: '#47632A', ringHover: '#5C8038', segments: 3 }, // lime
  Refine: { color: '#6B7BA0', ring: '#39456A', ringHover: '#4C5B85', segments: 2 }, // slate
  Prioritize: { color: '#E0552E', ring: '#96401F', ringHover: '#B85229', segments: 1 }, // terracotta
};

export const VALID_STATUSES: AreaStatus[] = ['Strong', 'Refine', 'Prioritize'];

/** Normalize a model-supplied status string to a valid enum value. */
export function normalizeStatus(raw: unknown): AreaStatus {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s.startsWith('strong')) return 'Strong';
  if (s.startsWith('prior')) return 'Prioritize';
  return 'Refine';
}
