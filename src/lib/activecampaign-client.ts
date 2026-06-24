interface ActiveCampaignResponse {
  success: boolean;
  message: string;
  contactId?: string;
}

interface StartLeadData {
  name: string;
  email: string;
  websiteUrl: string;
  primaryGoal: string;
  industry: string;
  targetAudience: string;
  brandPersonality: string;
  marketingCampaigns: string;
  improvementFocus: string;
  shortId?: string;
}

/**
 * Subscribe a user to ActiveCampaign list via API route
 * @param email - Required email address
 * @param firstName - Optional first name
 * @param lastName - Optional last name
 * @returns Promise with success status and message
 */
export async function subscribeToActiveCampaign(
  email: string, 
  firstName?: string, 
  lastName?: string
): Promise<ActiveCampaignResponse> {
  try {
    const response = await fetch('/api/activecampaign-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling ActiveCampaign API:', error);
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Subscribe a start lead to ActiveCampaign with custom field mapping
 * @param leadData - Lead data from the /start form
 * @returns Promise with success status and message
 */
export async function subscribeStartLead(leadData: StartLeadData): Promise<ActiveCampaignResponse> {
  try {
    const response = await fetch('/api/activecampaign-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling ActiveCampaign API for start lead:', error);
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 