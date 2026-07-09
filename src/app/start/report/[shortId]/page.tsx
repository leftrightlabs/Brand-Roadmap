"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Share2, AlertTriangle, Globe, Copy, ArrowRight, Play, Lock, Check } from "lucide-react";

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
  paid?: boolean;
}

const FULL_PRICE = "$97";

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

// A band uses its pillar's photo (with a readability scrim) when set in
// PILLARS[].bgImage; otherwise it falls back to the CSS texture above.
function bandStyle(dark: boolean, bgImage?: string): CSSProperties {
  if (bgImage) {
    const scrim = dark
      ? "linear-gradient(rgba(12,24,56,0.86), rgba(12,24,56,0.88))"
      : "linear-gradient(rgba(246,243,236,0.90), rgba(246,243,236,0.92))";
    return {
      backgroundColor: dark ? "#0c1838" : "#f6f3ec",
      backgroundImage: `${scrim}, url(${bgImage})`,
      backgroundSize: "cover, cover",
      backgroundPosition: "center, center",
    };
  }
  return dark ? DARK_BAND : LIGHT_BAND;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const STATUS_UI: Record<AreaStatus, { text: string; border: string; bg: string }> = {
  Strong: { text: "#5f7d18", border: "#A7C140", bg: "rgba(167,193,64,0.16)" },
  Refine: { text: "#9a7710", border: "#EAB43C", bg: "rgba(234,180,60,0.22)" },
  Prioritize: { text: "#b53e1c", border: "#E0552E", bg: "rgba(224,85,46,0.15)" },
};

// Curiosity-gap teaser: the opening of the (paid) next move, cut off mid-thought
// at a word boundary. Enough to make the reader want it, not enough to execute.
function moveTeaser(text: string, max = 68): string {
  const firstSentence = (text || "").trim().split(/(?<=[.!?])\s/)[0] || "";
  if (firstSentence.length <= max) return firstSentence;
  const cut = firstSentence.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).trim();
}

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
  // Set from ?checkout=success after returning from Stripe. The webhook is the
  // real gate (it flips `paid`); this just lets us show a "finalizing" state
  // and poll until that lands. There is no client-side unlock bypass.
  const [checkoutReturn, setCheckoutReturn] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setShortId(resolvedParams.shortId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    setCheckoutReturn(new URLSearchParams(window.location.search).get("checkout") === "success");
  }, []);

  useEffect(() => {
    if (shortId) loadResults();
  }, [shortId]);

  // After returning from Stripe (?checkout=success), the webhook can take a
  // couple of seconds to flip `paid`. Poll check-results until it does, then
  // swap in the unlocked view.
  useEffect(() => {
    if (!checkoutReturn || !shortId || results?.paid) return;
    let tries = 0;
    const id = setInterval(async () => {
      tries += 1;
      try {
        const r = await fetch(`/api/web-audit/check-results/${shortId}`);
        if (r.ok) {
          const d = await r.json();
          if (d.status === "completed" && d.results?.paid) {
            setResults(d.results);
            toast({ title: "Unlocked", description: "Your full Brand Roadmap is ready." });
            clearInterval(id);
            return;
          }
        }
      } catch { /* keep polling */ }
      if (tries >= 12) clearInterval(id);
    }, 2500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutReturn, shortId, results?.paid]);

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

  // "Start here" areas (weakest) and the pillar carrying the most weight — used
  // for the free directional nudge so the diagnosis still points somewhere.
  const startHereKeys: AreaKey[] = [];
  const startHereLabels: string[] = [];
  const pillarPressure: Record<string, number> = {};
  let firstPrioritizeKey: AreaKey | null = null;
  PILLARS.forEach((p) => {
    let pressure = 0;
    p.areas.forEach((a) => {
      const ev = results.pillars?.[p.key]?.areas?.[a];
      if (!ev) return;
      if (ev.startHere) { startHereKeys.push(a); startHereLabels.push(AREA_LABELS[a]); }
      if (ev.status === "Prioritize" && !firstPrioritizeKey) firstPrioritizeKey = a;
      pressure += ev.status === "Prioritize" ? 2 : ev.status === "Refine" ? 1 : 0;
    });
    pillarPressure[p.key] = pressure;
  });
  const priorityPillar =
    [...PILLARS].sort((a, b) => (pillarPressure[b.key] ?? 0) - (pillarPressure[a.key] ?? 0))[0] ?? PILLARS[0];

  // The one area we fully unlock for free — the "sample lesson." Prefer a
  // start-here area inside the priority pillar (so it matches the nudge), then
  // any start-here area, then the first Prioritize area as a fallback.
  const freeSampleAreaKey: AreaKey | null =
    priorityPillar.areas.find((a) => startHereKeys.includes(a)) ??
    startHereKeys[0] ??
    firstPrioritizeKey;

  // Free = the roadmap's route + first move (diagnosis). Paid/preview unlocks every move.
  const unlocked = results.paid === true;
  const goUnlock = async () => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    try {
      const res = await fetch("/api/web-audit/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId }),
      });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; return; }
      if (data.alreadyPaid) { window.location.reload(); return; }
      toast({ title: "Couldn't start checkout", description: data.error || "Please try again.", variant: "destructive" });
    } catch {
      toast({ title: "Couldn't start checkout", description: "Please try again in a moment.", variant: "destructive" });
    }
    setIsUnlocking(false);
  };

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
        {checkoutReturn && !unlocked && (
          <div className="bg-[#a7c140] text-[#112248] text-center text-[13px] font-bold uppercase tracking-[0.12em] py-3 px-4">
            Payment received … unlocking your full roadmap. This can take a few seconds.
          </div>
        )}
        {/* ── OVERVIEW ── */}
        <section id="overview" className="scroll-mt-16" style={LIGHT_BAND}>
          <div className={`${CONTENT} py-14 md:py-20`}>
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut" }} className="mb-10 lg:mb-0 w-full max-w-[560px] mx-auto">
                <BrandVenn statuses={statuses} onSegmentClick={scrollToArea} />
              </motion.div>
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
                <h2 className="text-4xl md:text-6xl font-heading text-[#112248]">The Legacy Read</h2>
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

        {/* ── FREE: WHERE YOUR ROADMAP STARTS (directional nudge) ── */}
        {!unlocked && (results.roadmapNudge || startHereLabels.length > 0) && (
          <section style={DARK_BAND}>
            <div className={`${CONTENT} py-12 md:py-16`}>
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="max-w-4xl mx-auto">
                <div className="rounded-3xl border border-[#a7c140]/40 bg-white/[0.04] p-8 md:p-12">
                  <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#a7c140] mb-4">Where your roadmap starts</p>
                  {results.roadmapNudge && (
                    <p className="text-white text-[22px] md:text-[26px] font-heading leading-[1.3] mb-6">{results.roadmapNudge}</p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-white/50">Lead with</span>
                      <span className="inline-flex items-center rounded-full bg-[#a7c140] text-[#112248] font-bold text-sm px-4 py-1.5">{priorityPillar.label}</span>
                    </div>
                    {startHereLabels.length > 0 && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-white/50">Begin with</span>
                        {startHereLabels.map((label) => (
                          <span key={label} className="inline-flex items-center rounded-full border border-white/25 text-white/90 text-sm px-4 py-1.5">{label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-white/45 text-[15px] mt-6">We&apos;ve unlocked your first move in full below — look for the <span className="text-[#a7c140] font-semibold">Unlocked free</span> tag. The exact next step for every other area is in your complete roadmap.</p>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* ── PILLARS ── */}
        {PILLARS.map((pillar, idx) => {
          const dark = idx % 2 === 0; // Get Clear & Get Paid dark; Get Noticed light
          return (
            <section key={pillar.key} id={pillar.key} className="scroll-mt-16" style={bandStyle(dark, pillar.bgImage)}>
              <div className={`${CONTENT} py-14 md:py-20`}>
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} className="text-center mb-12">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <span className="text-xl md:text-3xl font-bold text-[#a7c140] tracking-[0.2em] font-heading">{String(idx + 1).padStart(2, "0")}</span>
                    <h2 className={`text-5xl md:text-7xl font-heading leading-[1.1] ${dark ? "text-white" : "text-[#112248]"}`}>{pillar.label}</h2>
                  </div>
                  <div className="w-16 md:w-20 h-1 bg-[#a7c140] mx-auto mb-5" />
                  <p className={`${dark ? "text-white/65" : "text-gray-600"} text-2xl md:text-3xl max-w-3xl mx-auto leading-snug`}>{pillar.tagline}</p>
                </motion.div>

                <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
                  {unlocked && <VideoBlock label={pillar.label} url={pillar.videoUrl} dark={dark} />}

                  <div className="grid grid-cols-1 gap-6">
                    {pillar.areas.map((areaKey) => {
                      const ev: AreaEval | undefined = results.pillars?.[pillar.key]?.areas?.[areaKey];
                      if (!ev) return null;
                      const ui = STATUS_UI[ev.status];
                      const stripColor = STATUS_STYLE[ev.status].color;
                      // One area is fully unlocked for free — the "sample lesson."
                      const isFreeSample = !unlocked && areaKey === freeSampleAreaKey;
                      const showFull = unlocked || isFreeSample;
                      return (
                        <motion.div key={areaKey} id={areaKey} variants={fadeUp} whileHover={{ y: -4 }} className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                          {/* priority color strip */}
                          <div style={{ height: 8, background: stripColor }} />
                          <div className="p-6 md:p-8">
                            {/* header row — status + title on one line (no empty left column) */}
                            <div className="flex items-center gap-x-3 gap-y-2 flex-wrap mb-6">
                              <h3 className="text-2xl md:text-[28px] font-heading text-[#112248] leading-tight mr-1">{AREA_LABELS[areaKey]}</h3>
                              <StrengthBar status={ev.status} />
                              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: ui.bg, color: ui.text }}>{ev.status}</span>
                              {ev.startHere && (
                                <span className="text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full" style={{ border: `1px solid ${ui.border}`, color: ui.text }}>Start here</span>
                              )}
                              {isFreeSample && (
                                <span className="text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full bg-[#a7c140] text-[#112248]">Unlocked free</span>
                              )}
                            </div>

                            {/* two lanes: situation (read + what good) | action (next move + example) */}
                            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 md:gap-10 md:items-start">
                              {/* situation lane */}
                              <div>
                                <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2">The read</p>
                                <p className="text-gray-700 text-[20px] leading-[1.6]">{showFull ? ev.evaluation : ev.shortRead}</p>
                                {showFull && ev.whatGoodLooksLike && (
                                  <div className="mt-6">
                                    <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2">What good looks like</p>
                                    <p className="text-gray-700 text-[20px] leading-[1.6]">{ev.whatGoodLooksLike}</p>
                                  </div>
                                )}
                              </div>

                              {/* action lane */}
                              <div className="flex flex-col gap-4">
                                {showFull ? (
                                  <div className="rounded-xl p-5" style={{ background: "rgba(167,193,64,0.12)", border: "1px solid rgba(167,193,64,0.45)" }}>
                                    <div className="flex items-center gap-2 mb-2.5">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#a7c140]">
                                        <ArrowRight className="w-3.5 h-3.5 text-[#112248]" />
                                      </span>
                                      <h4 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#3d4f12]">Your next move</h4>
                                    </div>
                                    <p className="text-[#112248] text-[20px] leading-[1.6] font-medium">{ev.nextMove}</p>
                                  </div>
                                ) : (
                                  <button onClick={goUnlock} className="w-full text-left rounded-xl p-5 border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors group">
                                    <div className="flex items-center gap-2 mb-3 text-[#112248]">
                                      <Lock className="w-4 h-4" />
                                      <h4 className="text-[13px] font-bold uppercase tracking-[0.12em]">Your next move</h4>
                                    </div>
                                    {/* curiosity gap: real opening of the move, cut off mid-thought */}
                                    <div className="relative mb-3">
                                      <p className="text-gray-700 text-[17px] leading-[1.55]">
                                        {moveTeaser(ev.nextMove)}<span className="text-gray-400"> …</span>
                                      </p>
                                      <span className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent" aria-hidden="true" />
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-[#5f7d18] group-hover:gap-2 transition-all">Unlock the full move →</span>
                                  </button>
                                )}
                                {showFull && ev.exampleRewrite && (
                                  <div className="rounded-xl p-4 border border-gray-200">
                                    <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1.5">Example, in your voice</p>
                                    <p className="text-gray-600 text-[20px] leading-[1.6] italic">{ev.exampleRewrite}</p>
                                  </div>
                                )}
                              </div>
                            </div>
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

        {/* ── PAID: 30/60/90 PLAN  ·  FREE: UPSELL ── */}
        {unlocked ? (
          results.phasedPlan && results.phasedPlan.length > 0 && (
            <section id="next-moves" className="scroll-mt-16" style={LIGHT_BAND}>
              <div className={`${CONTENT} py-14 md:py-20`}>
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
                  <h2 className="text-4xl md:text-6xl font-heading text-[#112248]">Your 30 / 60 / 90-Day Roadmap</h2>
                  <div className="w-12 h-0.5 bg-[#a7c140] mx-auto mt-3 mb-3" />
                  <p className="text-gray-500 text-lg">Sequenced the way we teach it: Get Clear, then Get Noticed, then Get Paid.</p>
                </motion.div>
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {results.phasedPlan.map((phase, i) => (
                    <motion.div key={i} variants={fadeUp} whileHover={{ y: -6 }} className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[#a7c140] text-[#112248] font-heading font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#112248]">{phase.label}</span>
                      </div>
                      <ul className="space-y-3">
                        {phase.moves.map((m, j) => (
                          <li key={j} className="flex gap-2.5 text-gray-700 text-[15px] leading-[1.55]">
                            <Check className="w-4 h-4 text-[#a7c140] mt-1 flex-shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>
          )
        ) : (
          <section id="next-moves" className="scroll-mt-16" style={DARK_BAND}>
            <div className={`${CONTENT} py-16 md:py-24`}>
              {/* Locked plan teaser — the shape of the 30/60/90 plan is visible, the steps are not. */}
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
                <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#a7c140] mb-4">Your Sequenced Plan</p>
                <h2 className="text-4xl md:text-6xl font-heading text-white leading-[1.1]">Your 30 / 60 / 90-day plan is built.</h2>
                <div className="w-16 h-1 bg-[#a7c140] mx-auto my-6" />
                <p className="text-white/60 text-lg max-w-2xl mx-auto">We&apos;ve sequenced every move in the order we teach it. Unlock to see exactly what to do, and when.</p>
              </motion.div>

              {results.phasedPlan && results.phasedPlan.length > 0 && (
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                  {results.phasedPlan.map((phase, i) => (
                    <motion.div key={i} variants={fadeUp} className="relative flex flex-col h-full rounded-2xl border border-white/15 bg-white/[0.04] p-6 overflow-hidden">
                      <div className="flex items-center gap-3 mb-5">
                        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[#a7c140] text-[#112248] font-heading font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-lg font-bold uppercase tracking-wider text-white">{phase.label}</span>
                      </div>
                      {/* Blurred placeholder bars stand in for the real steps. */}
                      <div className="space-y-3" aria-hidden>
                        {Array.from({ length: Math.min(3, Math.max(2, phase.moves?.length || 3)) }).map((_, j) => (
                          <div key={j} className="flex gap-2.5 items-start">
                            <Check className="w-4 h-4 text-[#a7c140]/60 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 space-y-1.5 blur-[5px] select-none">
                              <div className="h-2.5 rounded-full bg-white/25" style={{ width: `${92 - j * 12}%` }} />
                              <div className="h-2.5 rounded-full bg-white/15" style={{ width: `${70 - j * 10}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center gap-2 text-white/45 text-[13px] font-bold uppercase tracking-[0.1em]">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              <motion.div id="unlock" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="max-w-3xl mx-auto text-center scroll-mt-16">
                <p className="text-white/60 text-lg mb-8">Unlock the specific next move for all nine areas — plus deeper analysis, example rewrites in your voice, the Get Clear / Noticed / Paid lessons, your full 30/60/90-day plan, and a downloadable PDF.</p>
                <ul className="text-left max-w-md mx-auto space-y-3 mb-10">
                  {["The specific next move for all 9 areas", "Deeper analysis + what ‘good’ looks like", "Example rewrites in your brand voice", "Get Clear / Noticed / Paid lessons", "Every step of your 30/60/90-day plan", "Downloadable, shareable PDF"].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-white/85 text-[16px]">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#a7c140] flex-shrink-0"><Check className="w-3.5 h-3.5 text-[#112248]" /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={goUnlock} disabled={isUnlocking} size="lg" className="bg-[#a7c140] hover:bg-[#96ad39] text-[#112248] font-bold uppercase tracking-wider text-base px-8 py-6">
                  {isUnlocking ? "Starting checkout…" : `Unlock your full roadmap · ${FULL_PRICE}`}
                </Button>
                <p className="text-white/40 text-sm mt-4">One-time · Instant access · Secure checkout by Stripe</p>
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
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">Ready to build the brand you&apos;re meant to lead?</h2>
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
