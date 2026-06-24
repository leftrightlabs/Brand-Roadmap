import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface ReportRow {
  analysis_results: Record<string, unknown>;
  website_url: string;
  created_at: string;
  expires_at: string;
  lead_name: string | null;
  lead_email: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;
  console.log('[WEB-AUDIT-PREVIEW] GET handler called for shortId:', shortId);

  try {
    const rows = await sql<ReportRow[]>`
      SELECT
        sr.analysis_results,
        sr.website_url,
        sr.created_at,
        sr.expires_at,
        l.name  AS lead_name,
        l.email AS lead_email
      FROM shared_reports sr
      LEFT JOIN website_audit_leads l ON l.id = sr.lead_id
      WHERE sr.short_id = ${shortId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      console.error('[WEB-AUDIT-PREVIEW] No report found for shortId:', shortId);
      return NextResponse.json(
        { error: 'Audit not found or has expired' },
        { status: 404 }
      );
    }

    const reportData = rows[0];

    if (new Date() > new Date(reportData.expires_at)) {
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 410 }
      );
    }

    // auditData is intentionally permissive — analysis_results is a JSONB
    // grab-bag whose shape depends on what the AI returned (rawResponse,
    // raw_analysis, structured fields, etc.). Downstream helpers do their
    // own narrowing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auditData: any = {
      ...reportData.analysis_results,
      website_url: reportData.website_url,
      created_at: reportData.created_at,
      lead_name: reportData.lead_name ?? undefined,
      lead_email: reportData.lead_email ?? undefined,
    };

    // Parse the audit response if it exists
    let parsedResults = null;
    const rawResponse = auditData.rawResponse || auditData.raw_analysis;
    if (rawResponse) {
      try {
        const { parseAuditResponse } = await import('@/lib/audit-parser');
        
        // Handle both string and object formats
        let rawAnalysisText: string;
        if (typeof rawResponse === 'string') {
          rawAnalysisText = rawResponse;
        } else if (rawResponse && typeof rawResponse === 'object' && 'detailed' in rawResponse) {
          rawAnalysisText = rawResponse.detailed || rawResponse.initial || '';
        } else {
          rawAnalysisText = '';
        }
        
        if (rawAnalysisText) {
          parsedResults = parseAuditResponse(rawAnalysisText);
        }
      } catch (parseError) {
        console.error('[WEB-AUDIT-PREVIEW] Error parsing audit response:', parseError);
      }
    }

    // If no parsed results, create fallback data from structured results
    if (!parsedResults) {
      console.log('[WEB-AUDIT-PREVIEW] No parsed results, creating fallback data');
      parsedResults = createFallbackFromStructuredData(auditData);
    }

    // Fetch OG image if available
    let ogImageUrl = null;
    try {
      const ogResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/og-image?url=${encodeURIComponent(auditData.website_url)}`);
      if (ogResponse.ok) {
        const ogData = await ogResponse.json();
        if (ogData.ogImage) {
          ogImageUrl = ogData.ogImage;
        }
      }
    } catch (error) {
      console.error('[WEB-AUDIT-PREVIEW] Error fetching OG image:', error);
    }

    // Generate HTML content
    const htmlContent = generateHTMLContent(auditData, parsedResults, ogImageUrl);

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      }
    });

  } catch (error) {
    console.error('[WEB-AUDIT-PREVIEW] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview generation failed' },
      { status: 500 }
    );
  }
}

