import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
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

    // Get the current report
    const { data: report, error: fetchError } = await supabase
      .from('shared_reports')
      .select('*')
      .eq('short_id', shortId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const analysisResults = report.analysis_results;
    
    // Check if the analysis has been stuck for more than 2 minutes (reduced from 5 minutes)
    const now = new Date();
    const updatedAt = analysisResults?.updatedAt ? new Date(analysisResults.updatedAt) : new Date(report.created_at);
    const timeSinceUpdate = now.getTime() - updatedAt.getTime();
    const twoMinutes = 2 * 60 * 1000;

    // Also check if we're stuck at 52% specifically (AI analysis step)
    const isStuckAt52 = analysisResults?.progress >= 50 && analysisResults?.progress <= 55;
    const isStuckLongEnough = timeSinceUpdate > twoMinutes;

    if (!isStuckLongEnough && !isStuckAt52) {
      return NextResponse.json(
        { error: 'Analysis is not stuck long enough to force complete' },
        { status: 400 }
      );
    }

    // Create a fallback analysis result
    const fallbackResults = {
      summary: isStuckAt52 
        ? "Analysis completed with fallback results due to AI processing timeout. The AI analysis step took longer than expected. Please contact support for a full analysis."
        : "Analysis completed with fallback results due to processing timeout. Please contact support for a full analysis.",
      overallGrade: "C",
      brandMessaging: {
        quote: "Analysis completed",
        evaluation: "Brand messaging analysis completed with fallback results",
        recommendation: "Consider professional consultation for detailed analysis"
      },
      visualIdentity: {
        description: "Visual identity analysis completed",
        colors: [],
        fonts: [],
        recommendation: "Consider professional consultation for detailed analysis"
      },
      userJourney: {
        navigation: "User journey analysis completed",
        cta: "CTA analysis completed",
        recommendation: "Consider professional consultation for detailed analysis"
      },
      callsToAction: {
        ctas: ["Analysis completed"],
        evaluation: "CTA effectiveness analysis completed",
        recommendation: "Consider professional consultation for detailed analysis"
      },
      offerClarity: {
        product: "Offer clarity analysis completed",
        description: "Product/service description analysis completed",
        evaluation: "Clarity assessment completed",
        recommendation: "Consider professional consultation for detailed analysis"
      },
      connectionTrust: {
        elements: ["Trust elements analysis completed"],
        weaknesses: ["Trust gaps analysis completed"],
        evaluation: "Trust elements analysis completed",
        recommendation: "Consider professional consultation for detailed analysis"
      },
      contentOpportunities: {
        suggestion: "Content opportunities analysis completed",
        placement: "Content placement analysis completed",
        rationale: "Content strategy analysis completed"
      },
      strengths: ["Analysis completed successfully"],
      weaknesses: ["Processing timeout occurred"],
      actionableSteps: ["Contact support for detailed analysis"],
      nextSteps: ["Review the analysis", "Contact support for full analysis"],
      additionalSuggestions: ["Consider professional consultation"],
      rawResponse: "Fallback analysis due to processing timeout",
      status: 'completed',
      progress: 100,
      currentStep: 5,
      generatedAt: new Date().toISOString(),
      forceCompleted: true,
      forceCompletedAt: new Date().toISOString(),
      originalError: analysisResults?.error || 'Processing timeout',
      stuckAt52: isStuckAt52
    };

    // Update the report with fallback results
    const { error: updateError } = await supabase
      .from('shared_reports')
      .update({
        analysis_results: fallbackResults
      })
      .eq('short_id', shortId);

    if (updateError) {
      console.error('Error updating report with fallback results:', updateError);
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    console.log(`[FORCE-COMPLETE] Successfully force-completed analysis for ${shortId}`);

    return NextResponse.json({
      success: true,
      message: 'Analysis force-completed successfully',
      shortId,
      forceCompleted: true
    });

  } catch (error) {
    console.error('Force complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
