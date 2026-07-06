import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { PILLARS, AREA_LABELS, type RoadmapResults, type AreaStatus } from '@/lib/roadmap-types';

interface ReportRow {
  analysis_results: Record<string, unknown>;
  website_url: string;
  created_at: string;
  expires_at: string;
  lead_name: string | null;
  lead_email: string | null;
}

const NAVY: [number, number, number] = [17, 34, 72];
const LIME: [number, number, number] = [167, 193, 64];
const STATUS_RGB: Record<AreaStatus, [number, number, number]> = {
  Strong: [95, 125, 24],
  Refine: [169, 120, 31],
  Prioritize: [192, 86, 58],
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;

  try {
    const rows = await sql<ReportRow[]>`
      SELECT sr.analysis_results, sr.website_url, sr.created_at, sr.expires_at,
             l.name AS lead_name, l.email AS lead_email
      FROM shared_reports sr
      LEFT JOIN website_audit_leads l ON l.id = sr.lead_id
      WHERE sr.short_id = ${shortId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Roadmap not found or has expired' }, { status: 404 });
    }

    const report = rows[0];
    if (new Date() > new Date(report.expires_at)) {
      return NextResponse.json({ error: 'Report has expired' }, { status: 410 });
    }

    const data = report.analysis_results as unknown as RoadmapResults;
    if (!data?.pillars || !data?.legacyRead) {
      return NextResponse.json({ error: 'Roadmap is not available for PDF export' }, { status: 422 });
    }

    const pdfBuffer = generateRoadmapPDF(data, report.website_url, report.created_at, report.lead_name);
    const domain = new URL(report.website_url).hostname.replace('www.', '');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Brand-Roadmap-${domain}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[WEB-AUDIT-PDF] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF generation failed' },
      { status: 500 }
    );
  }
}

function generateRoadmapPDF(
  data: RoadmapResults,
  websiteUrl: string,
  createdAt: string,
  leadName: string | null
): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  const reportDate = new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const ensureSpace = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 24;
    }
  };

  const paragraph = (text: string, size = 10, lineH = 5, color: [number, number, number] = [55, 65, 81]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, margin, y);
      y += lineH;
    }
  };

  // Header
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 52, 'F');
  doc.setFillColor(...LIME);
  doc.rect(0, 0, pageW, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('Your Brand Roadmap', margin, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`The sequenced moves to re-align ${websiteUrl}`, margin, 38);
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text(`${reportDate}${leadName ? `  ·  Prepared for ${leadName}` : ''}`, margin, 46);

  // Legacy Read
  y = 66;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text('The Legacy Read', margin, y);
  y += 8;
  for (const para of data.legacyRead.split(/\n\n+/).filter(Boolean)) {
    paragraph(para);
    y += 3;
  }
  y += 4;

  // Pillars
  for (const pillar of PILLARS) {
    ensureSpace(26);
    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(pillar.label, margin + 4, y + 8);
    y += 18;

    for (const areaKey of pillar.areas) {
      const ev = data.pillars?.[pillar.key]?.areas?.[areaKey];
      if (!ev) continue;
      ensureSpace(20);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...NAVY);
      doc.text(AREA_LABELS[areaKey], margin, y);

      const status = ev.status;
      doc.setFontSize(9);
      doc.setTextColor(...(STATUS_RGB[status] ?? [100, 100, 100]));
      const label = `${status}${ev.startHere ? '  ·  START HERE' : ''}`;
      doc.text(label, pageW - margin, y, { align: 'right' });
      y += 6;

      paragraph(ev.evaluation, 10, 5);
      y += 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...NAVY);
      ensureSpace(5);
      doc.text('Your next move:', margin, y);
      y += 5;
      paragraph(ev.nextMove, 10, 5);

      if (ev.whatGoodLooksLike) {
        y += 1;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
        ensureSpace(5); doc.text('What good looks like:', margin, y); y += 5;
        paragraph(ev.whatGoodLooksLike, 10, 5);
      }
      if (ev.exampleRewrite) {
        y += 1;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
        ensureSpace(5); doc.text('Example, in your voice:', margin, y); y += 5;
        paragraph(ev.exampleRewrite, 10, 5);
      }
      y += 6;
    }
    y += 2;
  }

  // 30/60/90-day plan
  if (data.phasedPlan && data.phasedPlan.length > 0) {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...NAVY);
    doc.text('Your 30 / 60 / 90-Day Roadmap', margin, y);
    y += 9;
    data.phasedPlan.forEach((phase) => {
      ensureSpace(9);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
      doc.text(phase.label, margin, y); y += 6;
      (phase.moves || []).forEach((move) => {
        const lines = doc.splitTextToSize(move, contentW - 8);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(55, 65, 81);
        ensureSpace(5);
        doc.text('•', margin + 2, y);
        for (let l = 0; l < lines.length; l++) { ensureSpace(5); doc.text(lines[l], margin + 8, y); y += 5; }
      });
      y += 4;
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('© 2026 Brand Roadmap™ by Left Right Labs. All rights reserved.', margin, 290);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 290, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}
