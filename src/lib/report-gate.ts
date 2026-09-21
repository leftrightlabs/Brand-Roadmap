/**
 * The $97 paywall, enforced on the server.
 *
 * This used to live only in the report page: check-results returned every
 * generated field and the browser decided what to hide behind the lock. Anyone
 * who opened devtools, or fetched the endpoint directly, got the full plan for
 * free. Six-character short IDs are also short enough to be worth guessing.
 *
 * Now the route runs `redactForFree` on any report that has not been paid for,
 * so the locked copy never reaches the client at all. The report page keeps its
 * own lock UI, which is still what the reader sees, but it is presentation
 * rather than enforcement.
 *
 * `pickFreeSampleArea` and `moveTeaser` are exported so the page imports the
 * same implementations the route redacts with. If the two ever disagreed about
 * which area is free, the reader would see a truncated teaser presented as
 * their unlocked move.
 */

import { PILLARS, type AreaKey } from './roadmap-types';

/** Loose view of a stored area evaluation: what comes out of the DB is JSON. */
interface AreaEvalLike {
  status?: unknown;
  nextMove?: unknown;
  exampleRewrite?: unknown;
  startHere?: unknown;
  [key: string]: unknown;
}

interface PillarLike {
  areas?: Record<string, AreaEvalLike | undefined>;
}

/**
 * Only the two fields the free-area choice reads. Deliberately has no index
 * signature, so the strongly typed `RoadmapResults.pillars` the report page
 * holds is assignable to it; `AreaEvalLike` is not.
 */
interface AreaProbe {
  status?: unknown;
  startHere?: unknown;
}

type PillarsProbe = Record<string, { areas?: Record<string, AreaProbe | undefined> } | undefined>;

interface PhaseLike {
  label?: unknown;
  moves?: unknown;
  [key: string]: unknown;
}

export interface ResultsLike {
  pillars?: Record<string, PillarLike | undefined>;
  phasedPlan?: unknown;
  [key: string]: unknown;
}

/**
 * Curiosity-gap teaser: the opening of the paid next move, cut off mid-thought
 * at a word boundary. Enough to make the reader want it, not enough to act on.
 *
 * Idempotent in practice: re-running it on its own output returns that output,
 * which matters because the page also calls it when rendering a locked card.
 */
export function moveTeaser(text: unknown, max = 68): string {
  const firstSentence = (typeof text === 'string' ? text : '').trim().split(/(?<=[.!?])\s/)[0] || '';
  if (firstSentence.length <= max) return firstSentence;
  const cut = firstSentence.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).trim();
}

/**
 * The one area whose move is unlocked free, the "sample lesson".
 *
 * Always drawn from Get Clear, because that is where the Profile starts:
 * a flagged start-here area first, else the weakest one, else the first.
 */
export function pickFreeSampleArea(pillars?: PillarsProbe): AreaKey | null {
  const getClear = PILLARS.find((p) => p.key === 'getClear') ?? PILLARS[0];
  const areasOf = (key: string) => pillars?.[key]?.areas ?? {};

  const startHereKeys: AreaKey[] = [];
  PILLARS.forEach((p) => {
    p.areas.forEach((a) => {
      if (areasOf(p.key)[a]?.startHere) startHereKeys.push(a);
    });
  });

  const gcAreas = areasOf('getClear');
  const byStatus = (status: string) =>
    getClear.areas.find((a) => gcAreas[a]?.status === status);

  return (
    getClear.areas.find((a) => startHereKeys.includes(a) && a in gcAreas) ??
    byStatus('Prioritize') ??
    byStatus('Refine') ??
    getClear.areas[0] ??
    null
  );
}

/**
 * Strip every paid field from a completed report, leaving exactly what the free
 * view renders: the diagnosis, the status of all nine areas, one fully unlocked
 * move, a teaser of each remaining move, and the *shape* of the 30/60/90 plan.
 *
 * Phase moves become empty strings rather than being dropped, because the free
 * view draws one blurred placeholder bar per move and would otherwise miscount.
 */
export function redactForFree<T extends ResultsLike>(results: T): T {
  const freeArea = pickFreeSampleArea(results.pillars);

  const pillars: Record<string, PillarLike> = {};
  for (const pillar of PILLARS) {
    const source = results.pillars?.[pillar.key];
    if (!source) continue;
    const areas: Record<string, AreaEvalLike> = {};
    for (const areaKey of pillar.areas) {
      const evaluation = source.areas?.[areaKey];
      if (!evaluation) continue;
      if (areaKey === freeArea) {
        areas[areaKey] = evaluation;
        continue;
      }
      // Paid: the actionable move and the in-your-voice rewrite.
      const rest = { ...evaluation };
      delete rest.exampleRewrite;
      areas[areaKey] = { ...rest, nextMove: moveTeaser(evaluation.nextMove) };
    }
    pillars[pillar.key] = { ...source, areas };
  }

  const phasedPlan = Array.isArray(results.phasedPlan)
    ? (results.phasedPlan as PhaseLike[]).map((phase) => ({
        ...phase,
        moves: Array.isArray(phase?.moves) ? phase.moves.map(() => '') : [],
      }))
    : results.phasedPlan;

  return { ...results, pillars, phasedPlan };
}
