"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Share2, Download, AlertTriangle, Globe, Copy, ArrowRight, Play } from "lucide-react";

import { BrandVenn } from "@/components/brand-venn";
import {
  PILLARS,
  AREA_LABELS,
  STATUS_STYLE,
  type AreaKey,
  type AreaStatus,
  type AreaEval,
  type RoadmapResults,
} from "@/lib/roadmap-types";

interface AssessmentResults extends Partial<RoadmapResults> {
  shortId: string;
  websiteUrl: string;
  leadName?: string;
  leadEmail?: string;
  status?: string;
  error?: string;
  generatedAt?: string;
}

const CONTENT = "max-w-[84rem] mx-auto px-6 md:px-10";

// Subtle, asset-free textures (dot grid + gradient) for premium alternating bands.
const DARK_BAND: CSSProperties = {
  backgroundColor: "#0c1838",
  backgroundImage:
    "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), radial-gradient(130% 100% at 50% -15%, #1b2f5e 0%, #102045 45%, #0c1838 100%)",
  backgroundSize: "22px 22px, 100% 100%",
};
const LIGHT_BAND: CSSProperties = {
  backgroundColor: "#f6f3ec",
  backgroundImage:
    "radial-gradient(rgba(17,34,72,0.04) 1px, transparent 1px), linear-gradient(180deg,#faf8f3,#f1eee4)",
  backgroundSize: "22px 22px, 100% 100%",
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const STATUS_UI: Record<AreaStatus, { text: string; border: string }> = {
  Strong: { text: "#5f7d18", border: "#A7C140" },
  Refine: { text: "#a9781f", border: "#E9BD6A" },
  Prioritize: { text: "#c0563a", border: "#E08363" },
};

function StrengthBar({ status }: { status: AreaStatus }) {
  const { segments, color } = STATUS_STYLE[status];
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 18, height: 5, borderRadius: 3, background: i < segments ? color : "rgba(17,34,72,0.12)" }} />
      ))}
    </span>
  );
}

