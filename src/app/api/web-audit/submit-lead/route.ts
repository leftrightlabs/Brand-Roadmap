import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
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

    // Check if lead already exists — reuse existing record if so
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM website_audit_leads WHERE email = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Lead information updated',
        leadId: existing[0].id,
      });
    }

    // Insert new lead. website_url is set later in start-analysis.
    const inserted = await sql<{ id: string }[]>`
      INSERT INTO website_audit_leads (name, email, website_url)
      VALUES (${name}, ${email}, '')
      RETURNING id
    `;

    const leadId = inserted[0].id;

    // Subscribe to ActiveCampaign (best-effort — don't fail the request if AC is down)
    if (process.env.ACTIVECAMPAIGN_API_KEY && process.env.ACTIVECAMPAIGN_LIST_ID) {
      try {
        const acResponse = await fetch(
          `https://${process.env.ACTIVECAMPAIGN_ACCOUNT}.api-us1.com/api/3/contacts`,
          {
            method: 'POST',
            headers: {
              'Api-Token': process.env.ACTIVECAMPAIGN_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contact: {
                email,
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' ') || '',
              },
            }),
          }
        );

        if (acResponse.ok) {
          const contactData = await acResponse.json();
          await fetch(
            `https://${process.env.ACTIVECAMPAIGN_ACCOUNT}.api-us1.com/api/3/contactLists`,
            {
              method: 'POST',
              headers: {
                'Api-Token': process.env.ACTIVECAMPAIGN_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contactList: {
                  list: process.env.ACTIVECAMPAIGN_LIST_ID,
                  contact: contactData.contact.id,
                  status: 1,
                },
              }),
            }
          );
        }
      } catch (acError) {
        console.error('ActiveCampaign error:', acError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lead information saved successfully',
      leadId,
    });
  } catch (error) {
    console.error('Submit lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