function generateHTMLContent(auditData: any, parsedResults: any, ogImageUrl?: string | null): string {
  const domain = new URL(auditData.website_url).hostname.replace('www.', '');
  const reportDate = new Date(auditData.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Brand Strategy Assessment - ${domain}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: white;
          font-size: 14px;
        }
        
        .header {
          background: #112248;
          color: white;
          padding: 40px 0;
          text-align: center;
          margin-bottom: 40px;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          font-family: 'Georgia', serif;
        }
        
        .header h2 {
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 16px;
          opacity: 0.9;
        }
        
        .header p {
          font-size: 1rem;
          opacity: 0.8;
        }
        
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .metadata {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .metadata-item {
          text-align: center;
        }
        
        .metadata-label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .metadata-value {
          font-size: 1rem;
          color: #1f2937;
          font-weight: 600;
        }
        
        .executive-summary {
          background: #f8fafc;
          border: 2px solid #a7c140;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
        }
        
        .executive-summary-content {
          display: grid;
          grid-template-columns: ${ogImageUrl ? '1fr 2fr' : '1fr'};
          gap: 24px;
          align-items: start;
        }
        
        .executive-summary-image {
          text-align: center;
        }
        
        .executive-summary-image img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .executive-summary-text {
          display: flex;
          flex-direction: column;
        }
        
        .executive-summary h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #112248;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .executive-summary p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #374151;
        }
        
        .section {
          margin-bottom: 32px;
        }
        
        .section-header {
          background: #112248;
          color: white;
          padding: 20px 24px;
          border-radius: 12px 12px 0 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .section-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .section-content {
          background: white;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 12px 12px;
          overflow: hidden;
        }
        
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        
        .column {
          padding: 24px;
          border-right: 1px solid #e5e7eb;
        }
        
        .column:last-child {
          border-right: none;
        }
        
        .column-header {
          font-size: 1rem;
          font-weight: 600;
          color: #112248;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .column-content {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #374151;
        }
        
        .footer {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-top: 40px;
          text-align: center;
        }
        
        .disclaimer {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        
        .brand-footer {
          font-size: 0.875rem;
          color: #112248;
          font-weight: 600;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        @media print {
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="container">
          <h1>Elevate Your Brand Advantage</h1>
          <h2>Brand Strategy Assessment</h2>
          <p>Comprehensive analysis of ${auditData.website_url}</p>
        </div>
      </div>
      
      <div class="container">
        <div class="metadata">
          <div class="metadata-item">
            <div class="metadata-label">Website Analyzed</div>
            <div class="metadata-value">${auditData.website_url}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Report Generated</div>
            <div class="metadata-value">${reportDate}</div>
          </div>
          ${auditData.lead_name ? `
          <div class="metadata-item">
            <div class="metadata-label">Requested By</div>
            <div class="metadata-value">${auditData.lead_name}</div>
          </div>
          ` : ''}
        </div>
        
        <div class="executive-summary">
          <div class="executive-summary-content">
            ${ogImageUrl ? `
            <div class="executive-summary-image">
              <img src="${ogImageUrl}" alt="Website Screenshot" />
            </div>
            ` : ''}
            <div class="executive-summary-text">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; margin-right: 8px;">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                Executive Summary
              </h3>
              <p>${parsedResults.executiveSummary}</p>
            </div>
          </div>
        </div>
        
        <div style="page-break-before: always;"></div>
        
        ${generateSectionsHTML(parsedResults.sections)}
        
        <div class="footer">
          <div class="disclaimer">
            This report was generated using advanced AI analysis based on publicly available website content. While care is taken to provide accurate and relevant insights, this report may contain errors, omissions, or generalized recommendations. For tailored strategy or functionality recommendations, we recommend a human-led review with our expert brand strategists. Contact us to book your in-depth consultation.
          </div>
          <div class="brand-footer">
            © 2026 Brand Roadmap™ by Left Right Labs. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSectionsHTML(sections: any): string {
  const sectionConfigs = [
    { 
      key: 'brandMessaging', 
      title: 'Brand Messaging', 
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
    },
    { 
      key: 'visualIdentity', 
      title: 'Visual Identity', 
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><polygon points="2,2 22,2 13.5,15.5 2,2"></polygon></svg>'
    },
    { 
      key: 'userJourney', 
      title: 'User Journey', 
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>'
    },
    { 
      key: 'callsToAction', 
      title: 'Calls to Action', 
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16 10,8"></polygon></svg>'
    },
    { 
      key: 'offerClarity', 
      title: 'Offer Clarity', 
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"></polyline></svg>'
    },
    { 
      key: 'connectionTrust', 
      title: 'Connection & Trust', 
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'
    },
    { 
      key: 'contentOpportunities', 
      title: 'Content Opportunities', 
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    }
  ];

  return sectionConfigs.map((config, index) => {
    const sectionData = sections[config.key];
    if (!sectionData?.insight && !sectionData?.recommendation) {
      return '';
    }

    return `
      <div class="section ${index > 0 ? 'page-break' : ''}">
        <div class="section-header">
          <span style="display: flex; align-items: center;">${config.icon}</span>
          <h3>${config.title}</h3>
        </div>
        <div class="section-content">
          <div class="two-column">
            ${sectionData.insight ? `
            <div class="column">
              <div class="column-header">Insight</div>
              <div class="column-content">${sectionData.insight}</div>
            </div>
            ` : ''}
            ${sectionData.recommendation ? `
            <div class="column">
              <div class="column-header">Recommendation</div>
              <div class="column-content">${sectionData.recommendation}</div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function createFallbackFromStructuredData(results: any): any {
  return {
    executiveSummary: results.summary || 'Executive summary not available.',
    sections: {
      brandMessaging: {
        insight: results.brandMessaging?.evaluation || 'Analysis not available.',
        recommendation: results.brandMessaging?.recommendation || 'Recommendation not available.'
      },
      visualIdentity: {
        insight: results.visualIdentity?.description || 'Analysis not available.',
        recommendation: results.visualIdentity?.recommendation || 'Recommendation not available.'
      },
      userJourney: {
        insight: results.userJourney?.navigation || 'Analysis not available.',
        recommendation: results.userJourney?.recommendation || 'Recommendation not available.'
      },
      callsToAction: {
        insight: results.callsToAction?.evaluation || 'Analysis not available.',
        recommendation: results.callsToAction?.recommendation || 'Recommendation not available.'
      },
      offerClarity: {
        insight: results.offerClarity?.evaluation || 'Analysis not available.',
        recommendation: results.offerClarity?.recommendation || 'Recommendation not available.'
      },
      connectionTrust: {
        insight: results.connectionTrust?.elements?.join(', ') || 'Analysis not available.',
        recommendation: results.connectionTrust?.recommendation || 'Recommendation not available.'
      },
      contentOpportunities: {
        insight: results.contentOpportunities?.suggestion || 'Analysis not available.',
        recommendation: results.contentOpportunities?.placement || 'Recommendation not available.'
      }
    },
    metadata: {
      parsedAt: new Date().toISOString(),
      version: '1.0',
      sectionsFound: 7
    }
  };
}