function VideoBlock({ label, url, dark }: { label: string; url?: string; dark: boolean }) {
  return (
    <motion.div variants={fadeUp} className="mb-12 w-full max-w-3xl mx-auto">
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-xl"
        style={{ aspectRatio: "16 / 9", background: "#0E1B3D", border: dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(17,34,72,0.12)" }}
      >
        {url ? (
          <iframe
            src={url}
            title={`${label} lesson`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[#a7c140] flex items-center justify-center mb-4 shadow-lg">
              <Play className="w-7 h-7 text-[#112248] ml-1" fill="#112248" />
            </div>
            <p className="text-white font-heading text-xl mb-1">Watch: {label}</p>
            <p className="text-white/45 text-sm">Lesson video coming soon</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ReportPage({ params }: { params: Promise<{ shortId: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);
  const [shortId, setShortId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setShortId(resolvedParams.shortId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (shortId) loadResults();
  }, [shortId]);

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/web-audit/check-results/${shortId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "completed") {
          setResults(data.results);
          if (data.results.websiteUrl) {
            try {
              const ogResponse = await fetch(`/api/og-image?url=${encodeURIComponent(data.results.websiteUrl)}`);
              if (ogResponse.ok) {
                const ogData = await ogResponse.json();
                if (ogData.ogImage) setOgImageUrl(ogData.ogImage);
              }
            } catch (error) {
              console.error("Error fetching OG image:", error);
            }
          }
        } else if (data.status === "failed") {
          toast({ title: "Analysis Failed", description: data.error || "The analysis could not be completed. Please try again.", variant: "destructive" });
          setResults({ shortId, websiteUrl: data.websiteUrl, error: data.error || "Analysis failed. Please try again.", status: "failed" });
        } else {
          router.push("/start/analyzing");
          return;
        }
      } else {
        const errorData = await response.json();
        if (response.status === 410 && errorData.expired) {
          router.push(`/start/expired/${shortId}`);
          return;
        }
        toast({ title: "Error Loading Report", description: errorData.error || "Failed to load the report.", variant: "destructive" });
        router.push("/start");
      }
    } catch (error) {
      console.error("Load results error:", error);
      toast({ title: "Error Loading Report", description: "Failed to load the report. Please try again.", variant: "destructive" });
      router.push("/start");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const url = `${window.location.origin}/start/report/${shortId}`;
      if (navigator.share && navigator.canShare && navigator.canShare({ text: "test" })) {
        await navigator.share({ text: `🚀 Here's my Brand Roadmap!\n${url}\n\nGet your own at roadmap.leftrightlabs.com.` });
      } else {
        toast({ title: "Native Sharing Not Available", description: "Your browser doesn't support native sharing. Use 'Copy Link' instead.", variant: "destructive" });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast({ title: "Share Cancelled", description: "Sharing was cancelled." });
      } else {
        toast({ title: "Share Failed", description: "Failed to share the report. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/start/report/${shortId}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link Copied", description: "Report link has been copied to your clipboard." });
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast({ title: "Link Copied", description: "Report link has been copied to your clipboard." });
      }
    } catch {
      toast({ title: "Copy Failed", description: "Failed to copy the link. Please try again.", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!results) throw new Error("No results available for download");
      const domain = new URL(results.websiteUrl).hostname.replace("www.", "");
      const filename = `Brand-Roadmap-${domain}.pdf`;
      const response = await fetch(`/api/web-audit/download-pdf/${shortId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: "PDF Downloaded", description: "Your Brand Roadmap has been downloaded." });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download PDF");
      }
    } catch (error) {
      toast({ title: "Download Failed", description: error instanceof Error ? error.message : "Failed to download the PDF. Please try again.", variant: "destructive" });
    }
  };

  const scrollToArea = (area: AreaKey) => {
    document.getElementById(area)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#112248] flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a7c140] mx-auto mb-4" />
          <p className="text-white/80">Loading your Brand Roadmap...</p>
        </motion.div>
      </div>
    );
  }

  if (!results || results.status === "failed" || !results.pillars || !results.legacyRead) {
    return (
      <div className="min-h-screen bg-[#112248] flex items-center justify-center px-4">
        <motion.div className="text-center max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold text-white mb-2">Roadmap Unavailable</h2>
          <p className="text-white/70 mb-6">
            {results?.error || "This roadmap couldn't be loaded or needs to be regenerated."}
            {results?.websiteUrl && (<><br /><span className="text-sm">Website: {results.websiteUrl}</span></>)}
          </p>
          <Button onClick={() => router.push("/start")} className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248]">Start a New Roadmap</Button>
        </motion.div>
      </div>
    );
  }

  const statuses: Partial<Record<AreaKey, AreaStatus>> = {};
  PILLARS.forEach((p) => p.areas.forEach((a) => {
    const ev = results.pillars?.[p.key]?.areas?.[a];
    if (ev) statuses[a] = ev.status;
  }));

  return (
    <div className="min-h-screen bg-white report-page">
      {/* ── HEADER ── */}
      <header className="bg-[#112248] text-white pt-10 md:pt-14 overflow-hidden">
        <div className={CONTENT}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="grid md:grid-cols-[1fr_340px] gap-10 items-center">
            <div>
              <div className="font-heading-transform">
                <h1 className="text-2xl md:text-[36px] font-heading text-white mb-2 whitespace-nowrap">Your Brand Roadmap™</h1>
              </div>
              <div className="w-16 h-0.5 bg-[#a7c140] my-4" />
              <p className="text-base md:text-lg text-white/50 mb-6">The sequenced moves to re-align {results.websiteUrl}</p>
              <div className="flex gap-3 flex-wrap mb-4">
                <Button onClick={handleShare} disabled={isSharing} className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248] border-0 font-bold uppercase tracking-wider text-sm">
                  <Share2 className="w-4 h-4 mr-2" />{isSharing ? "Sharing..." : "Share"}
                </Button>
                <Button onClick={handleCopyLink} className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248] border-0 font-bold uppercase tracking-wider text-sm">
                  <Copy className="w-4 h-4 mr-2" />Copy Link
                </Button>
                <Button onClick={handleDownloadPDF} variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold uppercase tracking-wider text-sm">
                  <Download className="w-4 h-4 mr-2" />PDF
                </Button>
              </div>
              <p className="text-white/40 text-sm">This roadmap will expire in 7 days.</p>
            </div>
            <div className="hidden md:block">
              {ogImageUrl ? (
                <div>
                  <img src={ogImageUrl} alt={`Screenshot of ${results.websiteUrl}`} className="w-full rounded-lg shadow-lg border border-white/10" />
                  <p className="text-white/30 text-xs mt-2 text-center">What users see when your page is shared.</p>
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-white/5 rounded-lg flex items-center justify-center"><Globe className="w-10 h-10 text-white/20" /></div>
              )}
            </div>
          </motion.div>
        </div>
        <div className="mt-10 h-[3px] bg-[#a7c140]" />
      </header>

      {/* ── TABLE OF CONTENTS ── */}
      <nav className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className={CONTENT}>
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            <a href="#overview" className="text-[13px] font-bold uppercase tracking-wider text-[#112248]/70 hover:text-[#112248] border-b-2 border-transparent hover:border-[#a7c140] transition-all whitespace-nowrap px-3 py-1">Overview</a>
            {PILLARS.map((p) => (
              <a key={p.key} href={`#${p.key}`} className="text-[13px] font-bold uppercase tracking-wider text-[#112248]/70 hover:text-[#112248] border-b-2 border-transparent hover:border-[#a7c140] transition-all whitespace-nowrap px-3 py-1">{p.label}</a>
            ))}
            <a href="#next-moves" className="text-[13px] font-bold uppercase tracking-wider text-[#112248]/70 hover:text-[#112248] border-b-2 border-transparent hover:border-[#a7c140] transition-all whitespace-nowrap px-3 py-1">Next Moves</a>
          </div>
        </div>
      </nav>

      <main>
        {/* ── OVERVIEW ── */}
        <section id="overview" className="scroll-mt-16" style={LIGHT_BAND}>
          <div className={`${CONTENT} py-14 md:py-20`}>
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut" }} className="mb-10 lg:mb-0 w-full max-w-[560px] mx-auto">
                <BrandVenn statuses={statuses} onSegmentClick={scrollToArea} />
              </motion.div>
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
                <h2 className="text-3xl md:text-4xl font-heading text-[#112248]">The Legacy Read</h2>
                <div className="w-12 h-0.5 bg-[#a7c140] mt-3 mb-6" />
                <div className="space-y-5">
                  {results.legacyRead.split(/\n\n+/).filter(Boolean).map((para, i) => (
                    <p key={i} className="text-gray-700 text-[18px] md:text-[20px] leading-[1.6]">{para}</p>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── PILLARS ── */}
        {PILLARS.map((pillar, idx) => {
          const dark = idx % 2 === 0; // Get Clear & Get Paid dark; Get Noticed light
          return (
            <section key={pillar.key} id={pillar.key} className="scroll-mt-16" style={dark ? DARK_BAND : LIGHT_BAND}>
              <div className={`${CONTENT} py-14 md:py-20`}>
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} className="text-center mb-10">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-sm font-bold text-[#a7c140] tracking-[0.2em] font-heading">{String(idx + 1).padStart(2, "0")}</span>
                    <h2 className={`text-3xl md:text-4xl font-heading ${dark ? "text-white" : "text-[#112248]"}`}>{pillar.label}</h2>
                  </div>
                  <div className="w-12 h-0.5 bg-[#a7c140] mx-auto mb-3" />
                  <p className={`${dark ? "text-white/55" : "text-gray-500"} text-lg`}>{pillar.tagline}</p>
                </motion.div>

                <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
                  <VideoBlock label={pillar.label} url={pillar.videoUrl} dark={dark} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pillar.areas.map((areaKey) => {
                      const ev: AreaEval | undefined = results.pillars?.[pillar.key]?.areas?.[areaKey];
                      if (!ev) return null;
                      const ui = STATUS_UI[ev.status];
                      return (
                        <motion.div key={areaKey} id={areaKey} variants={fadeUp} whileHover={{ y: -6 }} className="scroll-mt-24 flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <StrengthBar status={ev.status} />
                            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: ui.text }}>{ev.status}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            <h3 className="text-xl font-heading text-[#112248]">{AREA_LABELS[areaKey]}</h3>
                            {ev.startHere && (
                              <span className="text-[10px] uppercase tracking-[0.08em] px-2.5 py-0.5 rounded-full" style={{ border: `1px solid ${ui.border}`, color: ui.text }}>Start here</span>
                            )}
                          </div>
                          <p className="text-gray-700 text-[16px] leading-[1.6] flex-1">{ev.evaluation}</p>
                          <div className="mt-5 border-l-4 rounded-r-lg p-4" style={{ borderColor: "#a7c140", background: "rgba(17,34,72,0.03)" }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <ArrowRight className="w-4 h-4 text-[#a7c140]" />
                              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#a7c140]">Your next move</h4>
                            </div>
                            <p className="text-gray-700 text-[15px] leading-[1.55]">{ev.nextMove}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                <div className="mt-10 text-center">
                  <a href="https://leftrightlabs.com/contact" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 font-bold uppercase tracking-wider text-sm transition-opacity hover:opacity-70 ${dark ? "text-white" : "text-[#112248]"}`}>
                    Strengthen your {pillar.label} foundation
                    <ArrowRight className="w-4 h-4 text-[#a7c140]" />
                  </a>
                </div>
              </div>
            </section>
          );
        })}

        {/* ── SEQUENCED NEXT MOVES ── */}
        {results.sequencedMoves && results.sequencedMoves.length > 0 && (
          <section id="next-moves" className="scroll-mt-16" style={LIGHT_BAND}>
            <div className={`${CONTENT} py-14 md:py-20`}>
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-heading text-[#112248]">Your Sequenced Roadmap</h2>
                <div className="w-12 h-0.5 bg-[#a7c140] mx-auto mt-3 mb-3" />
                <p className="text-gray-500 text-lg">The order we teach it: Get Clear first, then Get Noticed, then Get Paid.</p>
              </motion.div>
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PILLARS.map((pillar, i) => {
                  const raw = results.sequencedMoves?.[i];
                  if (!raw) return null;
                  const move = raw.replace(/^\s*get\s+(clear|noticed|paid)\b\s*[—–:-]*\s*/i, "");
                  return (
                    <motion.div key={pillar.key} variants={fadeUp} whileHover={{ y: -6 }} className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[#a7c140] text-[#112248] font-heading font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm font-bold uppercase tracking-wider text-[#112248]">{pillar.label}</span>
                      </div>
                      <p className="text-gray-700 text-[16px] leading-[1.6]">{move}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER CTA ── */}
      <footer className="bg-[#112248] text-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}>
            <div className="font-heading-transform">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">Ready to build the brand you&apos;re meant to lead?</h2>
            </div>
            <div className="w-16 h-0.5 bg-[#a7c140] mx-auto my-6" />
            <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">Let&apos;s turn this roadmap into a brand that speaks before you do, sells with integrity, and scales without chaos.</p>
            <Button onClick={() => (window.location.href = "https://leftrightlabs.com/start")} size="lg" className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248] font-bold uppercase tracking-wider">Let&apos;s Elevate Your Brand Advantage</Button>
            <p className="text-xs text-white/40 max-w-xl mx-auto leading-relaxed mt-10">
              This roadmap was generated using AI analysis of publicly available website content. It may occasionally misinterpret layout, messaging, or functionality — especially on sites with dynamic or complex content. For the most accurate, tailored assessment, {""}
              <a href="https://leftrightlabs.com/contact" target="_blank" rel="noopener noreferrer" className="text-[#a7c140] underline hover:opacity-80 transition-opacity">contact us</a>{" "} to book an in-depth consultation.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
