import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;
  console.log('[WEB-AUDIT-PDF] GET handler called for shortId:', shortId);
  
  try {
    // Create Supabase client
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the audit results from the shared_reports table
    const { data: reportData, error: fetchError } = await supabaseServer
      .from('shared_reports')
      .select(`
        *,
        website_audit_leads (
          name,
          email,
          website_url
        )
      `)
      .eq('short_id', shortId)
      .single();

    if (fetchError || !reportData) {
      console.error('[WEB-AUDIT-PDF] Error fetching report data:', fetchError);
      return NextResponse.json(
        { error: 'Audit not found or has expired' },
        { status: 404 }
      );
    }

    // Check if report has expired
    const expiresAt = new Date(reportData.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 410 }
      );
    }

    const auditData = {
      ...reportData.analysis_results,
      website_url: reportData.website_url,
      created_at: reportData.created_at,
      lead_name: reportData.website_audit_leads?.name,
      lead_email: reportData.website_audit_leads?.email,
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
        console.error('[WEB-AUDIT-PDF] Error parsing audit response:', parseError);
      }
    }

    // If no parsed results, create fallback data from structured results
    if (!parsedResults) {
      console.log('[WEB-AUDIT-PDF] No parsed results, creating fallback data');
      parsedResults = createFallbackFromStructuredData(auditData);
    }

    // Try to fetch OG image directly from the website
    let ogImageUrl = null;
    try {
      console.log('[WEB-AUDIT-PDF] Attempting to fetch OG image directly from website...');
      
      // Try to fetch the website HTML and extract OG image
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const websiteResponse = await fetch(auditData.website_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Brand-Advantage-Bot/1.0)'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (websiteResponse.ok) {
        const html = await websiteResponse.text();
        
        // Extract OG image from HTML
        const ogImageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i);
        if (ogImageMatch && ogImageMatch[1]) {
          ogImageUrl = ogImageMatch[1];
          console.log('[WEB-AUDIT-PDF] Found OG image:', ogImageUrl);
        } else {
          console.log('[WEB-AUDIT-PDF] No OG image found in HTML');
        }
      }
    } catch (error) {
      console.error('[WEB-AUDIT-PDF] Error fetching OG image directly:', error);
      
      // Fallback: Try the internal API if direct fetch fails
      try {
        console.log('[WEB-AUDIT-PDF] Trying internal OG API as fallback...');
        const ogResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/og-image?url=${encodeURIComponent(auditData.website_url)}`);
        if (ogResponse.ok) {
          const ogData = await ogResponse.json();
          if (ogData.ogImage) {
            ogImageUrl = ogData.ogImage;
            console.log('[WEB-AUDIT-PDF] Got OG image from internal API:', ogImageUrl);
          }
        }
      } catch (fallbackError) {
        console.error('[WEB-AUDIT-PDF] Internal OG API also failed:', fallbackError);
      }
    }

    // Generate PDF using React PDF Renderer (professional styling)
    console.log('[WEB-AUDIT-PDF] Generating professional PDF with React PDF Renderer...');
    
    try {
      // Import React PDF components - using the BEAUTIFUL PDF component
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const React = await import('react');
      const WebsiteAuditPDF = (await import('@/components/WebsiteAuditPDF')).default;
      
      // Transform data to match the beautiful PDF interface
      const pdfData = {
        websiteUrl: auditData.website_url,
        auditSummary: parsedResults?.executiveSummary || 'Comprehensive brand strategy assessment completed.',
        ogImageUrl: ogImageUrl, // Add the fetched OG image
        requestedBy: auditData.lead_name || 'Brand Analysis', // Use actual user name
      };
      
      console.log('[WEB-AUDIT-PDF] PDF data prepared with OG image:', ogImageUrl ? 'YES' : 'NO');
      console.log('[WEB-AUDIT-PDF] PDF requested by:', auditData.lead_name || 'Unknown');
      if (ogImageUrl) {
        console.log('[WEB-AUDIT-PDF] OG image URL:', ogImageUrl);
      }
      
      const finalPdfData = {
        ...pdfData,
        sections: {
          brandMessaging: {
            insight: parsedResults?.sections?.brandMessaging?.insight || 'Brand messaging analysis completed.',
            recommendation: parsedResults?.sections?.brandMessaging?.recommendation || 'Consider enhancing messaging clarity.'
          },
          visualIdentity: {
            insight: parsedResults?.sections?.visualIdentity?.insight || 'Visual identity assessment completed.',
            recommendation: parsedResults?.sections?.visualIdentity?.recommendation || 'Consider visual consistency improvements.'
          },
          userJourney: {
            insight: parsedResults?.sections?.userJourney?.insight,
            recommendation: parsedResults?.sections?.userJourney?.recommendation
          },
          callsToAction: {
            insight: parsedResults?.sections?.callsToAction?.insight,
            recommendation: parsedResults?.sections?.callsToAction?.recommendation
          },
          offerClarity: {
            insight: parsedResults?.sections?.offerClarity?.insight,
            recommendation: parsedResults?.sections?.offerClarity?.recommendation
          },
          connectionTrust: {
            insight: parsedResults?.sections?.connectionTrust?.insight,
            recommendation: parsedResults?.sections?.connectionTrust?.recommendation
          },
          contentOpportunities: {
            insight: parsedResults?.sections?.contentOpportunities?.insight,
            recommendation: parsedResults?.sections?.contentOpportunities?.recommendation
          }
        }
      };
      
      // Generate PDF buffer using React PDF Renderer with the BEAUTIFUL component
      const pdfBuffer = await renderToBuffer(
        React.createElement(WebsiteAuditPDF, { data: finalPdfData }) as any
      );
      
      console.log('[WEB-AUDIT-PDF] React PDF generation successful, size:', pdfBuffer.length);
      
      // Create filename with domain
      const domain = new URL(auditData.website_url).hostname.replace('www.', '');
      const filename = `Brand-Strategy-Assessment-${domain}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } catch (pdfError) {
      console.error('[WEB-AUDIT-PDF] React PDF generation error:', pdfError);
      console.error('[WEB-AUDIT-PDF] Error stack:', pdfError instanceof Error ? pdfError.stack : 'No stack trace');
      
      // Fallback to simple jsPDF if React PDF fails
      console.log('[WEB-AUDIT-PDF] React PDF failed, falling back to simple jsPDF...');
      const fallbackPdf = generateSimplePDF(auditData, parsedResults);
      
      const domain = new URL(auditData.website_url).hostname.replace('www.', '');
      const filename = `Brand-Strategy-Assessment-${domain}.pdf`;

      return new NextResponse(new Uint8Array(fallbackPdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

  } catch (error) {
    console.error('[WEB-AUDIT-PDF] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF generation failed' },
      { status: 500 }
    );
  }
}



function generateBeautifulPDF(auditData: any, parsedResults: any): Buffer {
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();
  
  const domain = new URL(auditData.website_url).hostname.replace('www.', '');
  const reportDate = new Date(auditData.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Set up colors - using RGB values (0-255) — LRL Brand 2025 palette
  const navy = [17, 34, 72];     // #112248
  const lime = [167, 193, 64];   // #a7c140
  // Legacy aliases (kept so downstream code that references purple/gold still compiles; both map to brand-correct colors)
  const purple = navy;           // magenta retired → collapses to Navy
  const gold = lime;             // gold retired → Lime is the new accent
  const tan = [234, 225, 205];   // #eae1cd (warm neutral, kept)

  // Header with proper color values
  doc.setFillColor(17, 34, 72); // Navy blue
  doc.rect(0, 0, 210, 60, 'F');
  
  // Lime accent bar
  doc.setFillColor(167, 193, 64); // Lime
  doc.rect(0, 0, 210, 8, 'F');
  
  // Header text with better positioning and styling
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Elevate Your Brand Advantage', 105, 35, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text('Brand Strategy Assessment', 105, 45, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255, 0.9);
  doc.text(`Comprehensive analysis of ${auditData.website_url}`, 105, 55, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Metadata section with better styling
  let y = 80;
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.roundedRect(15, y - 10, 180, 25, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y - 10, 180, 25, 3, 3, 'S');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Website Analyzed:', 25, y);
  doc.text('Report Generated:', 85, y);
  doc.text('Requested By:', 145, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(9);
  doc.text(auditData.website_url, 25, y + 8);
  doc.text(reportDate, 85, y + 8);
  doc.text(auditData.lead_name || 'N/A', 145, y + 8);

  // Executive Summary with enhanced styling
  y += 40;
  doc.setFillColor(254, 247, 255); // Light tinted background
  doc.setDrawColor(17, 34, 72); // Navy
  doc.setLineWidth(2);
  doc.roundedRect(15, y - 10, 180, 40, 6, 6, 'FD');
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 34, 72); // Navy blue
  doc.text('Executive Summary', 25, y);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  const summaryText = parsedResults.executiveSummary || 'Executive summary not available.';
  const summaryLines = doc.splitTextToSize(summaryText, 160);
  doc.text(summaryLines, 25, y + 15);

  // Sections with enhanced styling
  y += 60;
  const sectionConfigs = [
    { key: 'brandMessaging', title: 'Brand Messaging', icon: '💬' },
    { key: 'visualIdentity', title: 'Visual Identity', icon: '🎨' },
    { key: 'userJourney', title: 'User Journey', icon: '🛤️' },
    { key: 'callsToAction', title: 'Calls to Action', icon: '🎯' },
    { key: 'offerClarity', title: 'Offer Clarity', icon: '💡' },
    { key: 'connectionTrust', title: 'Connection & Trust', icon: '🤝' },
    { key: 'contentOpportunities', title: 'Content Opportunities', icon: '📝' }
  ];

  for (const config of sectionConfigs) {
    const sectionData = parsedResults.sections?.[config.key];
    if (!sectionData?.insight && !sectionData?.recommendation) continue;

    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 30;
    }

    // Section header with enhanced styling
    doc.setFillColor(17, 34, 72); // Navy blue
    doc.roundedRect(15, y - 8, 180, 18, 4, 4, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.title, 25, y + 2);

    // Section content with better styling
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, y + 10, 180, 30, 4, 4, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 34, 72); // Navy blue
    
    let contentY = y + 20;
    
    if (sectionData.insight) {
      doc.text('INSIGHT:', 25, contentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const insightLines = doc.splitTextToSize(sectionData.insight, 70);
      doc.text(insightLines, 25, contentY + 6);
    }
    
    if (sectionData.recommendation) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 34, 72); // Navy blue
      doc.text('RECOMMENDATION:', 115, contentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const recLines = doc.splitTextToSize(sectionData.recommendation, 70);
      doc.text(recLines, 115, contentY + 6);
    }

    y += 50;
  }

  // Footer
  doc.addPage();
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 20, 180, 40, 3, 3, 'FD');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  
  const disclaimer = 'This report was generated using advanced AI analysis based on publicly available website content. While care is taken to provide accurate and relevant insights, this report may contain errors, omissions, or generalized recommendations. For tailored strategy or functionality recommendations, we recommend a human-led review with our expert brand strategists. Contact us to book your in-depth consultation.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, 160);
  doc.text(disclaimerLines, 25, 30);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 34, 72); // Navy blue
  doc.text('© 2026 Brand Roadmap™ by Left Right Labs. All rights reserved.', 25, 50);

  return Buffer.from(doc.output('arraybuffer'));
}

