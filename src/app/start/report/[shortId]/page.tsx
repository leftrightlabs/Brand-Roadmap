"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Share2, 
  Download, 
  Mail, 
  Target, 
  Palette, 
  Users, 
  MousePointer, 
  Gift, 
  Shield, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight,
  Globe,
  TrendingUp,
  Award,
  Quote,
  Copy
} from "lucide-react";

import { parseAuditResponse, ParsedAuditData } from "@/lib/audit-parser";

interface AssessmentResults {
  shortId: string;
  websiteUrl: string;
  leadName?: string;
  leadEmail?: string;
  summary?: string;
  overallGrade?: string;
  // Error handling
  error?: string;
  status?: string;
  // Raw AI response
  rawAnalysis?: string;
  rawResponse?: string | { initial: string; detailed: string };
  formattedAnalysis?: string;
  // Simple AI response format
  brandMessaging?: {
    quote?: string;
    evaluation?: string;
    recommendation?: string;
  };
  visualIdentity?: {
    description?: string;
    colors?: string[];
    fonts?: string[];
    recommendation?: string;
  };
  userJourney?: {
    navigation?: string;
    cta?: string;
    recommendation?: string;
  };
  callsToAction?: {
    ctas?: string[];
    evaluation?: string;
    recommendation?: string;
  };
  offerClarity?: {
    product?: string;
    description?: string;
    evaluation?: string;
    recommendation?: string;
  };
  connectionTrust?: {
    elements?: string[];
    weaknesses?: string[];
    recommendation?: string;
  };
  contentOpportunities?: {
    suggestion?: string;
    placement?: string;
    rationale?: string;
  };
  strengths?: string[];
  weaknesses?: string[];
  actionableSteps?: string[];
  nextSteps?: string[];
  additionalSuggestions?: string[];
}

// Function to check if text contains raw JSON
function containsRawJSON(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

// Function to parse the AI response using the new parser utility
function parseNewAIResponse(rawResponse: string): ParsedAuditData | null {
  if (!rawResponse) return null;
  
  try {
    const parsedData = parseAuditResponse(rawResponse);
    return parsedData;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return null;
  }
}

// Function to break long text into readable paragraphs
function formatAsParas(text: string): string[] {
  if (!text) return [''];
  // Split on explicit double-newlines first
  const explicit = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;
  // Single block — split at sentence boundaries, group into 2-sentence chunks
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
  if (sentences.length <= 2) return [text];
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    groups.push(sentences.slice(i, i + 2).join(' ').trim());
  }
  return groups;
}

// Function to create fallback parsed data from structured results
function createFallbackFromStructuredData(results: any): ParsedAuditData {
  // Check if summary contains raw JSON and avoid using it
  let executiveSummary = 'Executive summary not available.';
  if (results.summary && !containsRawJSON(results.summary)) {
    executiveSummary = results.summary;
  }
  
  return {
    executiveSummary: executiveSummary,
    sections: {
      brandMessaging: {
        insight: results.brandMessaging?.evaluation || 'Brand messaging analysis not available.',
        recommendation: results.brandMessaging?.recommendation || 'Recommendations not available.'
      },
      visualIdentity: {
        insight: results.visualIdentity?.description || 'Visual identity analysis not available.',
        recommendation: results.visualIdentity?.recommendation || 'Visual recommendations not available.'
      },
      userJourney: {
        insight: results.userJourney?.navigation || 'User journey analysis not available.',
        recommendation: results.userJourney?.recommendation || 'UX recommendations not available.'
      },
      callsToAction: {
        insight: results.callsToAction?.evaluation || 'CTA analysis not available.',
        recommendation: results.callsToAction?.recommendation || 'CTA recommendations not available.'
      },
      offerClarity: {
        insight: results.offerClarity?.evaluation || 'Offer clarity analysis not available.',
        recommendation: results.offerClarity?.recommendation || 'Clarity recommendations not available.'
      },
      connectionTrust: {
        insight: results.connectionTrust?.elements?.join(', ') || results.connectionTrust?.weaknesses?.join(', ') || 'Trust analysis not available.',
        recommendation: results.connectionTrust?.recommendation || 'Trust recommendations not available.'
      },
      contentOpportunities: {
        insight: results.contentOpportunities?.suggestion || 'Content opportunities not available.',
        recommendation: results.contentOpportunities?.rationale || 'Content recommendations not available.'
      }
    },
    metadata: {
      parsedAt: new Date().toISOString(),
      version: '1.0',
      sectionsFound: 7
    }
  };
}

