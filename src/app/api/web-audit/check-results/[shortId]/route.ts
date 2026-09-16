import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { redactForFree } from '@/lib/report-gate';

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
  paid: boolean;
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

    // The lead join is gone on purpose. This row is the source of a public,
    // shareable JSON response, so it should not carry the founder's name or
    // email in the first place.
    const rows = await sql<ReportRow[]>`
      SELECT
        sr.website_url,
        sr.analysis_results,
        sr.expires_at,
        sr.paid
      FROM shared_reports sr
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

    // Reports no longer expire, so there is no expiry gate here. Dropping the
    // check also revives reports created under the old 7-day TTL, which is
    // intentional: every link we ever emailed keeps working.

    const analysisResults = report.analysis_results;

    if (analysisResults.status === 'completed') {
      // The paywall is enforced here, not in the browser. An unpaid report
      // never receives the locked copy, so opening devtools or curling this
      // endpoint with a guessed six-character short ID yields only the free
      // view. See lib/report-gate.ts for exactly what survives redaction.
      const isPaid = report.paid === true;
      const visible = isPaid ? analysisResults : redactForFree(analysisResults);

      // The lead's name and email are deliberately NOT returned. Nothing in the
      // report UI reads them, and a report link is shareable, so sending them
      // handed a stranger the founder's contact details along with the report.
      return NextResponse.json({
        status: 'completed',
        results: {
          ...visible,
          shortId,
          websiteUrl: report.website_url,
          paid: isPaid,
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
