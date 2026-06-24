import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';

// Register fonts - CRITICAL for Vercel
Font.register({
  family: 'Helvetica',
  src: 'Helvetica',
});

Font.register({
  family: 'Helvetica-Bold',
  src: 'Helvetica-Bold',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 0,
    fontFamily: 'Helvetica',
  },
  // BEAUTIFUL HEADER with Navy background
  header: {
    backgroundColor: '#112248', // Navy background
    color: '#ffffff',
    padding: 50,
    textAlign: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  headerUrl: {
    fontSize: 11,
    opacity: 0.9,
    marginBottom: 5,
  },
  headerMetadata: {
    fontSize: 10,
    opacity: 0.8,
    marginTop: 5,
  },
  
  // CONTAINER
  container: {
    padding: 20,
  },
  
  // METADATA SECTION
  metadata: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metadataItem: {
    flex: 1,
    textAlign: 'center',
  },
  metadataLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  
  // EXECUTIVE SUMMARY - Purple border with image layout
  executiveSummary: {
    backgroundColor: '#f8fafc',
    borderWidth: 3,
    borderColor: '#a7c140', // Lime accent border
    borderRadius: 16,
    padding: 30,
    marginBottom: 35,
  },
  executiveSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#112248',
    marginBottom: 15,
  },
  executiveSummaryContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  executiveSummaryImage: {
    width: '80%',
    maxWidth: 300,
    height: 'auto',
    marginBottom: 20,
    borderRadius: 8,
    objectFit: 'cover',
  },
  executiveSummaryTextContainer: {
    width: '100%',
  },
  executiveSummaryText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.6,
  },
  
  // BEAUTIFUL SECTIONS with navy headers
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    backgroundColor: '#112248', // Navy header
    padding: 20,
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sectionHeaderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 0,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 24,
    flexDirection: 'row',
  },
  
  // TWO COLUMN LAYOUT
  column: {
    flex: 1,
    marginRight: 12,
  },
  columnLast: {
    flex: 1,
    marginRight: 0,
  },
  columnTitle: {
    fontSize: 10, // Back to original size
    fontWeight: 'bold',
    color: '#112248',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Helvetica', // Explicitly match executive summary font family
  },
  columnText: {
    fontSize: 10, // Back to original size
    color: '#374151',
    lineHeight: 1.6,
    fontFamily: 'Helvetica', // Explicitly match executive summary font
    fontWeight: 'normal', // Explicitly set to match executive summary
  },
  
  // CTA SECTION
  ctaSection: {
    marginTop: 40,
    marginBottom: 30,
    paddingTop: 30,
    paddingBottom: 30,
    backgroundColor: '#a7c140', // Lime accent background
    borderRadius: 12,
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff', // White text
    marginBottom: 12,
    fontFamily: 'Helvetica',
  },
  ctaText: {
    fontSize: 12,
    color: '#ffffff', // White text
    lineHeight: 1.6,
    marginBottom: 20,
    fontFamily: 'Helvetica',
  },
  ctaButton: {
    backgroundColor: '#ffffff', // White button background
    borderRadius: 8,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 24,
    paddingRight: 24,
    marginHorizontal: 60, // Center the button with margins
  },
  ctaButtonText: {
    fontSize: 12,
    color: '#a7c140', // Lime text on white button
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    textDecoration: 'none', // Remove underline
  },
  
  // FOOTER
  footer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 24,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  brandFooter: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#112248',
  },
});

interface WebsiteAuditPDFProps {
  data: {
    websiteUrl: string;
    overallGrade?: string;
    auditSummary: string;
    ogImageUrl?: string;
    requestedBy?: string; // Added requestedBy
    sections?: {
      brandMessaging?: { insight?: string; recommendation?: string; };
      visualIdentity?: { insight?: string; recommendation?: string; };
      userJourney?: { insight?: string; recommendation?: string; };
      callsToAction?: { insight?: string; recommendation?: string; };
      offerClarity?: { insight?: string; recommendation?: string; };
      connectionTrust?: { insight?: string; recommendation?: string; };
      contentOpportunities?: { insight?: string; recommendation?: string; };
    };
    strengths?: string[];
    improvements?: string[];
    nextSteps?: string[];
    additionalSuggestions?: string[];
  };
}

