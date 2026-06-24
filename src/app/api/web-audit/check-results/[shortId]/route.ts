import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface ReportRow {
  website_url: string;
  analysis_results: {
    status?: string;
    progress?: number;
    currentStep?: number;
    error?: string;
    [key: string]: unknown;
  };
  expires_at: string;
  lead_name: string | null;
  lead_email: string | null;
}

export async function GET(
  _request: NextRequest,
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

    // LEFT JOIN to surface lead name/email on the same row — mirrors the
    // previous Supabase nested-select behavior.
    const rows = await sql<ReportRow[]>`
      SELECT
        sr.website_url,
        sr.analysis_results,
        sr.expires_at,
        l.name  AS lead_name,
        l.email AS lead_email
      FROM shared_reports sr
      LEFT JOIN website_audit_leads l ON l.id = sr.lead_id
      WHERE sr.short_id = ${shortId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      console.error('[CHECK-RESULTS] No report found for shortId:', shortId);
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = rows[0];
    console.log(
      '[CHECK-RESULTS] Found report for shortId:',
      shortId,
      'status:',
      report.analysis_results?.status
    );

    // Expiration check
    if (new Date() > new Date(report.expires_at)) {
      return NextResponse.json(
        {
          error: 'Report has expired',
          expired: true,
          shortId,
          websiteUrl: report.website_url,
        },
        { status: 410 }
      );
    }

    const analysisResults = report.analysis_results;

    if (analysisResults.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        results: {
          ...analysisResults,
          shortId,
          websiteUrl: report.website_url,
          leadName: report.lead_name ?? undefined,
          leadEmail: report.lead_email ?? undefined,
        },
      });
    }

    if (analysisResults.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: analysisResults.error || 'Analysis failed',
        shortId,
        websiteUrl: report.website_url,
      });
    }

    return NextResponse.json({
      status: 'processing',
      progress: analysisResults.progress ?? 0,
      currentStep: analysisResults.currentStep ?? 0,
      shortId,
      websiteUrl: report.website_url,
    });
  } catch (error) {
    console.error('Check results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
