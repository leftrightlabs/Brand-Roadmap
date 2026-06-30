"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Globe, Brain, MessageSquare, CheckCircle2 } from "lucide-react";

const ANALYSIS_STEPS = [
  { icon: Globe, label: "Gathering and reviewing your website's content and structure" },
  { icon: Brain, label: "Evaluating visual identity, tone, and overall brand consistency" },
  { icon: MessageSquare, label: "Building your personalized Brand Advantage™ Roadmap with sequenced next moves" },
];

export default function AnalyzingPage() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Smoothly-animated progress for display. The server-side progress is coarse
  // and parks during the model call, so we drive a time-based estimate instead.
  const [progress, setProgress] = useState(0);

  const activeStep = progress < 40 ? 0 : progress < 80 ? 1 : 2;

  const getReportUrl = (shortId: string) => `/start/report/${shortId}`;
  const getWebsiteInputUrl = () => `/start/info`;

  // Animate the progress bar while analyzing: ease toward 95% over the expected
  // duration, then hold until the poll confirms completion (which snaps to 100).
  useEffect(() => {
    if (!isAnalyzing) return;
    const start = Date.now();
    const EST_MS = 80000; // expected analysis duration (~70-90s)
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / EST_MS);
      const eased = 1 - Math.pow(1 - t, 2); // ease-out: quick start, slow finish
      const target = Math.min(95, Math.round(eased * 95));
      setProgress((prev) => (target > prev ? target : prev));
    }, 400);
    return () => clearInterval(id);
  }, [isAnalyzing]);

  useEffect(() => {
    // Get form data from session storage and start analysis
    const storedFormData = sessionStorage.getItem("webAuditFormData");
    if (storedFormData) {
      try {
        const formData = JSON.parse(storedFormData);
        // Validate that we have required fields
        if (formData.name && formData.email && formData.websiteUrl) {
          setAnalysisData(formData);
          startAnalysisFromForm(formData);
        } else {
          console.error("[ANALYZING] Missing required fields in form data:", formData);
          toast({
            title: "Missing Information",
            description: "Please complete all required fields and try again.",
            variant: "destructive",
          });
          router.replace(getWebsiteInputUrl());
        }
      } catch (error) {
        console.error("[ANALYZING] Error parsing form data:", error);
        router.replace("/start/info");
      }
    } else {
      // Check if there's existing analysis data (for backward compatibility)
      const storedAnalysis = sessionStorage.getItem("webAuditAnalysis");
      if (storedAnalysis) {
        try {
          const data = JSON.parse(storedAnalysis);
          if (data.shortId) {
            setAnalysisData(data);
            startAnalysis(data.shortId);
          } else {
            console.error("[ANALYZING] Missing shortId in analysis data");
            router.replace(getWebsiteInputUrl());
          }
        } catch (error) {
          console.error("[ANALYZING] Error parsing analysis data:", error);
          router.replace(getWebsiteInputUrl());
        }
      } else {
        // Redirect back to website input if no data
        console.warn("[ANALYZING] No form data or analysis data found in sessionStorage");
        router.replace("/start/info");
      }
    }
  }, [router]);

  const startAnalysisFromForm = async (formData: any) => {
    setIsAnalyzing(true);

    try {
      // Forward the founder intake (the five tailoring questions) to the API.
      const apiPayload = {
        name: formData.name,
        email: formData.email,
        websiteUrl: formData.websiteUrl,
        brandStage: formData.brandStage || '',
        primaryGoal: formData.primaryGoal || '',
        idealClient: formData.idealClient || '',
        primaryOffer: formData.primaryOffer || '',
        biggestGap: formData.biggestGap || '',
      };

      console.log("[ANALYZING] Starting analysis with payload:", { ...apiPayload, email: apiPayload.email ? '***' : undefined });
      console.log("[ANALYZING] Current URL:", window.location.href);
      console.log("[ANALYZING] API endpoint:", "/api/web-audit/start-analysis");
      
      // Start the analysis
      let response;
      try {
        response = await fetch("/api/web-audit/start-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiPayload),
        });
        console.log("[ANALYZING] API response status:", response.status, response.statusText);
        console.log("[ANALYZING] API response headers:", Object.fromEntries(response.headers.entries()));
      } catch (fetchError) {
        console.error("[ANALYZING] Fetch error:", fetchError);
        setIsAnalyzing(false);
        toast({
          title: "Network Error",
          description: `Unable to connect to the server. Error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}. Please check your connection and try again.`,
          variant: "destructive",
        });
        return;
      }

      if (response.ok) {
        let data;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            data = await response.json();
          } else {
            const text = await response.text();
            console.error("[ANALYZING] Non-JSON response:", text);
            throw new Error("Invalid response format from server");
          }
        } catch (parseError) {
          console.error("[ANALYZING] Error parsing response:", parseError);
          setIsAnalyzing(false);
          toast({
            title: "Couldn't Start Building Your Roadmap",
            description: "The server returned an invalid response. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        // Validate that we got a shortId
        if (!data.shortId) {
          console.error("[ANALYZING] No shortId in response:", data);
          setIsAnalyzing(false);
          toast({
            title: "Couldn't Start Building Your Roadmap",
            description: "We couldn't start building your roadmap. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        console.log("[ANALYZING] Analysis started successfully, shortId:", data.shortId);
        
        // Store the shortId for polling
        sessionStorage.setItem("webAuditAnalysis", JSON.stringify({
          shortId: data.shortId,
          websiteUrl: formData.websiteUrl,
        }));
        
        // Subscribe to ActiveCampaign with the actual shortId (non-blocking)
        if (formData.name && formData.email && data.shortId) {
          // Fire and forget - don't wait for ActiveCampaign to complete
          import('@/lib/activecampaign-client').then(({ subscribeStartLead }) => {
            subscribeStartLead({
              name: formData.name,
              email: formData.email,
              websiteUrl: formData.websiteUrl,
              primaryGoal: formData.primaryGoal,
              industry: formData.industry,
              targetAudience: formData.targetAudience,
              brandPersonality: formData.brandPersonality,
              marketingCampaigns: formData.marketingCampaigns,
              improvementFocus: formData.improvementFocus,
              shortId: data.shortId,
            }).then(acResult => {
              if (!acResult.success) {
                console.warn('ActiveCampaign subscription failed:', acResult.message);
              }
            }).catch(error => {
              console.error('ActiveCampaign subscription error:', error);
            });
          });
        }
        
        // Start polling for results immediately
        startAnalysis(data.shortId);
      } else {
        let errorData;
        try {
          const text = await response.text();
          try {
            errorData = JSON.parse(text);
          } catch {
            errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error("[ANALYZING] API error response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: response.url,
          formData: { ...formData, email: formData.email ? '***' : undefined }
        });
        
        // Handle case where user already has a report
        if (response.status === 409 && errorData.existingShortId) {
          toast({
            title: "Roadmap Already Exists",
            description: "You've already received your Brand Advantage™ Roadmap. Redirecting you to it now...",
            variant: "destructive",
          });
          
          // Redirect to the existing report
          setTimeout(() => {
            router.push(getReportUrl(errorData.existingShortId));
          }, 2000);
          return;
        }
        
        // Don't redirect on error - show error message instead
        setIsAnalyzing(false);
        toast({
          title: "Couldn't Start Building Your Roadmap",
          description: errorData.error || "Failed to start building your roadmap. Please check your information and try again.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("[ANALYZING] Submit error:", error);
      setIsAnalyzing(false);
      toast({
        title: "Submit Failed",
        description: error instanceof Error ? error.message : "Failed to submit form. Please try again.",
        variant: "destructive",
      });
      // Don't redirect on error - let user see the error and try again
      return;
    }
  };

  const startAnalysis = async (shortId: string) => {
    if (!shortId) {
      console.error("[ANALYZING] No shortId provided to startAnalysis");
      return;
    }

    console.log("[ANALYZING] Starting to poll for results, shortId:", shortId);

    let lastProgressUpdate = Date.now();
    const startTime = Date.now();
    const maxStallTime = 90000; // 1.5 minutes without progress update (increased for detailed analysis)
    const maxTotalTime = 300000; // 5 minutes total (increased to match Vercel timeout)
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    // Wait a moment before first poll to allow report to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start polling for analysis results
    const pollInterval = setInterval(async () => {
      try {
        const url = `/api/web-audit/check-results/${shortId}`;
        console.log("[ANALYZING] Polling for results:", url, "from:", window.location.href);
        
        let response;
        try {
          response = await fetch(url, {
            signal: AbortSignal.timeout(10000) // 10 second timeout for each request
          });
        } catch (fetchError) {
          console.error("[ANALYZING] Fetch error during polling:", fetchError);
          throw fetchError; // Re-throw to be caught by outer catch
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log("[ANALYZING] Poll response:", { status: data.status, progress: data.progress });
          
          consecutiveErrors = 0; // Reset error counter on success
          
          if (data.status === "completed") {
            clearInterval(pollInterval);
            setProgress(100);
            console.log("[ANALYZING] Analysis completed, redirecting to report");

            // Store results for the report page
            sessionStorage.setItem("webAuditResults", JSON.stringify(data.results));
            
            // Fire GA4 conversion event
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'assessment_complete', {
                event_category: 'conversion',
                event_label: 'Brand Assessment Completed',
                value: 1,
                // Optional: include additional data
                brand_name: data.results?.brandName || 'Unknown',
                short_id: shortId
              });
              console.log("[ANALYZING] GA4 conversion event fired: assessment_complete");
            }
            
            // Fire Clarity conversion event for assessment completion
            if (typeof window !== 'undefined' && window.clarity) {
              window.clarity("set", "conversion", "assessment_complete");
              console.log("[ANALYZING] Clarity conversion event fired: assessment_complete");
            }
            
            // Redirect to results page
            router.push(getReportUrl(shortId));
          } else if (data.status === "failed") {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            console.error("[ANALYZING] Analysis failed:", data.error);
            toast({
              title: "Roadmap Build Failed",
              description: data.error || "We couldn't finish building your roadmap. Please try again.",
              variant: "destructive",
            });
            router.push(getWebsiteInputUrl());
          } else {
            // Analysis is still in progress, continue polling
            lastProgressUpdate = Date.now(); // Reset the stall timer
            console.log("[ANALYZING] Analysis in progress:", data.progress + "%");
          }
        } else if (response.status === 409) {
          // Handle rate limiting - user already has a report
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          const errorData = await response.json();
          console.log("[ANALYZING] Report already exists:", errorData);
          toast({
            title: "Roadmap Already Exists",
            description: errorData.message || "You already have a Brand Roadmap for this email address.",
            variant: "destructive",
          });
          router.push("/start/info");
        } else if (response.status === 404) {
          // Report not found - might be a timing issue, wait a bit and retry
          console.warn("[ANALYZING] Report not found (404), might be timing issue, will retry");
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            // After 3 consecutive 404s, it's probably a real issue
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            toast({
              title: "Roadmap Not Found",
              description: "Your Brand Roadmap could not be found. Please start a new one.",
              variant: "destructive",
            });
            router.push(getWebsiteInputUrl());
            return;
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check for stall timeout
        if (Date.now() - lastProgressUpdate > maxStallTime) {
          // Try to force-complete the analysis first
          try {
            const forceResponse = await fetch(`/api/web-audit/force-complete/${shortId}`, {
              method: 'POST',
              signal: AbortSignal.timeout(10000)
            });
            
            if (forceResponse.ok) {
              // Check the results again
              const finalCheckResponse = await fetch(`/api/web-audit/check-results/${shortId}`);
              if (finalCheckResponse.ok) {
                const finalData = await finalCheckResponse.json();
                if (finalData.status === "completed") {
                  clearInterval(pollInterval);
                  
                  // Store results for the report page
                  sessionStorage.setItem("webAuditResults", JSON.stringify(finalData.results));
                  
                  // Redirect to results page
                  router.push(getReportUrl(shortId));
                  return;
                }
              }
            }
          } catch (forceError) {
            console.error("[ANALYZING] Error attempting force-complete:", forceError);
          }
          
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          
          toast({
            title: "Roadmap Build Stalled",
            description: "Building your roadmap appears to have stalled. This might be due to server load. Please try again in a few minutes.",
            variant: "destructive",
          });
          router.push("/start/info");
          return;
        }

        // Check for total timeout
        if (Date.now() - startTime > maxTotalTime) {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          toast({
            title: "Roadmap Build Timeout",
            description: "Building your roadmap is taking longer than expected. This might be due to server load. Please try again in a few minutes.",
            variant: "destructive",
          });
          router.push("/start/info");
          return;
        }
      } catch (error) {
        consecutiveErrors++;
        console.error(`[ANALYZING] Analysis polling error (attempt ${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
        
        // Check if this is a timeout error - these are less critical
        if (error instanceof Error && error.name === 'TimeoutError') {
          console.warn("[ANALYZING] Request timeout, will retry");
          // Don't count timeouts as critical errors, but still increment counter
          if (consecutiveErrors >= maxConsecutiveErrors * 2) {
            // Only fail after double the errors if it's just timeouts
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            toast({
              title: "Request Timeout",
              description: "Building your roadmap is taking longer than expected. Please try again in a moment.",
              variant: "destructive",
            });
            router.push(getWebsiteInputUrl());
            return;
          }
          return; // Continue polling
        }
        
        // Check if this is a network error and we should retry
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
          console.warn("[ANALYZING] Network error, will retry");
          // Don't count network errors as critical immediately
          if (consecutiveErrors >= maxConsecutiveErrors * 2) {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            toast({
              title: "Connection Issues",
              description: "Unable to connect to our roadmap-building service. Please check your internet connection and try again.",
              variant: "destructive",
            });
            router.push(getWebsiteInputUrl());
            return;
          }
          return; // Continue polling
        }
        
        // Check if we've had too many consecutive errors (for non-network errors)
        if (consecutiveErrors >= maxConsecutiveErrors) {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          toast({
            title: "Connection Issues",
            description: "Unable to connect to our roadmap-building service. Please check your internet connection and try again.",
            variant: "destructive",
          });
          router.push("/start/info");
          return;
        }
        
        // For other errors, wait a bit longer before the next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }, 1000); // Poll every 1 second

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#112248] flex items-center justify-center p-4">
      <div className="relative z-10 max-w-xl mx-auto w-full pt-16 pb-16">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="h1-form-title font-heading text-white mb-4 leading-tight">
            Building Your Brand Roadmap
          </h1>
          <div className="w-16 h-0.5 bg-[#a7c140] mx-auto mb-4" />
          <p className="text-base md:text-lg text-white/60 max-w-md mx-auto">
            Our strategy-trained AI is mapping where your brand has drifted and sequencing the specific moves to re-align it. This takes about 2 minutes.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
        >
          <Card className="p-8 md:p-10 bg-white rounded-3xl border-0 shadow-2xl">
            <div className="text-center">
              {/* Progress */}
              <div className="mb-8">
                <div className="flex justify-center mb-5">
                  <Loader2 className="w-12 h-12 text-[#a7c140] animate-spin" />
                </div>
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm font-medium text-[#112248]">Building your roadmap…</span>
                    <span className="text-sm font-semibold text-[#112248] tabular-nums">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#112248]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#a7c140] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Analysis Steps */}
              <div className="space-y-4 text-left max-w-lg mx-auto">
                {ANALYSIS_STEPS.map((step, i) => {
                  const done = i < activeStep;
                  const active = i === activeStep;
                  const Icon = step.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center space-x-4 p-4 rounded-lg border-l-4 transition-all duration-300 ${
                        active
                          ? "bg-[#a7c140]/10 border-[#a7c140]"
                          : done
                          ? "bg-[#112248]/[0.03] border-[#a7c140]/40"
                          : "bg-[#112248]/[0.03] border-transparent opacity-50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          active || done ? "bg-[#a7c140]" : "bg-[#112248]/20"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className={`w-5 h-5 text-white ${active ? "animate-pulse" : ""}`} />
                        )}
                      </div>
                      <span className="text-gray-700 font-medium">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Reassurance */}
              <p className="mt-8 text-sm text-gray-500 max-w-md mx-auto">
                Our AI Brand Strategist is analyzing your brand and sequencing the plan you&apos;ll use to Get Clear, Get Noticed, and Get Paid™. This usually takes a minute or two.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 