import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`[EMAIL-CHECK] Checking email status for: ${email}`);

    // Check if lead exists
    const { data: existingLead, error: leadError } = await supabase
      .from('website_audit_leads')
      .select('id')
      .eq('email', email)
      .single();

    console.log(`[EMAIL-CHECK] Lead query result:`, { existingLead, leadError });

    if (existingLead) {
      console.log(`[EMAIL-CHECK] Found existing lead with ID: ${existingLead.id}`);
      
      // Check if they already have any report (not just completed ones)
      const { data: existingReports, error: reportError } = await supabase
        .from('shared_reports')
        .select('id, short_id, analysis_results')
        .eq('lead_id', existingLead.id);

      console.log(`[EMAIL-CHECK] Reports query result:`, { existingReports, reportError });

      if (existingReports && existingReports.length > 0) {
        console.log(`[EMAIL-CHECK] Found ${existingReports.length} existing reports`);
        
        // Check each report for status
        for (const report of existingReports) {
          console.log(`[EMAIL-CHECK] Checking report ${report.short_id} with analysis_results:`, report.analysis_results);
          
          const analysisResults = report.analysis_results;
          if (analysisResults) {
            if (analysisResults.status === 'completed') {
              console.log(`[EMAIL-CHECK] Found completed report: ${report.short_id}`);
              return NextResponse.json(
                { 
                  error: 'You have already received a brand strategy assessment for this email address.',
                  existingShortId: report.short_id,
                  message: 'You can view your existing report or contact us if you need a new assessment.'
                },
                { status: 409 }
              );
            } else if (analysisResults.status === 'processing') {
              console.log(`[EMAIL-CHECK] Found processing report: ${report.short_id}`);
              return NextResponse.json(
                { 
                  error: 'You have an analysis in progress for this email address.',
                  existingShortId: report.short_id,
                  message: 'Please wait for your current analysis to complete or contact support if it has been stuck for too long.'
                },
                { status: 409 }
              );
            } else {
              console.log(`[EMAIL-CHECK] Found report with status: ${analysisResults.status}`);
            }
          } else {
            console.log(`[EMAIL-CHECK] Report ${report.short_id} has no analysis_results`);
          }
        }
      } else {
        console.log(`[EMAIL-CHECK] No existing reports found for lead ID: ${existingLead.id}`);
      }
    } else {
      console.log(`[EMAIL-CHECK] No existing lead found for email: ${email}`);
    }

    // Email is available for new analysis
    return NextResponse.json(
      { 
        success: true,
        message: 'Email is available for new analysis'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[EMAIL-CHECK] Error checking email status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
