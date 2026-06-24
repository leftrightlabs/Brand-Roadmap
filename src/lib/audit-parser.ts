/**
 * Audit Parser Utility
 * 
 * Parses OpenAI's raw brand audit output into clean visual sections
 * for rendering in the report page. Handles various response formats
 * and provides fallbacks for missing sections.
 */

export interface ParsedAuditData {
  executiveSummary: string;
  sections: {
    brandMessaging: {
      insight: string;
      recommendation: string;
    };
    visualIdentity: {
      insight: string;
      recommendation: string;
    };
    userJourney: {
      insight: string;
      recommendation: string;
    };
    callsToAction: {
      insight: string;
      recommendation: string;
    };
    offerClarity: {
      insight: string;
      recommendation: string;
    };
    connectionTrust: {
      insight: string;
      recommendation: string;
    };
    contentOpportunities: {
      insight: string;
      recommendation: string;
    };
  };
  metadata: {
    parsedAt: string;
    version: string;
    sectionsFound: number;
  };
}

/**
 * Main parsing function that extracts structured data from OpenAI's raw response
 */
export function parseAuditResponse(rawResponse: string): ParsedAuditData {
  if (!rawResponse || typeof rawResponse !== 'string') {
    return createFallbackData('Invalid or empty response');
  }

  console.log('[AUDIT-PARSER] Starting to parse response:', rawResponse.substring(0, 200) + '...');

  // Try to parse as JSON first
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0]);
      console.log('[AUDIT-PARSER] Successfully parsed JSON response');
      
      // Validate and map the JSON data to our structure
      const parsedData: ParsedAuditData = {
        executiveSummary: jsonData.executiveSummary || 'Executive summary not available.',
        sections: {
          brandMessaging: { 
            insight: jsonData.sections?.brandMessaging?.insight || 'Data not available.',
            recommendation: jsonData.sections?.brandMessaging?.recommendation || 'Data not available.'
          },
          visualIdentity: { 
            insight: jsonData.sections?.visualIdentity?.insight || 'Data not available.',
            recommendation: jsonData.sections?.visualIdentity?.recommendation || 'Data not available.'
          },
          userJourney: { 
            insight: jsonData.sections?.userJourney?.insight || 'Data not available.',
            recommendation: jsonData.sections?.userJourney?.recommendation || 'Data not available.'
          },
          callsToAction: { 
            insight: jsonData.sections?.callsToAction?.insight || 'Data not available.',
            recommendation: jsonData.sections?.callsToAction?.recommendation || 'Data not available.'
          },
          offerClarity: { 
            insight: jsonData.sections?.offerClarity?.insight || 'Data not available.',
            recommendation: jsonData.sections?.offerClarity?.recommendation || 'Data not available.'
          },
          connectionTrust: { 
            insight: jsonData.sections?.connectionTrust?.insight || 'Data not available.',
            recommendation: jsonData.sections?.connectionTrust?.recommendation || 'Data not available.'
          },
          contentOpportunities: { 
            insight: jsonData.sections?.contentOpportunities?.insight || 'Data not available.',
            recommendation: jsonData.sections?.contentOpportunities?.recommendation || 'Data not available.'
          }
        },
        metadata: {
          parsedAt: new Date().toISOString(),
          version: '1.0',
          sectionsFound: Object.keys(jsonData.sections || {}).length
        }
      };
      
      return parsedData;
    }
  } catch (jsonError) {
    console.log('[AUDIT-PARSER] JSON parsing failed, falling back to text parsing:', jsonError);
  }

  // Fallback to text parsing for legacy format
  const parsedData: ParsedAuditData = {
    executiveSummary: '',
    sections: {
      brandMessaging: { insight: '', recommendation: '' },
      visualIdentity: { insight: '', recommendation: '' },
      userJourney: { insight: '', recommendation: '' },
      callsToAction: { insight: '', recommendation: '' },
      offerClarity: { insight: '', recommendation: '' },
      connectionTrust: { insight: '', recommendation: '' },
      contentOpportunities: { insight: '', recommendation: '' }
    },
    metadata: {
      parsedAt: new Date().toISOString(),
      version: '1.0',
      sectionsFound: 0
    }
  };

  try {
    // Extract Executive Summary
    parsedData.executiveSummary = extractExecutiveSummary(rawResponse);
    
    // Extract numbered sections (1-7)
    const sections = extractNumberedSections(rawResponse);
    
    // Map sections to our structure
    Object.entries(sections).forEach(([sectionKey, sectionData]) => {
      if (parsedData.sections[sectionKey as keyof typeof parsedData.sections]) {
        parsedData.sections[sectionKey as keyof typeof parsedData.sections] = sectionData;
        parsedData.metadata.sectionsFound++;
      }
    });

    console.log('[AUDIT-PARSER] Successfully parsed', parsedData.metadata.sectionsFound, 'sections using text parsing');
    
  } catch (error) {
    console.error('[AUDIT-PARSER] Error parsing response:', error);
    return createFallbackData('Parsing error occurred');
  }

  return parsedData;
}