export default function ReportPage({ params }: { params: Promise<{ shortId: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);
  const [rawAIResponse, setRawAIResponse] = useState<string>("");
  const [parsedResults, setParsedResults] = useState<ParsedAuditData | null>(null);
  const [shortId, setShortId] = useState<string>("");

  // Scroll animations
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 300], [0, -50]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const cardHoverVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3
      }
    }
  };

  const buttonHoverVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity
      }
    }
  };

  // Suppress Supabase auth console errors globally on this public route
  useEffect(() => {
    // Check if we're on a public route that shouldn't show auth errors
    const isPublicRoute = window.location.pathname.startsWith('/start/');
    
    if (!isPublicRoute) return;

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    // Create a comprehensive error suppression function
    const shouldSuppressMessage = (args: any[]) => {
      const firstArg = args[0];
      
      // Handle string messages
      if (typeof firstArg === 'string') {
        return firstArg.includes('Auth session missing') || 
               firstArg.includes('AuthSessionMissingError') ||
               firstArg.includes('No session found') ||
               firstArg.includes('session from storage null') ||
               firstArg.includes('SIGNED_OUT') ||
               firstArg.includes('[Supabase] Auth state change: INITIAL_SESSION undefined');
      }
      
      // Handle error objects
      if (firstArg && typeof firstArg === 'object') {
        return firstArg.name === 'AuthSessionMissingError' ||
               firstArg.message?.includes('Auth session missing') ||
               firstArg.message?.includes('No session found');
      }
      
      // Check all arguments for auth-related content
      return args.some(arg => {
        if (typeof arg === 'string') {
          return arg.includes('Auth session missing') || 
                 arg.includes('AuthSessionMissingError') ||
                 arg.includes('No session found');
        }
        if (arg && typeof arg === 'object' && arg.name) {
          return arg.name === 'AuthSessionMissingError';
        }
        return false;
      });
    };
    
    // Intercept all console methods
    console.error = (...args: any[]) => {
      if (shouldSuppressMessage(args)) return;
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (shouldSuppressMessage(args)) return;
      originalConsoleWarn.apply(console, args);
    };

    console.log = (...args: any[]) => {
      if (shouldSuppressMessage(args)) return;
      originalConsoleLog.apply(console, args);
    };

    // Also intercept window.onerror for uncaught errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === 'string' && shouldSuppressMessage([message])) {
        return true; // Suppress the error
      }
      if (originalOnError) {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Cleanup function
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
      if (originalOnError) {
        window.onerror = originalOnError;
      } else {
        window.onerror = null;
      }
    };
  }, []);

  // Await params and set shortId
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setShortId(resolvedParams.shortId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (shortId) {
      loadResults();
    }
  }, [shortId]);

  useEffect(() => {
    if (results?.websiteUrl) {
      const updateMetaTag = (name: string, content: string) => {
        const meta = document.querySelector(`meta[name="${name}"]`) || 
                    document.querySelector(`meta[property="${name}"]`);
        if (meta) {
          meta.setAttribute('content', content);
        }
      };

      updateMetaTag('og:title', `Brand Strategy Assessment - ${results.websiteUrl}`);
      updateMetaTag('og:description', results.summary || 'Comprehensive brand strategy analysis');
      updateMetaTag('og:url', window.location.href);
      if (ogImageUrl) {
        updateMetaTag('og:image', ogImageUrl);
      }
    }
  }, [results, ogImageUrl]);

  const loadResults = async () => {
    try {
      // First, get the basic report info to get the website URL
      const response = await fetch(`/api/web-audit/check-results/${shortId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "completed") {
          setResults(data.results);
          
          // Try to parse the raw response if available
          const rawResponse = data.results.rawResponse;
          if (rawResponse) {
            // Handle both old string format and new object format
            let rawAnalysisText: string;
            if (typeof rawResponse === 'string') {
              rawAnalysisText = rawResponse;
            } else if (rawResponse && typeof rawResponse === 'object' && 'detailed' in rawResponse) {
              // New format: { initial: ..., detailed: ... }
              rawAnalysisText = rawResponse.detailed || rawResponse.initial || '';
            } else {
              rawAnalysisText = '';
            }
            
            if (rawAnalysisText) {
              
              setRawAIResponse(rawAnalysisText);
              
              // Try to parse the raw analysis using our parser
              const parsedSections = parseNewAIResponse(rawAnalysisText);
            if (parsedSections && parsedSections.executiveSummary !== 'Executive summary not available.' && parsedSections.metadata.sectionsFound > 0) {
              setParsedResults(parsedSections);
            } else {
              // Create fallback parsed data from the structured results
              const fallbackData = createFallbackFromStructuredData(data.results);
              setParsedResults(fallbackData);
            }
          }
        } else {
          // Create fallback parsed data from the structured results
          const fallbackData = createFallbackFromStructuredData(data.results);
          setParsedResults(fallbackData);
        }
          
          // Fetch OG image if we have a website URL
          if (data.results.websiteUrl) {
            try {
              const ogResponse = await fetch(`/api/og-image?url=${encodeURIComponent(data.results.websiteUrl)}`);
              if (ogResponse.ok) {
                const ogData = await ogResponse.json();
                if (ogData.ogImage) {
                  setOgImageUrl(ogData.ogImage);
                }
              }
            } catch (error) {
              console.error("Error fetching OG image:", error);
            }
          }
        } else if (data.status === "failed") {
          toast({
            title: "Analysis Failed",
            description: data.error || "The analysis could not be completed. Please try again.",
            variant: "destructive",
          });
          // Don't redirect, show error state
          setResults({
            shortId: shortId,
            websiteUrl: data.websiteUrl,
            error: data.error || "Analysis failed due to a timeout. Please try again.",
            status: "failed"
          });
        } else {
          // Still processing, redirect to analyzing page
          router.push("/start/analyzing");
          return;
        }
      } else {
        const errorData = await response.json();
        
        // Check if report has expired
        if (response.status === 410 && errorData.expired) {
          router.push(`/start/expired/${shortId}`);
          return;
        }
        
        toast({
          title: "Error Loading Report",
          description: errorData.error || "Failed to load the report.",
          variant: "destructive",
        });
        router.push("/start");
      }
    } catch (error) {
      console.error("Load results error:", error);
      toast({
        title: "Error Loading Report",
        description: "Failed to load the report. Please try again.",
        variant: "destructive",
      });
      router.push("/start");
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const url = `${window.location.origin}/start/report/${shortId}`;
      setShareUrl(url);
      
      // Use native sharing (like iOS share sheet)
      if (navigator.share && navigator.canShare && navigator.canShare({ text: 'test' })) {
        await navigator.share({
          text: `🚀 Check out my free Brand Roadmap!\n${url}\n\nWant your own roadmap with the specific moves to re-align your brand? Get one at roadmap.leftrightlabs.com.`,
        });
      } else {
        // Fallback for desktop browsers without native sharing
        toast({
          title: "Native Sharing Not Available",
          description: "Your browser doesn't support native sharing. Use 'Copy Link' instead.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the share
        toast({
          title: "Share Cancelled",
          description: "Sharing was cancelled.",
        });
      } else {
        toast({
          title: "Share Failed",
          description: "Failed to share the report. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/start/report/${shortId}`;
      setShareUrl(url);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Report link has been copied to your clipboard.",
        });
      } else {
        // Fallback for older browsers
        await fallbackCopyToClipboard(url);
      }
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy the link. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fallback copy function for older browsers
  const fallbackCopyToClipboard = async (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast({
          title: "Link Copied",
          description: "Report link has been copied to your clipboard.",
        });
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      console.error("Fallback copy failed:", error);
      // Show the URL in an alert as last resort
      alert(`Copy this link: ${text}`);
      toast({
        title: "Link Ready",
        description: "The link has been displayed in a popup for manual copying.",
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!results) {
        throw new Error('No results available for download');
      }
      
      // Create filename with domain
      const domain = new URL(results.websiteUrl).hostname.replace('www.', '');
      const filename = `Brand-Strategy-Assessment-${domain}.pdf`;
      
      const response = await fetch(`/api/web-audit/download-pdf/${shortId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "PDF Downloaded",
          description: "Your brand strategy assessment has been downloaded.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download PDF');
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailReport = async () => {
    try {
      const response = await fetch(`/api/web-audit/email-report/${shortId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: results?.leadEmail || '',
          name: results?.leadName || '',
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Report Sent",
          description: "Your brand strategy assessment has been sent to your email.",
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error("Email error:", error);
      toast({
        title: "Email Failed",
        description: "Failed to send the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#112248] flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a7c140] mx-auto mb-4" />
          <p className="text-white/80">Loading your brand strategy assessment...</p>
          <div className="mt-4 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[#a7c140]/60 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!results || results.status === "failed") {
    return (
      <div className="min-h-screen bg-[#112248] flex items-center justify-center px-4">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-heading font-semibold text-white mb-2">Analysis Failed</h2>
          <p className="text-white/70 mb-6">
            {results?.error || "Report not found or has expired."}
            {results?.websiteUrl && (
              <>
                <br />
                <span className="text-sm">Website: {results.websiteUrl}</span>
              </>
            )}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.div variants={buttonHoverVariants} whileHover="hover" whileTap="tap">
              <Button
                onClick={() => router.push("/start")}
                className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248]"
              >
                Start New Assessment
              </Button>
            </motion.div>
            {results?.status === "failed" && (
              <motion.div variants={buttonHoverVariants} whileHover="hover" whileTap="tap">
                <Button
                  onClick={() => loadResults()}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Build report sections array for clean iteration
  const reportSections = parsedResults ? [
    { id: 'brand-messaging', icon: Target, title: 'Brand Messaging', insight: parsedResults.sections.brandMessaging?.insight, recommendation: parsedResults.sections.brandMessaging?.recommendation },
    { id: 'visual-identity', icon: Palette, title: 'Visual Identity', insight: parsedResults.sections.visualIdentity?.insight, recommendation: parsedResults.sections.visualIdentity?.recommendation },
    { id: 'user-journey', icon: Users, title: 'User Journey & UX', insight: parsedResults.sections.userJourney?.insight, recommendation: parsedResults.sections.userJourney?.recommendation },
    { id: 'calls-to-action', icon: MousePointer, title: 'Calls-to-Action', insight: parsedResults.sections.callsToAction?.insight, recommendation: parsedResults.sections.callsToAction?.recommendation },
    { id: 'offer-clarity', icon: Gift, title: 'Offer Clarity', insight: parsedResults.sections.offerClarity?.insight, recommendation: parsedResults.sections.offerClarity?.recommendation },
    { id: 'connection-trust', icon: Shield, title: 'Connection & Trust', insight: parsedResults.sections.connectionTrust?.insight, recommendation: parsedResults.sections.connectionTrust?.recommendation },
    { id: 'content-opportunities', icon: Lightbulb, title: 'Content Opportunities', insight: parsedResults.sections.contentOpportunities?.insight, recommendation: parsedResults.sections.contentOpportunities?.recommendation },
  ].filter(s => s.insight) : [];

  // Fallback sections from structured data
  const fallbackSections = !parsedResults && results ? [
    { id: 'brand-messaging', icon: Target, title: 'Brand Messaging', data: results.brandMessaging },
    { id: 'visual-identity', icon: Palette, title: 'Visual Identity', data: results.visualIdentity },
    { id: 'user-journey', icon: Users, title: 'User Journey', data: results.userJourney },
    { id: 'calls-to-action', icon: MousePointer, title: 'Calls-to-Action', data: results.callsToAction },
    { id: 'offer-clarity', icon: Gift, title: 'Offer Clarity', data: results.offerClarity },
    { id: 'connection-trust', icon: Shield, title: 'Connection & Trust', data: results.connectionTrust },
    { id: 'content-opportunities', icon: Lightbulb, title: 'Content Opportunities', data: results.contentOpportunities },
  ].filter(s => s.data) : [];

  const activeSections = reportSections.length > 0 ? reportSections : fallbackSections;

  return (
    <div className="min-h-screen bg-white report-page">

      {/* ── HEADER ── */}
      <header className="bg-[#112248] text-white pt-10 md:pt-14 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-[1fr_300px] gap-10 items-center"
          >
            {/* Left: Title + Buttons */}
            <div>
              <div className="font-heading-transform">
                <h1 className="text-2xl md:text-[30px] font-heading text-white mb-2 whitespace-nowrap">
                  Your Brand Advantage
                </h1>
              </div>
              <div className="w-16 h-0.5 bg-[#a7c140] my-4" />
              <p className="text-base text-white/50 mb-6">
                Comprehensive analysis of {results.websiteUrl}
              </p>

              <div className="flex gap-3 flex-wrap mb-4">
                <Button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248] border-0 font-bold uppercase tracking-wider text-sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {isSharing ? "Sharing..." : "Share Report"}
                </Button>
                <Button
                  onClick={handleCopyLink}
                  className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248] border-0 font-bold uppercase tracking-wider text-sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>

              <p className="text-white/40 text-sm">
                This report will expire in 7 days.
              </p>
            </div>

            {/* Right: OG Image (natural aspect ratio) */}
            <div className="hidden md:block">
              {ogImageUrl ? (
                <div>
                  <img
                    src={ogImageUrl}
                    alt={`Screenshot of ${results.websiteUrl}`}
                    className="w-full rounded-lg shadow-lg border border-white/10"
                  />
                  <p className="text-white/30 text-xs mt-2 text-center">
                    What users see when your page is shared.
                  </p>
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-white/5 rounded-lg flex items-center justify-center">
                  <Globe className="w-10 h-10 text-white/20" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
        {/* Lime accent line at header base */}
        <div className="mt-10 h-[3px] bg-[#a7c140]" />
      </header>

      {/* ── TABLE OF CONTENTS ── */}
      <nav className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            <a
              href="#executive-summary"
              className="text-[13px] font-bold uppercase tracking-wider text-[#112248]/70 hover:text-[#112248] border-b-2 border-transparent hover:border-[#a7c140] transition-all whitespace-nowrap px-3 py-1"
            >
              Summary
            </a>
            {activeSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-[13px] font-bold uppercase tracking-wider text-[#112248]/70 hover:text-[#112248] border-b-2 border-transparent hover:border-[#a7c140] transition-all whitespace-nowrap px-3 py-1"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">

        {/* ── EXECUTIVE SUMMARY ── */}
        <motion.section
          id="executive-summary"
          className="mb-16 md:mb-20 scroll-mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-9 h-9 text-[#a7c140]" />
            <h2 className="text-2xl md:text-3xl font-heading text-[#112248]">
              Executive Summary
            </h2>
          </div>
          <div className="w-12 h-0.5 bg-[#a7c140] mb-8" />

          {/* Summary Text */}
          <div className="space-y-5">
            {formatAsParas(
              parsedResults?.executiveSummary ||
              (results.summary && !containsRawJSON(results.summary)
                ? results.summary
                : "Executive summary not available.")
            ).map((para, i) => (
              <p key={i} className="text-gray-700 text-[20px] leading-[1.4]">{para}</p>
            ))}
          </div>
        </motion.section>

        {/* ── REPORT SECTIONS ── */}
        {reportSections.length > 0 && reportSections.map((section, index) => (
          <motion.section
            key={section.id}
            id={section.id}
            className="mb-16 md:mb-20 scroll-mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-bold text-[#a7c140] tracking-wider font-heading">
                {String(index + 1).padStart(2, '0')}
              </span>
              <section.icon className="w-8 h-8 text-[#a7c140]" />
              <h2 className="text-2xl md:text-3xl font-heading text-[#112248]">
                {section.title}
              </h2>
            </div>
            <div className="w-12 h-0.5 bg-[#a7c140] mb-8" />

            {/* Insight */}
            <div className="mb-8">
              <h3 className="text-[1.2rem] font-bold uppercase tracking-[0.15em] text-[#112248]/40 mb-4">
                Insight
              </h3>
              <div className="space-y-4">
                {formatAsParas(section.insight || '').map((para, i) => (
                  <p key={i} className="text-gray-700 text-[20px] leading-[1.4]">{para}</p>
                ))}
              </div>
            </div>

            {/* Recommendation Callout */}
            {section.recommendation && (
              <div className="border-l-4 border-[#a7c140] bg-[#112248]/[0.03] rounded-r-lg p-6 md:p-8">
                <h3 className="text-[1.2rem] font-bold uppercase tracking-[0.15em] text-[#a7c140] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recommendation
                </h3>
                <div className="space-y-4">
                  {formatAsParas(section.recommendation).map((para, i) => (
                    <p key={i} className="text-gray-700 text-[20px] leading-[1.4]">{para}</p>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        ))}

        {/* ── FALLBACK SECTIONS ── */}
        {fallbackSections.length > 0 && fallbackSections.map((section, index) => (
          <motion.section
            key={section.id}
            id={section.id}
            className="mb-16 md:mb-20 scroll-mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-bold text-[#a7c140] tracking-wider font-heading">
                {String(index + 1).padStart(2, '0')}
              </span>
              <section.icon className="w-8 h-8 text-[#a7c140]" />
              <h2 className="text-2xl md:text-3xl font-heading text-[#112248]">
                {section.title}
              </h2>
            </div>
            <div className="w-12 h-0.5 bg-[#a7c140] mb-8" />

            {/* Content */}
            <div className="mb-8">
              <div className="space-y-4">
                {formatAsParas(
                  ("evaluation" in (section.data || {})
                    ? (section.data as any).evaluation
                    : "description" in (section.data || {})
                      ? (section.data as any).description
                      : "navigation" in (section.data || {})
                        ? (section.data as any).navigation
                        : "suggestion" in (section.data || {})
                          ? (section.data as any).suggestion
                          : "") || ''
                ).map((para, i) => (
                  <p key={i} className="text-gray-700 text-[20px] leading-[1.4]">{para}</p>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            {(section.data && ("recommendation" in section.data || "rationale" in section.data)) && (
              <div className="border-l-4 border-[#a7c140] bg-[#112248]/[0.03] rounded-r-lg p-6 md:p-8">
                <h3 className="text-[1.2rem] font-bold uppercase tracking-[0.15em] text-[#a7c140] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recommendation
                </h3>
                <div className="space-y-4">
                  {formatAsParas(
                    ("recommendation" in (section.data || {})
                      ? (section.data as any).recommendation
                      : "rationale" in (section.data || {})
                        ? (section.data as any).rationale
                        : "") || ''
                  ).map((para, i) => (
                    <p key={i} className="text-gray-700 text-[20px] leading-[1.4]">{para}</p>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        ))}
      </main>

      {/* ── FOOTER CTA ── */}
      <footer className="bg-[#112248] text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="font-heading-transform">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">
                Ready to Implement These Improvements?
              </h2>
            </div>
            <div className="w-16 h-0.5 bg-[#a7c140] mx-auto my-6" />
            <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Our team can help you implement these recommendations and transform your brand strategy.
            </p>
            <Button
              onClick={() => (window.location.href = "https://leftrightlabs.com/start")}
              size="lg"
              className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248] font-bold uppercase tracking-wider"
            >
              Schedule a Consultation
            </Button>
            <p className="text-xs text-white/40 max-w-xl mx-auto leading-relaxed mt-10">
              This report was generated using advanced AI analysis based on publicly available website content. While we&apos;ve trained our system to provide thoughtful and strategic insights, it may occasionally misinterpret layout, messaging, or functionality — especially if the site includes dynamic content or complex design elements.
              <br /><br />
              For the most accurate and tailored assessment, we recommend scheduling a human-led review with our expert brand strategists.{" "}
              <a
                href="https://leftrightlabs.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a7c140] underline hover:opacity-80 transition-opacity"
              >
                Contact us
              </a>{" "}
              to book your in-depth consultation.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
} 