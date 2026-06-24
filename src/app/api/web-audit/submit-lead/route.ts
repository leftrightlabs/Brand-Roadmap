import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
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

    // Check if lead already exists — reuse existing record if so
    const { data: existingLead } = await supabase
      .from('website_audit_leads')
      .select('id')
      .eq('email', email)
      .single();

    if (existingLead) {
      return NextResponse.json({
        success: true,
        message: 'Lead information updated',
        leadId: existingLead.id
      });
    }

    // Insert new lead
    const { data: lead, error: insertError } = await supabase
      .from('website_audit_leads')
      .insert([
        {
          name,
          email,
          website_url: '', // Will be updated in next step
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return NextResponse.json(
        { error: 'Failed to save lead information' },
        { status: 500 }
      );
    }

    // Add to ActiveCampaign (if configured)
    if (process.env.ACTIVECAMPAIGN_API_KEY && process.env.ACTIVECAMPAIGN_LIST_ID) {
      try {
        const activeCampaignResponse = await fetch(
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

        if (activeCampaignResponse.ok) {
          const contactData = await activeCampaignResponse.json();
          
          // Add to list
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
                  status: 1, // Subscribed
                },
              }),
            }
          );
        }
      } catch (acError) {
        console.error('ActiveCampaign error:', acError);
        // Don't fail the request if ActiveCampaign fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead information saved successfully',
      leadId: lead.id 
    });

  } catch (error) {
    console.error('Submit lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 