/**
 * Extracts the Executive Summary section from the raw response
 */
function extractExecutiveSummary(rawResponse: string): string {
  // Try multiple patterns to find the executive summary
  const patterns = [
    /EXECUTIVE SUMMARY\s*\n([\s\S]*?)(?=\n\d+\.|STRENGTHS|WEAKNESSES|ACTIONABLE STEPS|NEXT STEPS|$)/i,
    /EXECUTIVE SUMMARY\s*:\s*([\s\S]*?)(?=\n\d+\.|STRENGTHS|WEAKNESSES|ACTIONABLE STEPS|NEXT STEPS|$)/i,
    /SUMMARY\s*\n([\s\S]*?)(?=\n\d+\.|STRENGTHS|WEAKNESSES|ACTIONABLE STEPS|NEXT STEPS|$)/i,
    /OVERVIEW\s*\n([\s\S]*?)(?=\n\d+\.|STRENGTHS|WEAKNESSES|ACTIONABLE STEPS|NEXT STEPS|$)/i
  ];

  for (const pattern of patterns) {
    const match = rawResponse.match(pattern);
    if (match && match[1]) {
      const summary = match[1].trim();
      if (summary.length > 10) {
        return cleanText(summary);
      }
    }
  }

  // Fallback: try to extract first paragraph if no clear executive summary
  const firstParagraph = rawResponse.split('\n\n')[0];
  if (firstParagraph && firstParagraph.length > 20) {
    return cleanText(firstParagraph);
  }

  return 'Executive summary not available in the analysis.';
}

/**
 * Extracts numbered sections (1-7) from the raw response
 */
function extractNumberedSections(rawResponse: string): Record<string, { insight: string; recommendation: string }> {
  const sections: Record<string, { insight: string; recommendation: string }> = {};
  
  console.log('[AUDIT-PARSER] Starting section extraction...');
  console.log('[AUDIT-PARSER] Raw response preview:', rawResponse.substring(0, 200));
  
  // Pattern to match numbered sections (1. BRAND MESSAGING, 2. VISUAL IDENTITY, etc.)
  // Fixed to properly capture content between numbered sections
  const sectionPattern = /\d+\.\s*([^:\n]+)(?::\s*)?\s*([\s\S]*?)(?=\n\d+\.|STRENGTHS|WEAKNESSES|ACTIONABLE STEPS|NEXT STEPS|$)/gi;
  
  let match;
  let matchCount = 0;
  while ((match = sectionPattern.exec(rawResponse)) !== null) {
    matchCount++;
    const sectionTitle = match[1].trim().toLowerCase();
    const sectionContent = match[2].trim();
    
    console.log(`[AUDIT-PARSER] Match ${matchCount}: Title="${sectionTitle}", Content length=${sectionContent.length}`);
    console.log(`[AUDIT-PARSER] Content preview: "${sectionContent.substring(0, 100)}..."`);
    
    // Only process sections with actual content
    if (sectionContent.trim().length > 0) {
      // Map section titles to our standardized keys
      const sectionKey = mapSectionTitle(sectionTitle);
      if (sectionKey) {
        const { insight, recommendation } = parseSectionContent(sectionContent);
        sections[sectionKey] = { insight, recommendation };
        console.log(`[AUDIT-PARSER] Mapped to ${sectionKey}: insight="${insight.substring(0, 50)}...", recommendation="${recommendation.substring(0, 50)}..."`);
      } else {
        console.log(`[AUDIT-PARSER] No mapping found for title: ${sectionTitle}`);
      }
    } else {
      console.log(`[AUDIT-PARSER] Skipping empty content for title: ${sectionTitle}`);
    }
  }
  
  console.log(`[AUDIT-PARSER] Found ${matchCount} matches, mapped ${Object.keys(sections).length} sections`);
  return sections;
}

/**
 * Maps section titles to standardized keys
 */
function mapSectionTitle(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('brand messaging') || titleLower.includes('messaging')) {
    return 'brandMessaging';
  }
  if (titleLower.includes('visual identity') || titleLower.includes('visual') || titleLower.includes('design')) {
    return 'visualIdentity';
  }
  if (titleLower.includes('user journey') || titleLower.includes('ux') || titleLower.includes('user experience')) {
    return 'userJourney';
  }
  if (titleLower.includes('calls-to-action') || titleLower.includes('ctas') || titleLower.includes('call to action')) {
    return 'callsToAction';
  }
  if (titleLower.includes('offer clarity') || titleLower.includes('offer') || titleLower.includes('value proposition')) {
    return 'offerClarity';
  }
  if (titleLower.includes('connection') || titleLower.includes('trust') || titleLower.includes('credibility')) {
    return 'connectionTrust';
  }
  if (titleLower.includes('content opportunities') || titleLower.includes('content') || titleLower.includes('opportunities')) {
    return 'contentOpportunities';
  }
  
  return null;
}

