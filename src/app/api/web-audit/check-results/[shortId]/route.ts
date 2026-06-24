import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;
    console.log('[CHECK-RESULTS] Checking results for shortId:', shortId);

    if (!shortId) {
      return NextResponse.json(
        { error: 'Short ID is required' },
        { status: 400 }
      );
    }

    // Get report data
    const { data: report, error } = await supabase
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

    if (error) {
      console.error('[CHECK-RESULTS] Database error for shortId', shortId, ':', error);
      return NextResponse.json(
        { error: 'Report not found', details: error.message },
        { status: 404 }
      );
    }
    
    if (!report) {
      console.error('[CHECK-RESULTS] No report found for shortId:', shortId);
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    console.log('[CHECK-RESULTS] Found report for shortId:', shortId, 'status:', report.analysis_results?.status);

    // Check if report has expired
    const expiresAt = new Date(report.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      return NextResponse.json(
        { 
          error: 'Report has expired',
          expired: true,
          shortId: shortId,
          websiteUrl: report.website_url
        },
        { status: 410 }
      );
    }

    const analysisResults = report.analysis_results;

    // Return status and progress
    if (analysisResults.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        results: {
          ...analysisResults,
          shortId,
          websiteUrl: report.website_url,
          leadName: report.website_audit_leads?.name,
          leadEmail: report.website_audit_leads?.email,
        }
      });
    } else if (analysisResults.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: analysisResults.error || 'Analysis failed',
        shortId,
        websiteUrl: report.website_url,
      });
    } else {
      // Still processing
      return NextResponse.json({
        status: 'processing',
        progress: analysisResults.progress || 0,
        currentStep: analysisResults.currentStep || 0,
        shortId,
        websiteUrl: report.website_url,
      });
    }

  } catch (error) {
    console.error('Check results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 