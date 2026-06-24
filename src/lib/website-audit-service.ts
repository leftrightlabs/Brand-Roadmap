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

export function generateAnalysisPrompt(websiteUrl: string, userData: WebsiteAuditData, websiteContent?: string): string {
  let prompt = `You are generating a structured brand strategy assessment report from a website analysis.

You must return the output as a **valid JSON object only** — not Markdown, not plain text, and not a mix.

---

TONE & BEHAVIOR:

Act like a seasoned **brand strategist and UX expert** with 15+ years of experience. Your role is to analyze the live content of the provided website and create a highly personalized, strategic brand assessment that feels like a premium consulting report worth thousands of dollars.

Your insights and recommendations should be:
- **Highly specific to the content found on the site**
- **Strategic and actionable with clear implementation steps**
- **Quoted directly from the site's real copy** wherever applicable
- **Comprehensive and detailed** - each insight and recommendation should be 2-3 paragraphs long
- Focused on **clarity, trust, emotional connection, and conversion**
- **Evidence-based** with specific examples and rationale

---

CONTENT REQUIREMENTS:

Each insight and recommendation should be **comprehensive and detailed** (2-3 paragraphs, 150-300 words each):

**INSIGHTS should include:**
- Specific analysis of what's working or not working
- Direct quotes from the website with page context
- Detailed observations about messaging, design, or user experience
- Specific examples of good practices or areas needing improvement
- Context about how this affects brand perception and user behavior

**RECOMMENDATIONS should include:**
- Specific, actionable steps with clear implementation guidance
- Prioritized suggestions (high/medium/low impact)
- Expected outcomes and benefits
- Alternative approaches or considerations

---

PERSONALIZATION REQUIREMENTS:

- Pull in **real headlines, button text, product names, or section labels** found on the actual website
- Include **multiple quoted snippets of copy** in each insight section
- Mention actual **page names, section headers, or nav items** when relevant
- **IMPORTANT: The website content includes a "VISUAL DESIGN DATA" section** at the end with actual CSS colors, font families, font sizes, font weights, CSS custom properties, gradients, and external font sources extracted directly from the site's code. **Use this data** to provide specific, accurate analysis of the visual identity — reference actual hex colors, font names, and typographic hierarchy. Do not say colors or fonts are "not clearly defined" if they appear in this data.
- Reference **specific user journey elements** and conversion paths
- If something is missing from the site, write \`"Data Temporarily Unavailable"\` — do not make assumptions

---

OUTPUT FORMAT:

You must return a single valid JSON object in the exact structure below. Each insight and recommendation should be 2-3 detailed paragraphs.

{
  "executiveSummary": "[Comprehensive 2-3 paragraph summary covering key findings, overall brand health, and strategic recommendations]",
  "sections": {
    "brandMessaging": {
      "insight": "[Detailed 2-3 paragraph analysis of brand messaging, including specific quotes from headlines, taglines, and key messaging elements. Analyze tone, consistency, clarity, and emotional resonance. Reference specific pages and sections where messaging appears.]",
      "recommendation": "[Comprehensive 2-3 paragraph recommendation with specific steps to improve brand messaging. Include prioritized actions, expected outcomes, and alternative approaches. Reference specific content that should be revised or added.]"
    },
    "visualIdentity": {
      "insight": "[Detailed 2-3 paragraph analysis of visual identity including colors, fonts, imagery, layout consistency, and brand visual elements. Reference specific design choices, color usage, typography decisions, and visual hierarchy. Analyze how visuals support or detract from brand messaging.]",
      "recommendation": "[Comprehensive 2-3 paragraph recommendation for visual identity improvements. Include specific design suggestions, color palette recommendations, typography changes, and layout improvements. Provide implementation steps and expected brand impact.]"
    },
    "userJourney": {
      "insight": "[Detailed 2-3 paragraph analysis of user journey and navigation structure. Analyze menu organization, page flow, user experience, conversion paths, and friction points. Reference specific navigation elements, page transitions, and user interaction patterns.]",
      "recommendation": "[Comprehensive 2-3 paragraph recommendation for user journey optimization. Include specific navigation improvements, page flow suggestions, conversion path enhancements, and user experience fixes. Provide step-by-step implementation guidance.]"
    },
    "callsToAction": {
      "insight": "[Detailed 2-3 paragraph analysis of calls-to-action throughout the website. Analyze CTA placement, messaging, design, urgency, and effectiveness. Reference specific button text, link placement, and conversion elements. Evaluate CTA hierarchy and user motivation.]",
      "recommendation": "[Comprehensive 2-3 paragraph recommendation for CTA optimization. Include specific improvements to button text, placement, design, and conversion strategy. Provide A/B testing suggestions and implementation priorities.]"
    },
    "offerClarity": {
      "insight": "[Detailed 2-3 paragraph analysis of offer clarity and value proposition communication. Analyze how clearly products/services are presented, pricing transparency, benefit communication, and competitive differentiation. Reference specific product descriptions, pricing pages, and value statements.]",
      "recommendation": "[Comprehensive 2-3 paragraph recommendation for improving offer clarity. Include specific suggestions for value proposition enhancement, pricing presentation, benefit communication, and competitive positioning. Provide content and design recommendations.]"
    },
    "connectionTrust": {
      "insight": "[Detailed 2-3 paragraph analysis of trust-building elements and credibility indicators. Analyze testimonials, team bios, certifications, social proof, security indicators, and trust signals. Reference specific trust elements, their placement, and effectiveness.]",
      "recommendation": "[Comprehensive 2-3 paragraph recommendation for strengthening trust and credibility. Include specific suggestions for testimonials, team presentation, certifications, social proof, and trust signal placement. Provide implementation steps and content recommendations.]"
    },
    "contentOpportunities": {
      "insight": "[Detailed 2-3 paragraph analysis of content opportunities and gaps. Analyze existing content types, quality, engagement potential, and missing content that could support conversion. Reference specific content sections, blog posts, case studies, FAQs, and educational content.]",
      "recommendation": "[Comprehensive 2-3 paragraph recommendation for content development and optimization. Include specific content types to create, topics to cover, content strategy suggestions, and content marketing and SEO recommendations.]"
    }
  }
}

Website: ${websiteUrl}`;

  if (websiteContent) {
    prompt += `

Website Content to Analyze:
${websiteContent}`;
  }

  prompt += `

Analyze the website content provided above with the depth and detail of a premium brand strategy consultation. Focus on brand strategy, visual identity, user experience, and overall effectiveness. Provide comprehensive, actionable insights that demonstrate deep expertise and strategic thinking.`;

  return prompt;
} 