import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@/lib/db';
import { generateAnalysisPrompt, type FounderIntake } from '@/lib/website-audit-service';
import { PILLARS, normalizeStatus, type AreaKey, type AreaEval, type PillarKey, type RoadmapResults } from '@/lib/roadmap-types';

// Coerce the model's parsed JSON into the canonical RoadmapResults shape:
// validate statuses, guarantee all nine areas exist, and stringify prose.
function buildRoadmapResults(parsed: any): RoadmapResults {
  const str = (v: unknown, fallback: string) =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;

  const pillars = {} as RoadmapResults['pillars'];
  for (const pillar of PILLARS) {
    const srcAreas = parsed?.pillars?.[pillar.key]?.areas ?? {};
    const areas: Partial<Record<AreaKey, AreaEval>> = {};
    for (const areaKey of pillar.areas) {
      const a = srcAreas?.[areaKey] ?? {};
      areas[areaKey] = {
        status: normalizeStatus(a.status),
        shortRead: str(a.shortRead, str(a.evaluation, 'Data Temporarily Unavailable.')),
        evaluation: str(a.evaluation, 'Data Temporarily Unavailable.'),
        nextMove: str(a.nextMove, 'Review this area with your brand strategist.'),
        whatGoodLooksLike: str(a.whatGoodLooksLike, ''),
        exampleRewrite: str(a.exampleRewrite, ''),
        startHere: a.startHere === true,
      };
    }
    pillars[pillar.key as PillarKey] = { areas };
  }

  const phasedPlan: RoadmapResults['phasedPlan'] = Array.isArray(parsed?.phasedPlan)
    ? parsed.phasedPlan
        .filter((p: any) => p && typeof p.label === 'string')
        .slice(0, 3)
        .map((p: any) => ({
          label: String(p.label),
          moves: Array.isArray(p.moves) ? p.moves.filter((m: unknown) => typeof m === 'string' && m.trim()).slice(0, 3) : [],
        }))
    : [];

  return {
    legacyRead: str(parsed?.legacyRead, 'Your brand roadmap is ready below.'),
    roadmapNudge: str(parsed?.roadmapNudge, ''),
    pillars,
    phasedPlan,
  };
}

// Fallback used only when the model output can't be parsed as JSON at all.
function fallbackRoadmap(): RoadmapResults {
  const pillars = {} as RoadmapResults['pillars'];
  for (const pillar of PILLARS) {
    const areas: Partial<Record<AreaKey, AreaEval>> = {};
    for (const areaKey of pillar.areas) {
      areas[areaKey] = {
        status: 'Refine',
        shortRead: 'We hit a snag formatting this part of your roadmap.',
        evaluation: 'We hit a snag formatting this part of your roadmap. Please regenerate or contact support.',
        nextMove: 'Regenerate your roadmap, or reach out and we will rebuild it for you.',
      };
    }
    pillars[pillar.key as PillarKey] = { areas };
  }
  return {
    legacyRead: 'Your roadmap was generated but a formatting issue interrupted the final assembly. Please regenerate it or contact support.',
    roadmapNudge: '',
    pillars,
    phasedPlan: [],
  };
}

