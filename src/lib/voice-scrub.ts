/**
 * Deterministic enforcement of the LRL banned-terms list.
 *
 * The generation prompt already forbids these, but the model ignores the rule
 * a few times per report (4 violations across 38 fields on NF6YRH, 2026-09-14).
 * Banned terms are a finite, mechanical list, so they are enforced in code
 * rather than argued about in the prompt. The prompt rule stays: it keeps the
 * model from *reaching* for these words, and this is the net underneath it.
 *
 * Quoted spans are never touched. The report quotes the client's own site copy
 * back to them, and that copy is theirs. "FDA audit" on a regulatory law firm's
 * site is their vocabulary, not ours.
 */

export type VoiceScrubHit = { from: string; to: string };

/** Match the replacement's case to the word it replaces. */
function matchCase(replacement: string, original: string): string {
  if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Split text into quoted and unquoted spans. Double and curly quotes are
 * straightforward. Single quotes only open after a boundary and only close
 * before one, so apostrophes inside a quote ("Don't panic, you've got backup")
 * do not terminate it early.
 */
function splitQuoted(text: string): { text: string; quoted: boolean }[] {
  const out: { text: string; quoted: boolean }[] = [];
  let buf = '';
  let i = 0;

  const closers: Record<string, string> = { '"': '"', '“': '”', '‘': '’' };

  while (i < text.length) {
    const ch = text[i];
    const prev = i === 0 ? ' ' : text[i - 1];
    const opensHere = /[\s(\[]/.test(prev);

    if (opensHere && (ch in closers)) {
      const end = text.indexOf(closers[ch], i + 1);
      if (end > i) {
        if (buf) { out.push({ text: buf, quoted: false }); buf = ''; }
        out.push({ text: text.slice(i, end + 1), quoted: true });
        i = end + 1;
        continue;
      }
    }

    if (opensHere && ch === "'") {
      // Close only on a quote followed by a boundary, so apostrophes survive.
      const end = findSingleClose(text, i + 1);
      if (end > i) {
        if (buf) { out.push({ text: buf, quoted: false }); buf = ''; }
        out.push({ text: text.slice(i, end + 1), quoted: true });
        i = end + 1;
        continue;
      }
    }

    buf += ch;
    i++;
  }
  if (buf) out.push({ text: buf, quoted: false });
  return out;
}

function findSingleClose(text: string, from: number): number {
  for (let j = from; j < text.length; j++) {
    if (text[j] !== "'") continue;
    const next = text[j + 1];
    if (next === undefined || /[\s,.;:!?)\]]/.test(next)) return j;
  }
  return -1;
}

/** Noun or verb? "your brand audit" is a noun; "Audit your homepage" is a verb. */
const NOUN_CUES = /(?:\b(?:a|an|the|this|that|these|those|our|your|their|its|my|his|her|full|free|brand|content|site|website|website's|site's|complete|quick|deep|initial|first|second|annual|thorough)\s+)$/i;

export function scrubVoice(input: string): { text: string; hits: VoiceScrubHit[] } {
  if (!input) return { text: input, hits: [] };
  const hits: VoiceScrubHit[] = [];
  const record = (from: string, to: string) => { hits.push({ from, to }); return to; };

  const scrubbed = splitQuoted(input).map((span) => {
    if (span.quoted) return span.text;
    let t = span.text;

    // Em dashes. Numeric ranges read as ranges; everything else is a clause break.
    t = t.replace(/(\d)\s*—\s*(\d)/g, (m, a, b) => record(m, `${a} to ${b}`));
    t = t.replace(/\s*—\s*/g, (m) => record(m.trim() || '—', ', '));

    // Intensifiers that carry no information. Deleting an adverb is always grammatical.
    t = t.replace(/^(genuinely|honestly),\s+/gi, (m) => record(m.trim(), ''));
    t = t.replace(/\s+\b(genuinely|honestly)\b/gi, (m, w) => record(w, ''));
    t = t.replace(/\b(genuinely|honestly)\s+/gi, (m, w) => record(w, ''));

    // Straight adjective swap. Swallow the article so "an iconic" does not
    // become "an distinct".
    t = t.replace(/\b(a|an)(\s+)iconic\b/gi, (m, art, gap) =>
      record(m, `${matchCase('a', art)}${gap}distinct`));
    t = t.replace(/\biconic\b/gi, (m) => record(m, matchCase('distinct', m)));

    // "whole" as an intensifier, in the two constructions worth catching.
    t = t.replace(/\b(a|an)\s+whole\s+(lot|new|different|other)\b/gi, (m, art, w) =>
      record(m, `${art} ${w}`));

    // Third-person slips back into the report mid-paragraph ("The site
    // references..."). Only sentence-initial, which is where it actually shows
    // up, and only for nouns that unambiguously mean the reader's own brand.
    t = t.replace(
      /(^|(?<=[.!?]\s))The\s+(site|website|homepage|brand)\b/g,
      (m, lead, noun) => record(m.trim(), `${lead}Your ${noun}`));

    // "audit": assessment for the noun, review for the verb.
    t = t.replace(/\baudit(s|ed|ing)?\b/gi, (m, suffix, offset: number) => {
      const before = t.slice(0, offset);
      const isNoun = NOUN_CUES.test(before) || suffix === 's' && NOUN_CUES.test(before);
      if (suffix === 'ing') return record(m, matchCase('reviewing', m));
      if (suffix === 'ed') return record(m, matchCase('reviewed', m));
      if (isNoun) return record(m, matchCase(suffix === 's' ? 'assessments' : 'assessment', m));
      return record(m, matchCase(suffix === 's' ? 'reviews' : 'review', m));
    });

    return t;
  }).join('');

  // Tidy up punctuation the em-dash rule can leave behind.
  const text = scrubbed
    .replace(/,\s*,/g, ',')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*([.;:!?])/g, '$1')
    .replace(/ {2,}/g, ' ')
    .trim();

  return { text, hits };
}
