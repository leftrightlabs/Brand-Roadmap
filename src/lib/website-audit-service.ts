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

ALWAYS LEAD WITH GET CLEAR. Clarity of brand foundation is the root cause: problems in how the brand is *expressed* (Get Noticed) or how it *converts and scales* (Get Paid) almost always trace back to a foundation that isn't fully clear. Frame the roadmap so the first and primary recommendation is a Get Clear move, and connect other issues back to Get Clear — regardless of which single area scores lowest.

For every area, return three things:
- **status**: exactly one of "Strong", "Refine", or "Prioritize".
   - "Strong" = clearly working and ownable; a real competitive asset.
   - "Refine" = present but unfocused, inconsistent, or underleveraged; needs sharpening.
   - "Prioritize" = missing, weak, or unclear; the biggest opportunity to fix.
- **shortRead**: 2–4 tight, evidence-based sentences — the core read of what's going on and why it matters. **Quote the site's real copy** (headlines, taglines, button text, section labels) where possible. If something genuinely can't be determined, say so plainly — do not invent. Do NOT give the fix here.
- **nextMove**: ONE concrete, specific action they can take to strengthen or align this area. Imperative, practical, not generic.

Mark "startHere": true to flag where the roadmap begins. ALWAYS include at least one GET CLEAR area as a start-here — the roadmap always begins by getting the foundation clear, even if a Get Noticed or Get Paid area scores lower. You may add one more start-here from another pillar only if it is genuinely urgent.

---

PERSONALIZATION:

- Pull in **real headlines, button text, product/offer names, nav items, and section labels** from the actual site.
- The website content includes a **"VISUAL DESIGN DATA"** section (extracted colors, fonts, etc.). Use it ONLY as private evidence to judge how distinctive and ownable the visual identity is — do NOT recite hex codes, font file names, CSS class names, or WordPress/theme preset artifacts in the output. Translate what you observe into plain, strategic language a founder actually cares about.

---

THE NINE AREAS (three per pillar):

GET CLEAR — is the foundation something only they could own?
- brandPersonality: Is there a distinct, ownable brand personality and is it consistent across the site?
- signatureFramework: Do they have a signature framework/methodology/process? Identify it by name if so; if not, say they need to create one. Customer-journey problems belong HERE: if the path from awareness to conversion is unclear, missing, or broken, treat it as a Get Clear foundation gap (they haven't clarified the journey/process), not a Get Noticed or Get Paid problem.
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
- "shortRead": 2–4 substantive sentences — the core read of what's going on AND why it matters for their brand. Specific, evidence-based, and genuinely valuable on its own. This is shown IDENTICALLY to free and paid readers, so make it strong. Name the problem/opportunity clearly and, where relevant, connect it back to Get Clear; but do NOT give the fix or the action — that lives in nextMove, which is paid. For magneticVoice, fold the archetype QUADRANT hint into this read.
- "nextMove": the concrete ACTION to take — 2 sentences. First sentence: exactly what to DO, imperative and specific (name the exact page, section, or asset). Second sentence: add genuine practical value — the key thing to get right, where to start, or a concrete "how" — never filler, and never a restatement of the problem or the payoff. Prefer a tight, useful two sentences; only drop to one if there is truly nothing worth adding.
- "whatGoodLooksLike": the PAYOFF once they act — the tangible result and the competitive edge it creates (what it unlocks with their ideal client, or why it makes them harder to replicate). Describe the outcome/benefit, NOT the fix and NOT the problem.
- "exampleRewrite": ONLY for the 2–3 highest-priority areas, a short concrete "in your voice" example (ideally a before → after line). Use "" where it doesn't apply.
- "startHere": true on the start-here area(s); ALWAYS true for at least one Get Clear area.

CRITICAL — shortRead (the problem/read), nextMove (the action), and whatGoodLooksLike (the payoff) must be genuinely DIFFERENT, not three rephrasings of the same point. Never reuse the same distinctive term across them (e.g. if shortRead hinges on the word "mechanism," do NOT repeat "mechanism" in the other two — say it another way). Vary the vocabulary; no field should echo another.

{
  "legacyRead": "[2 short paragraphs: a premium synthesis of where the brand stands and where it's drifting — framed as the center ('Legacy') of the framework. No scores.]",
  "roadmapNudge": "[ONE sentence that ALWAYS names Get Clear as where to start and why — the foundation has to be clear before anything else compounds. Even when a Get Noticed or Get Paid area scores lower, frame the starting point as getting clear first. Directional and high-level; NEVER a specific action, step, or the detailed move.]",
  "pillars": {
    "getClear": { "areas": {
      "brandPersonality":  { "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "signatureFramework":{ "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "elevatedAudience":  { "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false }
    }},
    "getNoticed": { "areas": {
      "magneticVoice":     { "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "visualPositioning": { "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "onlinePresence":    { "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false }
    }},
    "getPaid": { "areas": {
      "brandAuthority":    { "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "offerEvolution":    { "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false },
      "visionaryGrowth":   { "status":"", "shortRead":"", "nextMove":"", "whatGoodLooksLike":"", "exampleRewrite":"", "startHere":false }
    }}
  },
  "phasedPlan": [
    { "label": "First 30 days", "moves": ["..."] },
    { "label": "Days 31–60", "moves": ["..."] },
    { "label": "Days 61–90", "moves": ["..."] }
  ]
}

phasedPlan is a prioritized 30/60/90-day sequence. The FIRST phase (First 30 days) MUST begin with at least one Get Clear move as the anchor — never open the plan with a Get Noticed (e.g., visual rebrand) or Get Paid move before the Get Clear foundation is addressed. Then Get Noticed, then Get Paid. 1–3 moves per phase.

Website: ${websiteUrl}`;

  if (websiteContent) {
    prompt += `

Website Content to Analyze:
${websiteContent}`;
  }

  prompt += `

Analyze the website content above and produce the Brand Roadmap. Be specific and quote real copy. Keep shortRead to 2–4 substantive sentences (valuable but no fix), nextMove to two useful sentences, and whatGoodLooksLike to one line. Always lead with Get Clear. Return only the JSON object.`;

  return prompt;
}