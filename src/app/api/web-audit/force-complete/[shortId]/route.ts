import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface ReportRow {
  created_at: string;
  analysis_results: {
    progress?: number;
    updatedAt?: string;
    error?: string;
    [key: string]: unknown;
  } | null;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;

    if (!shortId) {
      return NextResponse.json(
        { error: 'Short ID is required' },
        { status: 400 }
      );
    }

    const rows = await sql<ReportRow[]>`
      SELECT created_at, analysis_results
      FROM shared_reports
      WHERE short_id = ${shortId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = rows[0];
    const analysisResults = report.analysis_results;

    // Bail if the analysis isn't actually stuck
    const now = new Date();
    const updatedAt = analysisResults?.updatedAt
      ? new Date(analysisResults.updatedAt)
      : new Date(report.created_at);
    const timeSinceUpdate = now.getTime() - updatedAt.getTime();
    const twoMinutes = 2 * 60 * 1000;

    const isStuckAt52 =
      (analysisResults?.progress ?? 0) >= 50 &&
      (analysisResults?.progress ?? 0) <= 55;
    const isStuckLongEnough = timeSinceUpdate > twoMinutes;

    if (!isStuckLongEnough && !isStuckAt52) {
      return NextResponse.json(
        { error: 'Analysis is not stuck long enough to force complete' },
        { status: 400 }
      );
    }

    // Force-complete with a placeholder result so the UI can render
    // something instead of spinning forever.
    const fallbackResults = {
      summary: isStuckAt52
        ? 'Analysis completed with fallback results due to AI processing timeout. The AI analysis step took longer than expected. Please contact support for a full analysis.'
        : 'Analysis completed with fallback results due to processing timeout. Please contact support for a full analysis.',
      overallGrade: 'C',
      brandMessaging: {
        quote: 'Analysis completed',
        evaluation: 'Brand messaging analysis completed with fallback results',
        recommendation: 'Consider professional consultation for detailed analysis',
      },
      visualIdentity: {
        description: 'Visual identity analysis completed',
        colors: [],
        fonts: [],
        recommendation: 'Consider professional consultation for detailed analysis',
      },
      userJourney: {
        navigation: 'User journey analysis completed',
        cta: 'CTA analysis completed',
        recommendation: 'Consider professional consultation for detailed analysis',
      },
      callsToAction: {
        ctas: ['Analysis completed'],
        evaluation: 'CTA effectiveness analysis completed',
        recommendation: 'Consider professional consultation for detailed analysis',
      },
      offerClarity: {
        product: 'Offer clarity analysis completed',
        description: 'Product/service description analysis completed',
        evaluation: 'Clarity assessment completed',
        recommendation: 'Consider professional consultation for detailed analysis',
      },
      connectionTrust: {
        elements: ['Trust elements analysis completed'],
        weaknesses: ['Trust gaps analysis completed'],
        evaluation: 'Trust elements analysis completed',
        recommendation: 'Consider professional consultation for detailed analysis',
      },
      contentOpportunities: {
        suggestion: 'Content opportunities analysis completed',
        placement: 'Content placement analysis completed',
        rationale: 'Content strategy analysis completed',
      },
      strengths: ['Analysis completed successfully'],
      weaknesses: ['Processing timeout occurred'],
      actionableSteps: ['Contact support for detailed analysis'],
      nextSteps: ['Review the analysis', 'Contact support for full analysis'],
      additionalSuggestions: ['Consider professional consultation'],
      rawResponse: 'Fallback analysis due to processing timeout',
      status: 'completed',
      progress: 100,
      currentStep: 5,
      generatedAt: now.toISOString(),
      forceCompleted: true,
      forceCompletedAt: now.toISOString(),
      originalError: analysisResults?.error || 'Processing timeout',
      stuckAt52: isStuckAt52,
    };

    await sql`
      UPDATE shared_reports
      SET analysis_results = ${sql.json(fallbackResults)}
      WHERE short_id = ${shortId}
    `;

    console.log(
      `[FORCE-COMPLETE] Successfully force-completed analysis for ${shortId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Analysis force-completed successfully',
      shortId,
      forceCompleted: true,
    });
  } catch (error) {
    console.error('Force complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
