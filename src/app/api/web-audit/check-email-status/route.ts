import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface ReportRow {
  short_id: string;
  analysis_results: {
    status?: string;
    [key: string]: unknown;
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`[EMAIL-CHECK] Checking email status for: ${email}`);

    // Look up any existing reports for this email in one query
    const reports = await sql<ReportRow[]>`
      SELECT sr.short_id, sr.analysis_results
      FROM shared_reports sr
      INNER JOIN website_audit_leads l ON l.id = sr.lead_id
      WHERE l.email = ${email}
    `;

    if (reports.length === 0) {
      console.log(`[EMAIL-CHECK] No existing reports for email: ${email}`);
      return NextResponse.json(
        { success: true, message: 'Email is available for new analysis' },
        { status: 200 }
      );
    }

    console.log(`[EMAIL-CHECK] Found ${reports.length} report(s) for email: ${email}`);

    for (const report of reports) {
      const status = report.analysis_results?.status;
      if (status === 'completed') {
        return NextResponse.json(
          {
            error: 'You have already received a Brand Roadmap for this email address.',
            existingShortId: report.short_id,
            message: 'You can view your existing roadmap or contact us if you need a new one.',
          },
          { status: 409 }
        );
      }
      if (status === 'processing') {
        return NextResponse.json(
          {
            error: 'You have a Brand Roadmap in progress for this email address.',
            existingShortId: report.short_id,
            message: 'Please wait for your current roadmap to finish, or contact support if it has been stuck.',
          },
          { status: 409 }
        );
      }
    }

    // Existing reports but none are in a blocking state — allow new analysis
    return NextResponse.json(
      { success: true, message: 'Email is available for new analysis' },
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