function generateSimplePDF(auditData: any, parsedResults: any): Buffer {
  // Create a simple PDF using jsPDF as fallback
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();
  
  const domain = new URL(auditData.website_url).hostname.replace('www.', '');
  const reportDate = new Date(auditData.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Header
  doc.setFillColor(17, 34, 72); // Navy
  doc.rect(0, 0, 210, 50, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Elevate Your Brand Advantage', 20, 30);
  doc.setFontSize(14);
  doc.text('Brand Strategy Assessment', 20, 40);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Metadata section with proper spacing
  let y = 70;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Website Analyzed:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const websiteText = auditData.website_url;
  const websiteLines = doc.splitTextToSize(websiteText, 120);
  doc.text(websiteLines, 60, y);
  y += Math.max(websiteLines.length * 5, 15);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Report Generated:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(reportDate, 60, y);
  y += 15;
  
  if (auditData.lead_name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Requested By:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(auditData.lead_name, 60, y);
    y += 15;
  }

  // Executive Summary with proper spacing
  y += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, y);
  
  y += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const summaryText = parsedResults.executiveSummary || 'Executive summary not available.';
  const summaryLines = doc.splitTextToSize(summaryText, 170);
  doc.text(summaryLines, 20, y);
  y += summaryLines.length * 6 + 20;

  // Sections with proper spacing and page breaks
  const sections = parsedResults.sections || {};
  const sectionConfigs = [
    { key: 'brandMessaging', title: 'Brand Messaging' },
    { key: 'visualIdentity', title: 'Visual Identity' },
    { key: 'userJourney', title: 'User Journey' },
    { key: 'callsToAction', title: 'Calls to Action' },
    { key: 'offerClarity', title: 'Offer Clarity' },
    { key: 'connectionTrust', title: 'Connection & Trust' },
    { key: 'contentOpportunities', title: 'Content Opportunities' }
  ];

  for (const config of sectionConfigs) {
    const sectionData = sections[config.key];
    if (!sectionData?.insight && !sectionData?.recommendation) continue;

    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = 30;
    }

    // Section title
    y += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(config.title, 20, y);
    y += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Insight
    if (sectionData.insight) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Insight:', 20, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      const insightText = sectionData.insight;
      const insightLines = doc.splitTextToSize(insightText, 170);
      doc.text(insightLines, 20, y);
      y += insightLines.length * 6 + 10;
    }

    // Recommendation
    if (sectionData.recommendation) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Recommendation:', 20, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      const recommendationText = sectionData.recommendation;
      const recommendationLines = doc.splitTextToSize(recommendationText, 170);
      doc.text(recommendationLines, 20, y);
      y += recommendationLines.length * 6 + 15;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('© 2026 Brand Roadmap™ by Left Right Labs. All rights reserved.', 20, 280);
    doc.text(`Page ${i} of ${pageCount}`, 170, 280);
  }

  return Buffer.from(doc.output('arraybuffer'));
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