const WebsiteAuditPDF: React.FC<WebsiteAuditPDFProps> = ({ data }) => {
  // Debug logging
  console.log('[PDF-COMPONENT] Received data with OG image:', data.ogImageUrl ? 'YES' : 'NO');
  if (data.ogImageUrl) {
    console.log('[PDF-COMPONENT] OG image URL:', data.ogImageUrl);
  }
  
  const domain = data.websiteUrl ? new URL(data.websiteUrl).hostname.replace('www.', '') : 'Unknown';
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sectionConfigs = [
    { key: 'brandMessaging', title: 'Brand Messaging' },
    { key: 'visualIdentity', title: 'Visual Identity' },
    { key: 'userJourney', title: 'User Journey' },
    { key: 'callsToAction', title: 'Calls to Action' },
    { key: 'offerClarity', title: 'Offer Clarity' },
    { key: 'connectionTrust', title: 'Connection & Trust' },
    { key: 'contentOpportunities', title: 'Content Opportunities' }
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* BEAUTIFUL HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Elevate Your Brand Advantage</Text>
          <Text style={styles.headerSubtitle}>Brand Strategy Assessment</Text>
          <Text style={styles.headerUrl}>Comprehensive analysis of {data.websiteUrl}</Text>
          <Text style={styles.headerMetadata}>{reportDate} | Requested by {data.requestedBy || 'Brand Analysis'}</Text>
        </View>

        <View style={styles.container}>

          {/* EXECUTIVE SUMMARY - Purple border with image */}
          <View style={styles.executiveSummary}>
            <Text style={styles.executiveSummaryTitle}>EXECUTIVE SUMMARY</Text>
            <View style={styles.executiveSummaryContent}>
              {data.ogImageUrl && (
                <Image 
                  src={data.ogImageUrl} 
                  style={styles.executiveSummaryImage}
                />
              )}
              <View style={styles.executiveSummaryTextContainer}>
                <Text style={styles.executiveSummaryText}>{data.auditSummary}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* PAGE 2: Brand Messaging & Visual Identity */}
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Brand Messaging */}
          {data.sections?.brandMessaging && (data.sections.brandMessaging.insight || data.sections.brandMessaging.recommendation) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Brand Messaging</Text>
              </View>
              <View style={styles.sectionContent}>
                {data.sections.brandMessaging.insight && (
                  <View style={styles.column}>
                    <Text style={styles.columnTitle}>INSIGHT</Text>
                    <Text style={styles.columnText}>{data.sections.brandMessaging.insight}</Text>
                  </View>
                )}
                {data.sections.brandMessaging.recommendation && (
                  <View style={styles.columnLast}>
                    <Text style={styles.columnTitle}>RECOMMENDATION</Text>
                    <Text style={styles.columnText}>{data.sections.brandMessaging.recommendation}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Visual Identity */}
          {data.sections?.visualIdentity && (data.sections.visualIdentity.insight || data.sections.visualIdentity.recommendation) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Visual Identity</Text>
              </View>
              <View style={styles.sectionContent}>
                {data.sections.visualIdentity.insight && (
                  <View style={styles.column}>
                    <Text style={styles.columnTitle}>INSIGHT</Text>
                    <Text style={styles.columnText}>{data.sections.visualIdentity.insight}</Text>
                  </View>
                )}
                {data.sections.visualIdentity.recommendation && (
                  <View style={styles.columnLast}>
                    <Text style={styles.columnTitle}>RECOMMENDATION</Text>
                    <Text style={styles.columnText}>{data.sections.visualIdentity.recommendation}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Page>

      {/* PAGE 3: User Journey & Calls to Action */}
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* User Journey */}
          {data.sections?.userJourney && (data.sections.userJourney.insight || data.sections.userJourney.recommendation) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>User Journey</Text>
              </View>
              <View style={styles.sectionContent}>
                {data.sections.userJourney.insight && (
                  <View style={styles.column}>
                    <Text style={styles.columnTitle}>INSIGHT</Text>
                    <Text style={styles.columnText}>{data.sections.userJourney.insight}</Text>
                  </View>
                )}
                {data.sections.userJourney.recommendation && (
                  <View style={styles.columnLast}>
                    <Text style={styles.columnTitle}>RECOMMENDATION</Text>
                    <Text style={styles.columnText}>{data.sections.userJourney.recommendation}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Calls to Action */}
          {data.sections?.callsToAction && (data.sections.callsToAction.insight || data.sections.callsToAction.recommendation) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Calls to Action</Text>
              </View>
              <View style={styles.sectionContent}>
                {data.sections.callsToAction.insight && (
                  <View style={styles.column}>
                    <Text style={styles.columnTitle}>INSIGHT</Text>
                    <Text style={styles.columnText}>{data.sections.callsToAction.insight}</Text>
                  </View>
                )}
                {data.sections.callsToAction.recommendation && (
                  <View style={styles.columnLast}>
                    <Text style={styles.columnTitle}>RECOMMENDATION</Text>
                    <Text style={styles.columnText}>{data.sections.callsToAction.recommendation}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Page>

      {/* PAGE 4: Offer Clarity & Connection & Trust */}
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Offer Clarity */}
          {data.sections?.offerClarity && (data.sections.offerClarity.insight || data.sections.offerClarity.recommendation) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Offer Clarity</Text>
              </View>
              <View style={styles.sectionContent}>
                {data.sections.offerClarity.insight && (
                  <View style={styles.column}>
                    <Text style={styles.columnTitle}>INSIGHT</Text>
                    <Text style={styles.columnText}>{data.sections.offerClarity.insight}</Text>
                  </View>
                )}
                {data.sections.offerClarity.recommendation && (
                  <View style={styles.columnLast}>
                    <Text style={styles.columnTitle}>RECOMMENDATION</Text>
                    <Text style={styles.columnText}>{data.sections.offerClarity.recommendation}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Connection & Trust */}
          {data.sections?.connectionTrust && (data.sections.connectionTrust.insight || data.sections.connectionTrust.recommendation) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Connection & Trust</Text>
              </View>
              <View style={styles.sectionContent}>
                {data.sections.connectionTrust.insight && (
                  <View style={styles.column}>
                    <Text style={styles.columnTitle}>INSIGHT</Text>
                    <Text style={styles.columnText}>{data.sections.connectionTrust.insight}</Text>
                  </View>
                )}
                {data.sections.connectionTrust.recommendation && (
                  <View style={styles.columnLast}>
                    <Text style={styles.columnTitle}>RECOMMENDATION</Text>
                    <Text style={styles.columnText}>{data.sections.connectionTrust.recommendation}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Page>

      {/* PAGE 5: Content Opportunities & Footer */}
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Content Opportunities */}
          {data.sections?.contentOpportunities && (data.sections.contentOpportunities.insight || data.sections.contentOpportunities.recommendation) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Content Opportunities</Text>
              </View>
              <View style={styles.sectionContent}>
                {data.sections.contentOpportunities.insight && (
                  <View style={styles.column}>
                    <Text style={styles.columnTitle}>INSIGHT</Text>
                    <Text style={styles.columnText}>{data.sections.contentOpportunities.insight}</Text>
                  </View>
                )}
                {data.sections.contentOpportunities.recommendation && (
                  <View style={styles.columnLast}>
                    <Text style={styles.columnTitle}>RECOMMENDATION</Text>
                    <Text style={styles.columnText}>{data.sections.contentOpportunities.recommendation}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* CTA SECTION */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Ready to Elevate Your Brand Advantage?</Text>
            <Text style={styles.ctaText}>
              Book your free consultation with our expert brand strategists and turn these insights into action.
            </Text>
            <Link src="https://leftrightlabs.com/start">
              <View style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>BOOK YOUR CALL</Text>
              </View>
            </Link>
          </View>
          
          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.disclaimer}>
              This report was generated using advanced AI analysis based on publicly available website content.
              While care is taken to provide accurate and relevant insights, this report may contain errors,
              omissions, or generalized recommendations. For tailored strategy or functionality recommendations,
              we recommend a human-led review with our expert brand strategists. Contact us to book your
              in-depth consultation.
            </Text>
            <Text style={styles.brandFooter}>
              © 2025 Brand Advantage Toolkit™ by Left Right Labs. All rights reserved.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default WebsiteAuditPDF;