// Allow up to 300 seconds for this serverless function (website fetch + Anthropic API can take time)
// Railway: this `maxDuration` export is a no-op (no per-request timeout); kept
// for compatibility if this code is ever run on Vercel again.
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Generate a 6-character short ID
function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fetch website content
async function fetchWebsiteContent(url: string): Promise<string> {
  let result = '';
  const maxRetries = 2; // Reduced from 3 to speed up the process
  const timeout = 30000; // Reduced from 60 seconds to 30 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Try to fetch with https first, then fallback to http if needed
      const urlObj = new URL(url);
      const protocols = ['https:', 'http:'];
      let response = null;
      let lastError = null;

      for (const protocol of protocols) {
        try {
          urlObj.protocol = protocol;
          response = await fetch(urlObj.toString(), {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            redirect: 'follow',
            signal: controller.signal,
            keepalive: true,
            referrerPolicy: 'no-referrer'
          });
          if (response.ok) break;
        } catch (error) {
          lastError = error;

          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('Failed to fetch with both https and http');
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {

          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      const visualData = extractVisualData(html);
      result = extractTextFromHTML(html) + visualData;
      return result;
    } catch (error) {
      console.error(`[WEB-AUDIT] Error fetching website content (attempt ${attempt}):`, error);
      
      if (attempt === maxRetries) {
        return `Website analysis for ${url}. The website content could not be fully retrieved, but we will provide a basic brand assessment based on available information.`;
      }
      
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Reduced backoff delays
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  return `Website analysis for ${url}. The website content could not be fully retrieved, but we will provide a basic brand assessment based on available information.`;
}

// Extract visual design data (colors, fonts, CSS variables) from HTML
function extractVisualData(html: string): string {
  const sections: string[] = [];

  // 1. Extract CSS custom properties (--brand-color, --primary, etc.)
  const cssVarMatches = html.match(/--[\w-]+\s*:\s*[^;}{]+/g) || [];
  const uniqueVars = [...new Set(cssVarMatches.map(v => v.trim()))];
  if (uniqueVars.length > 0) {
    sections.push('CSS Custom Properties:\n' + uniqueVars.slice(0, 40).join('\n'));
  }

  // 2. Extract colors from inline styles and style blocks
  const colorPatterns = [
    /#(?:[0-9a-fA-F]{3}){1,2}\b/g,
    /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g,
    /hsl\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*\)/g,
  ];
  const allColors: string[] = [];
  for (const pattern of colorPatterns) {
    const matches = html.match(pattern) || [];
    allColors.push(...matches);
  }
  // Dedupe and filter out common non-brand colors
  const skipColors = new Set(['#fff', '#ffffff', '#000', '#000000', '#333', '#333333', '#666', '#666666', '#999', '#ccc', '#ddd', '#eee', '#f5f5f5', '#fafafa']);
  const uniqueColors = [...new Set(allColors.map(c => c.toLowerCase()))].filter(c => !skipColors.has(c));
  if (uniqueColors.length > 0) {
    sections.push('Colors found in CSS/styles:\n' + uniqueColors.slice(0, 30).join(', '));
  }

  // 3. Extract font families
  const fontMatches = html.match(/font-family\s*:\s*([^;}{]+)/gi) || [];
  const uniqueFonts = [...new Set(fontMatches.map(f => f.replace(/font-family\s*:\s*/i, '').trim()))];
  if (uniqueFonts.length > 0) {
    sections.push('Font families used:\n' + uniqueFonts.slice(0, 15).join('\n'));
  }

  // 4. Extract Google Fonts / Adobe Fonts links
  const fontLinkMatches = html.match(/<link[^>]*(?:fonts\.googleapis\.com|use\.typekit\.net|fonts\.adobe\.com)[^>]*>/gi) || [];
  if (fontLinkMatches.length > 0) {
    const fontUrls = fontLinkMatches.map(link => {
      const href = link.match(/href=["']([^"']+)["']/)?.[1] || link;
      return href;
    });
    sections.push('External font sources:\n' + fontUrls.join('\n'));
  }

  // 5. Extract meta theme-color
  const themeColor = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1];
  if (themeColor) {
    sections.push('Theme color: ' + themeColor);
  }

  // 6. Extract font-size and font-weight patterns from style blocks
  const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  const fontSizes: string[] = [];
  const fontWeights: string[] = [];
  for (const block of styleBlocks) {
    const sizes = block.match(/font-size\s*:\s*[^;}{]+/gi) || [];
    const weights = block.match(/font-weight\s*:\s*[^;}{]+/gi) || [];
    fontSizes.push(...sizes.map(s => s.trim()));
    fontWeights.push(...weights.map(w => w.trim()));
  }
  const uniqueSizes = [...new Set(fontSizes)];
  const uniqueWeights = [...new Set(fontWeights)];
  if (uniqueSizes.length > 0) {
    sections.push('Font sizes used:\n' + uniqueSizes.slice(0, 20).join(', '));
  }
  if (uniqueWeights.length > 0) {
    sections.push('Font weights used:\n' + uniqueWeights.slice(0, 10).join(', '));
  }

  // 7. Extract background colors and gradients
  const bgMatches = html.match(/background(?:-color)?\s*:\s*[^;}{]+/gi) || [];
  const gradients = bgMatches.filter(b => /gradient/i.test(b));
  const bgColors = bgMatches.filter(b => !/gradient/i.test(b) && !/url/i.test(b));
  if (gradients.length > 0) {
    sections.push('Gradients:\n' + [...new Set(gradients.map(g => g.trim()))].slice(0, 10).join('\n'));
  }
  if (bgColors.length > 0) {
    sections.push('Background colors:\n' + [...new Set(bgColors.map(b => b.trim()))].slice(0, 15).join(', '));
  }

  // 8. Extract logo/brand image references
  const logoMatches = html.match(/<img[^>]*(?:logo|brand|icon)[^>]*>/gi) || [];
  if (logoMatches.length > 0) {
    const logoInfo = logoMatches.map(img => {
      const alt = img.match(/alt=["']([^"']*)["']/i)?.[1] || '';
      const src = img.match(/src=["']([^"']*)["']/i)?.[1] || '';
      return `${alt} (${src})`.trim();
    });
    sections.push('Logo/brand images:\n' + logoInfo.slice(0, 5).join('\n'));
  }

  if (sections.length === 0) {
    return '';
  }

  return '\n\n---\nVISUAL DESIGN DATA (extracted from CSS and HTML):\n\n' + sections.join('\n\n');
}

// Extract readable text from HTML
function extractTextFromHTML(html: string): string {
  try {
    // Remove comments first
    let text = html.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove script, style, and other non-content elements
    text = text.replace(/<(script|style|iframe|noscript|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '');
    
    // Extract content from meta tags
    const metaDescription = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1] || '';
    const metaKeywords = text.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1] || '';
    
    // Remove all remaining HTML tags but preserve semantic structure
    text = text.replace(/<(h[1-6]|p|div|section|article|main|header|footer)[^>]*>/gi, '\n\n');
    text = text.replace(/<(br|hr)[^>]*\/?>/gi, '\n');
    text = text.replace(/<li[^>]*>/gi, '\n• ');
    text = text.replace(/<\/[^>]*>/g, '');
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode all HTML entities
    text = text.replace(/&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-fA-F]{1,6});/gi, (match, entity) => {
      const entities: { [key: string]: string } = {
        'amp': '&',
        'lt': '<',
        'gt': '>',
        'quot': '"',
        'apos': "'",
        'nbsp': ' ',
        'ndash': '-',
        'mdash': '-',
        'lsquo': "'",
        'rsquo': "'",
        'ldquo': '"',
        'rdquo': '"'
      };
      if (entity in entities) {
        return entities[entity];
      }
      if (entity.startsWith('#')) {
        const code = entity.startsWith('#x') ? 
          parseInt(entity.slice(2), 16) : 
          parseInt(entity.slice(1));
        return String.fromCharCode(code);
      }
      return match;
    });
    
    // Add meta information if available
    const metaInfo = [metaDescription, metaKeywords]
      .filter(Boolean)
      .join('\n');
    
    // Clean up whitespace and normalize text
    text = (metaInfo + '\n\n' + text)
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    // Limit to reasonable length
    if (text.length > 8000) {
      text = text.substring(0, 8000) + '... [Content truncated due to length]';
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from HTML:', error);
    return 'Error extracting website content.';
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[WEB-AUDIT] Missing ANTHROPIC_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const {
      name,
      email,
      websiteUrl,
      // Founder intake (the five tailoring questions)
      brandStage,
      primaryGoal,
      idealClient,
      primaryOffer,
      biggestGap,
    } = await request.json();

    const intake = { brandStage, primaryGoal, idealClient, primaryOffer, biggestGap };

    // Validate required fields
    if (!name || !email || !websiteUrl) {
      return NextResponse.json(
        { error: 'Name, email, and website URL are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid website URL format' },
        { status: 400 }
      );
    }

    // Note: we intentionally do NOT block repeat emails. Every submission
    // generates a fresh roadmap (a returning/paying customer should always get
    // a new one); a lead may have multiple shared_reports over time.

    // Find or create lead. Single upsert handles both paths cleanly.
    const upsertedLead = await sql<{ id: string }[]>`
      INSERT INTO website_audit_leads (
        name, email, website_url,
        business_goals, industry, target_audience,
        brand_personality, marketing_status, improvement_focus
      )
      VALUES (
        ${name}, ${email}, ${websiteUrl},
        ${primaryGoal || null}, ${null}, ${idealClient || null},
        ${primaryOffer || null}, ${brandStage || null}, ${biggestGap || null}
      )
      ON CONFLICT (email) DO UPDATE SET
        website_url        = EXCLUDED.website_url,
        business_goals     = EXCLUDED.business_goals,
        industry           = EXCLUDED.industry,
        target_audience    = EXCLUDED.target_audience,
        brand_personality  = EXCLUDED.brand_personality,
        marketing_status   = EXCLUDED.marketing_status,
        improvement_focus  = EXCLUDED.improvement_focus,
        updated_at         = NOW()
      RETURNING id
    `;

    const lead = upsertedLead[0];
    if (!lead) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve lead' },
        { status: 500 }
      );
    }

    // Generate unique short ID. We retry on collision via the table's UNIQUE
    // constraint instead of pre-checking — fewer round-trips, atomic insert.
    let shortId = '';
    let inserted = false;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day TTL

    for (let attempt = 0; attempt < 10 && !inserted; attempt++) {
      shortId = generateShortId();
      try {
        await sql`
          INSERT INTO shared_reports (short_id, lead_id, website_url, analysis_results, expires_at)
          VALUES (
            ${shortId},
            ${lead.id},
            ${websiteUrl},
            ${sql.json({ status: 'processing', progress: 0, currentStep: 0 })},
            ${expiresAt}
          )
        `;
        inserted = true;
      } catch (err: unknown) {
        // 23505 = unique_violation (short_id collision) — retry
        const pgError = err as { code?: string };
        if (pgError?.code === '23505') {
          continue;
        }
        console.error('[WEB-AUDIT] Error creating report:', err);
        return NextResponse.json(
          {
            error: 'Failed to create report',
            details: err instanceof Error ? err.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    if (!inserted) {
      return NextResponse.json(
        { error: 'Failed to generate unique report ID' },
        { status: 500 }
      );
    }

    console.log(`[WEB-AUDIT] Report record created successfully for shortId: ${shortId}`);

    // Kick off the analysis in the BACKGROUND and respond immediately with the
    // shortId. The client (analyzing page) polls /check-results for progress,
    // so we must NOT hold the HTTP request open for the full ~2-3 min analysis:
    // doing so blocks the client from polling and risks Railway's proxy timing
    // out the long-held request, leaving the page spinning forever. On Railway's
    // persistent Node server the promise keeps running after we respond (unlike
    // serverless, where the function would be frozen).
    void performAnalysisWithTimeout(shortId, websiteUrl, intake).catch(async (error: unknown) => {
      console.error(`[WEB-AUDIT] Analysis failed for ${shortId}:`, error);
      try {
        await sql`
          UPDATE shared_reports
          SET analysis_results = ${sql.json({
                status: 'failed',
                error: error instanceof Error ? error.message : 'Background processing failed',
                failedAt: new Date().toISOString(),
              })},
              updated_at = NOW()
          WHERE short_id = ${shortId}
        `;
      } catch (updateError: unknown) {
        console.error(`[WEB-AUDIT] Failed to update report status for ${shortId}:`, updateError);
      }
    });

    return NextResponse.json({
      success: true,
      shortId,
      message: 'Analysis started successfully',
    });

  } catch (error) {
    console.error('Start analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function performAnalysisWithTimeout(
  shortId: string,
  websiteUrl: string,
  intake: FounderIntake
): Promise<void> {
  const startTime = Date.now();
  const maxExecutionTime = 5 * 60 * 1000; // 5 minutes max for Vercel (increased for detailed analysis)
  
  try {


    // Step 1: Collecting brand data (0-15%)
    await updateProgress(shortId, 15, 0);

    // Check for timeout
    if (Date.now() - startTime > maxExecutionTime) {
      throw new Error('Analysis timeout - exceeded maximum execution time');
    }

    // Step 2: Analyzing brand identity (15-30%)
    // Fetch website content

    await updateProgress(shortId, 30, 1);
    
    let websiteContent = await fetchWebsiteContent(websiteUrl);

    
    // If content is too short or contains error messages, use a fallback
    if (websiteContent.length < 100 || websiteContent.includes('could not be retrieved')) {

      websiteContent = `Website analysis for ${websiteUrl}. The website content could not be fully retrieved, but we will provide a basic brand assessment based on available information.`;
    }

    // Step 3: Evaluating brand messaging (30-45%)
    // Generate the analysis prompt, tailored with the founder's intake answers.
    const analysisPrompt = generateAnalysisPrompt(websiteUrl, intake, websiteContent);

    await updateProgress(shortId, 45, 2);

    // Check for timeout
    if (Date.now() - startTime > maxExecutionTime) {
      throw new Error('Analysis timeout - exceeded maximum execution time');
    }

    // Step 4: Checking brand effectiveness (45-60%)
    // Start AI analysis
    await updateProgress(shortId, 52, 3);


    
    // Use a single, more efficient analysis call with shorter timeout
    let analysisResult;
    try {
      analysisResult = await Promise.race([
        anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 12000,
          // "low" effort roughly halves latency vs "medium" (~150s -> ~70-90s)
          // while keeping Sonnet's analysis quality. The output is a structured
          // JSON report, so depth comes mostly from the prompt, not deep thinking.
          output_config: { effort: "low" },
          system: "You are a brand strategy expert specializing in website audits. You MUST respond with a raw JSON object only — no markdown, no code fences, no backticks, no explanatory text before or after. Start your response with { and end with }.",
          messages: [
            {
              role: "user",
              content: analysisPrompt
            }
          ],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Anthropic API timeout')), 180000)
        )
      ]);
    } catch (apiError) {
      console.error(`[WEB-AUDIT] Anthropic API error for ${shortId}:`, apiError);
      throw new Error(`AI analysis failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
    }


    
    await updateProgress(shortId, 58, 3);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await updateProgress(shortId, 60, 3);
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check for timeout
    if (Date.now() - startTime > maxExecutionTime) {
      throw new Error('Analysis timeout - exceeded maximum execution time');
    }

    // Step 5: Generating strategic recommendations (60-80%)
    const stopReason = (analysisResult as any).stop_reason;
    console.log(`[WEB-AUDIT] Claude stop_reason: ${stopReason}, usage:`, (analysisResult as any).usage);

    const textBlock = (analysisResult as any).content.find((block: any) => block.type === 'text');
    const analysisText = textBlock?.text;

    if (!analysisText) {
      throw new Error('No analysis content received from AI');
    }

    console.log(`[WEB-AUDIT] Response length: ${analysisText.length} chars`);

    await updateProgress(shortId, 70, 4);


    
    // Parse the JSON response into the canonical RoadmapResults shape
    let analysisResults: RoadmapResults;
    try {
      // Strip markdown code fences if Claude wrapped the JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : analysisText;
      const parsedData = JSON.parse(cleanJson);

      await updateProgress(shortId, 75, 4);
      analysisResults = buildRoadmapResults(parsedData);
    } catch (parseError) {
      console.error('[WEB-AUDIT] Error parsing AI response as JSON:', parseError);
      console.error(`[WEB-AUDIT] stop_reason: ${stopReason}, response length: ${analysisText.length}`);
      console.error('[WEB-AUDIT] Raw response (first 500 chars):', analysisText.substring(0, 500));
      console.error('[WEB-AUDIT] Raw response (last 200 chars):', analysisText.substring(analysisText.length - 200));

      await updateProgress(shortId, 75, 4);
      analysisResults = fallbackRoadmap();
    }

    // Step 6: Finalizing your report (80-100%)
    await updateProgress(shortId, 85, 5);

    // Analysis completed - no artificial delays needed
    console.log(`[WEB-AUDIT] Analysis completed for ${shortId} in ${Date.now() - startTime}ms`);

    // Save final results with completed status
    await sql`
      UPDATE shared_reports
      SET analysis_results = ${sql.json({
            ...analysisResults,
            status: 'completed',
            progress: 100,
            currentStep: 5,
            generatedAt: new Date().toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)},
          updated_at = NOW()
      WHERE short_id = ${shortId}
    `;

    await new Promise(resolve => setTimeout(resolve, 200));

    console.log(`[WEB-AUDIT] Analysis completed for ${shortId} in ${Date.now() - startTime}ms`);

  } catch (error) {
    console.error(`[WEB-AUDIT] Analysis failed for ${shortId}:`, error);
    
    // Mark as failed
    await sql`
      UPDATE shared_reports
      SET analysis_results = ${sql.json({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString(),
          })},
          updated_at = NOW()
      WHERE short_id = ${shortId}
    `;
  }
}

async function updateProgress(shortId: string, progress: number, currentStep: number) {
  try {
    await sql`
      UPDATE shared_reports
      SET analysis_results = ${sql.json({
            status: 'processing',
            progress,
            currentStep,
            updatedAt: new Date().toISOString(),
          })},
          updated_at = NOW()
      WHERE short_id = ${shortId}
    `;
  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

// Helper functions for extracting specific content
function extractSection(text: string, startMarker: string, endMarker: string): string {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const endIndex = endMarker ? text.indexOf(endMarker, startIndex) : -1;
  if (endIndex === -1) return text.substring(startIndex);
  
  return text.substring(startIndex, endIndex);
} 