/**
 * Parses section content to extract insight and recommendation
 */
function parseSectionContent(content: string): { insight: string; recommendation: string } {
  console.log(`[AUDIT-PARSER] parseSectionContent called with: "${content.substring(0, 100)}..."`);
  
  // Try to find insight and recommendation patterns
  const insightPatterns = [
    /insight[s]?\s*:\s*([\s\S]*?)(?=recommendation|suggestion|next|$)/i,
    /analysis\s*:\s*([\s\S]*?)(?=recommendation|suggestion|next|$)/i,
    /evaluation\s*:\s*([\s\S]*?)(?=recommendation|suggestion|next|$)/i
  ];

  const recommendationPatterns = [
    /recommendation[s]?\s*:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
    /suggestion[s]?\s*:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
    /improvement[s]?\s*:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i
  ];

  let insight = '';
  let recommendation = '';

  // Extract insight
  for (const pattern of insightPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      insight = cleanText(match[1].trim());
      console.log(`[AUDIT-PARSER] Found insight with pattern: "${insight.substring(0, 50)}..."`);
      break;
    }
  }

  // Extract recommendation
  for (const pattern of recommendationPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      recommendation = cleanText(match[1].trim());
      console.log(`[AUDIT-PARSER] Found recommendation with pattern: "${recommendation.substring(0, 50)}..."`);
      break;
    }
  }

  // If no explicit labels found, try to split by "Recommendation:" keyword
  if (!insight && !recommendation) {
    const recommendationMatch = content.match(/recommendation\s*:\s*(.+)/i);
    if (recommendationMatch) {
      // Everything before "Recommendation:" is insight
      const parts = content.split(/recommendation\s*:\s*/i);
      if (parts.length >= 2) {
        insight = cleanText(parts[0]);
        recommendation = cleanText(parts[1]);
      }
    }
  }

  // If still no clear structure, try to find the first paragraph as insight
  if (!insight && !recommendation) {
    // Look for the first substantial paragraph (before any "Recommendation:" line)
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const insightLines = [];
    let foundRecommendation = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommendation:')) {
        foundRecommendation = true;
        break;
      }
      if (line.trim().length > 0) {
        insightLines.push(line.trim());
      }
    }
    
    if (insightLines.length > 0) {
      insight = cleanText(insightLines.join(' '));
      
      // Try to find recommendation after the insight
      if (foundRecommendation) {
        const recommendationMatch = content.match(/recommendation\s*:\s*(.+)/i);
        if (recommendationMatch) {
          recommendation = cleanText(recommendationMatch[1]);
        }
      }
    }
  }

  // If still no clear structure, split content intelligently
  if (!insight && !recommendation) {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 10);
    if (paragraphs.length >= 2) {
      insight = cleanText(paragraphs[0]);
      recommendation = cleanText(paragraphs[1]);
    } else if (paragraphs.length === 1) {
      // For single paragraph, treat it as insight and generate recommendation
      insight = cleanText(paragraphs[0]);
      recommendation = generateDefaultRecommendation();
    }
  }

  // Fallbacks
  if (!insight) {
    insight = 'Analysis content not clearly structured.';
  }
  if (!recommendation) {
    recommendation = generateDefaultRecommendation();
  }

  return { insight, recommendation };
}

/**
 * Cleans and normalizes text content
 */
function cleanText(text: string): string {
  return text
    .replace(/\n+/g, ' ') // Replace multiple newlines with single space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Generates a default recommendation when none is found
 */
function generateDefaultRecommendation(): string {
  return 'Consider reviewing this aspect of your brand strategy and implementing improvements based on industry best practices.';
}

/**
 * Creates fallback data when parsing fails
 */
function createFallbackData(reason: string): ParsedAuditData {
  console.warn('[AUDIT-PARSER] Creating fallback data due to:', reason);
  
  return {
    executiveSummary: 'Unable to parse executive summary from the analysis.',
    sections: {
      brandMessaging: {
        insight: 'Analysis data not available.',
        recommendation: 'Please contact support for a detailed analysis.'
      },
      visualIdentity: {
        insight: 'Analysis data not available.',
        recommendation: 'Please contact support for a detailed analysis.'
      },
      userJourney: {
        insight: 'Analysis data not available.',
        recommendation: 'Please contact support for a detailed analysis.'
      },
      callsToAction: {
        insight: 'Analysis data not available.',
        recommendation: 'Please contact support for a detailed analysis.'
      },
      offerClarity: {
        insight: 'Analysis data not available.',
        recommendation: 'Please contact support for a detailed analysis.'
      },
      connectionTrust: {
        insight: 'Analysis data not available.',
        recommendation: 'Please contact support for a detailed analysis.'
      },
      contentOpportunities: {
        insight: 'Analysis data not available.',
        recommendation: 'Please contact support for a detailed analysis.'
      }
    },
    metadata: {
      parsedAt: new Date().toISOString(),
      version: '1.0',
      sectionsFound: 0
    }
  };
} 