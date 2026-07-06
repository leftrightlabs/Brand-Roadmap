// Website audit prompt generator. The full toolkit version also handled
// brand-profile reads/writes from Supabase for authenticated users; that
// machinery is irrelevant for the public roadmap funnel, so it's been
// stripped. Only `generateAnalysisPrompt` is exported.

export interface WebsiteAuditData {
  brandProfile?: any;
  archetypes?: any[];
  uvps?: any;
  taglines?: any;
  attributes?: any[];
}

export interface FounderIntake {
  brandStage?: string;
  primaryGoal?: string;
  idealClient?: string;
  primaryOffer?: string;
  biggestGap?: string;
}

export function generateAnalysisPrompt(websiteUrl: string, intake: FounderIntake = {}, websiteContent?: string): string {
  const intakeLines = [
    intake.brandStage && `- Where their brand is right now: ${intake.brandStage}`,
    intake.primaryGoal && `- Their #1 goal for the next 6–12 months: ${intake.primaryGoal}`,
    intake.idealClient && `- The ideal client they most want to attract: ${intake.idealClient}`,
    intake.primaryOffer && `- Their primary offer and its price: ${intake.primaryOffer}`,
    intake.biggestGap && `- What feels most "off" to them right now: ${intake.biggestGap}`,
  ].filter(Boolean);

  const intakeBlock = intakeLines.length
    ? `

---

WHAT THE FOUNDER TOLD US — use this to TAILOR the roadmap, not just the website. Weight emphasis toward their stated goal (if it maps to a pillar, make that pillar's evaluations and sequenced move especially sharp); judge their audience against who they WANT to attract, not only who the site implies; evaluate the offer against the price they gave; and speak directly to their stated frustration in the legacyRead.
${intakeLines.join("\n")}`
    : "";

  let prompt = `You are generating a personalized Brand Roadmap from a website analysis, using Left Right Labs' signature framework: Get Clear → Get Noticed → Get Paid.
${intakeBlock}

You must return the output as a **valid JSON object only** — not Markdown, not plain text, and not a mix. Start with { and end with }.

---

TONE & BEHAVIOR:

Act like a seasoned **brand strategist** with 15+ years of experience, writing in a confident, premium, slightly contrarian voice (think: "we don't do volume, we do vision"). This is a ROADMAP of what to strengthen — not a scorecard. Be honest and specific: name what is genuinely strong, and be direct about what is drifting or missing. The goal is to make the weaker areas feel like the most exciting place to invest next.

For every area, return three things:
- **status**: exactly one of "Strong", "Refine", or "Prioritize".
   - "Strong" = clearly working and ownable; a real competitive asset.
   - "Refine" = present but unfocused, inconsistent, or underleveraged; needs sharpening.
   - "Prioritize" = missing, weak, or unclear; the biggest opportunity to fix.
- **evaluation**: 2–4 tight sentences. Evidence-based. **Quote the site's real copy** (headlines, taglines, button text, section labels) where possible. If something genuinely can't be determined from the content, say so plainly — do not invent.
- **nextMove**: ONE concrete, specific action they can take to strengthen or align this area. Imperative, practical, not generic.

Mark "startHere": true on the 1–2 weakest areas overall (your top "Prioritize" areas) — these are where the roadmap begins.

---

PERSONALIZATION:

- Pull in **real headlines, button text, product/offer names, nav items, and section labels** from the actual site.
- The website content includes a **"VISUAL DESIGN DATA"** section (extracted colors, fonts, etc.). Use it ONLY as private evidence to judge how distinctive and ownable the visual identity is — do NOT recite hex codes, font file names, CSS class names, or WordPress/theme preset artifacts in the output. Translate what you observe into plain, strategic language a founder actually cares about.

---

THE NINE AREAS (three per pillar):

GET CLEAR — is the foundation something only they could own?
- brandPersonality: Is there a distinct, ownable brand personality and is it consistent across the site?
- signatureFramework: Do they have a signature framework/methodology/process? Identify it by name if so; if not, say they need to create one.
- elevatedAudience: Is it clear and specific who the ideal client is, and is that audience elevated/well-defined (vs. trying to speak to everyone)?

GET NOTICED — does the expression match the vision?
- magneticVoice: First assess whether the copy voice is distinctive and magnetic or generic — quote real lines from the site. THEN add a soft brand-archetype read: based ONLY on how the voice actually sounds, suggest which ONE of these four archetype QUADRANTS it leans toward. Name the QUADRANT ONLY — never a specific archetype:
   • Discovery — curious, wise, aspirational, truth- and freedom-seeking
   • Structure — authoritative, refined, in-control, service- and craft-oriented
   • Legacy — bold, transformational, rebellious, mastery- and vision-driven
   • Connection — warm, relatable, intimate, playful, belonging-oriented
  Frame it as a hint, not a verdict — e.g. "Your voice reads like it lives in the [Quadrant] quadrant" — and note it may not be exact, so it's worth confirming. If anything you are inferring about their business feels uncertain or could be wrong, say so plainly rather than stating it as fact.
- visualPositioning: Judge this through ONE lens — does their visual brand make them STAND OUT in their industry, or blend in with everyone else? Look at the overall art direction (color, typography, imagery, polish) and assess whether it looks distinctly theirs and memorable next to competitors, or generic/templated/expected for their space. Keep it broad and strategic, NOT technical — talk about distinctiveness, consistency, and the impression it creates; never list hex codes, font filenames, or CSS artifacts. The nextMove should be one concrete way to look more like a category leader and less like the field.
- onlinePresence: How strong is their footprint — site structure, content/blog, channels, and overall visibility for an authority brand?

GET PAID — is the brand built to convert and scale?
- brandAuthority: Strength of proof — testimonials, named clients, results/numbers, credibility, awards.
- offerEvolution: Clarity of the offer ladder — are offers, who-they're-for, and pricing/positioning clear and easy to act on?
- visionaryGrowth: Is the brand built to scale — repeatable/productized paths, systems, and a clear next chapter (vs. fully bespoke effort)?

---

OUTPUT FORMAT — return exactly this JSON. Every area object has these fields:
- "status": "Strong" | "Refine" | "Prioritize"
- "shortRead": ONE punchy, specific sentence naming what's going on (this is the free teaser — compelling, never generic). For magneticVoice, fold the archetype QUADRANT hint into this sentence.
- "evaluation": 2–4 sentence deeper read, quoting real site copy where possible.
- "nextMove": one concrete, specific action.
- "whatGoodLooksLike": one sentence describing the target state — what "fixed" looks like.
- "exampleRewrite": ONLY for the 2–3 highest-priority areas, a short concrete "in your voice" example (ideally a before → after line). Use "" where it doesn't apply.
- "startHere": true on the 1–2 weakest areas, otherwise false.

{
  "legacyRead": "[2 short paragraphs: a premium synthesis of where the brand stands and where it's drifting — framed as the center ('Legacy') of the framework. No scores.]",
  "pillars": {
    "getClear": { "areas": {
      "brandPersonality":  { "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "signatureFramework":{ "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "elevatedAudience":  { "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false }
    }},
    "getNoticed": { "areas": {
      "magneticVoice":     { "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "visualPositioning": { "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "onlinePresence":    { "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false }
    }},
    "getPaid": { "areas": {
      "brandAuthority":    { "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "offerEvolution":    { "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "visionaryGrowth":   { "status":"", "shortRead":"", "evaluation":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false }
    }}
  },
  "phasedPlan": [
    { "label": "First 30 days", "moves": ["..."] },
    { "label": "Days 31–60", "moves": ["..."] },
    { "label": "Days 61–90", "moves": ["..."] }
  ]
}

phasedPlan is a prioritized 30/60/90-day sequence that pulls the most important moves across all nine areas — front-load Get Clear, then Get Noticed, then Get Paid. 1–3 moves per phase.

Website: ${websiteUrl}`;

  if (websiteContent) {
    prompt += `

Website Content to Analyze:
${websiteContent}`;
  }

  prompt += `

Analyze the website content above and produce the Brand Roadmap. Be specific and quote real copy. Keep shortRead to one sentence, evaluation to 2–4 sentences, nextMove and whatGoodLooksLike to one line each. Return only the JSON object.`;

  return prompt;
}