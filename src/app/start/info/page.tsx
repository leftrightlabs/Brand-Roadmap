"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const NAVY = "#112248";
const LIME = "#a7c140";

export default function LeadCapturePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", websiteUrl: "" });

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch { return false; }
  };

  const normaliseUrl = (url: string): string => {
    const t = url.trim();
    if (!t) return t;
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = normaliseUrl(formData.websiteUrl);

    if (!formData.name.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" }); return;
    }
    if (!isValidEmail(formData.email)) {
      toast({ title: "Valid email required", description: "Please enter a valid email address.", variant: "destructive" }); return;
    }
    if (!isValidUrl(url)) {
      toast({ title: "Valid website URL required", description: "Please enter a full URL (e.g. https://yoursite.com).", variant: "destructive" }); return;
    }

    setIsLoading(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      websiteUrl: url,
      primaryGoal: "", industry: "", targetAudience: "",
      brandPersonality: "", marketingCampaigns: "", improvementFocus: "",
    };

    sessionStorage.setItem("webAuditFormData", JSON.stringify(payload));

    if (typeof window !== "undefined") {
      if (window.gtag) window.gtag("event", "lead_captured", { event_category: "engagement", event_label: "Contact Info Submitted", value: 1 });
      if (window.clarity) window.clarity("set", "conversion", "lead_captured");
    }

    fetch("/api/web-audit/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: payload.name, email: payload.email }),
    }).catch((err) => console.warn("[info] submit-lead error:", err));

    router.push("/start/analyzing");
  };

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-16"
      style={{ background: NAVY, fontFamily: "'sweet-sans-pro', Montserrat, Arial, sans-serif" }}
    >
      <div className="w-full max-w-lg">

        {/* ── Header ── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Eyebrow */}
          <p style={{
            fontSize: 12, fontWeight: 600, letterSpacing: "0.28em",
            textTransform: "uppercase", color: LIME, marginBottom: 20,
          }}>
            A Free Brand Roadmap From Left Right Labs
          </p>

          {/* H1 */}
          <h1 style={{
            fontFamily: "scotch-display, 'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 4.5vw, 46px)",
            lineHeight: 1.1,
            color: "#fff",
            textTransform: "capitalize",
            marginBottom: 12,
            textWrap: "balance" as React.CSSProperties["textWrap"],
          }}>
            Your Brand Is Sending A Message.
          </h1>

          {/* Secondary line */}
          <p style={{
            fontFamily: "scotch-display, 'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(17px, 2.5vw, 22px)",
            color: "rgba(255,255,255,0.72)",
            marginBottom: 32,
            textWrap: "balance" as React.CSSProperties["textWrap"],
          }}>
            Find Out What It&apos;s Actually Saying.
          </p>

          {/* Lime rule */}
          <div style={{ width: 48, height: 2, background: LIME, margin: "0 auto 24px" }} />

          {/* Subheadline */}
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", maxWidth: 420, margin: "0 auto 0" }}>
            Get a free, personalized Brand Advantage™ Roadmap … enter your details and the specific moves to re-align your brand land in your inbox in minutes.
          </p>
        </motion.div>

        {/* ── Form card ── */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <div style={{ background: "#fff", padding: "36px 32px 28px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Name */}
              <div>
                <label htmlFor="name" style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: NAVY, marginBottom: 8 }}>
                  Full Name
                </label>
                <input
                  id="name" type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Jane Smith"
                  required
                  style={{ width: "100%", height: 48, padding: "0 14px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 15, color: NAVY, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = LIME; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: NAVY, marginBottom: 8 }}>
                  Email Address
                </label>
                <input
                  id="email" type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="jane@yourcompany.com"
                  required
                  style={{ width: "100%", height: 48, padding: "0 14px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 15, color: NAVY, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = LIME; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                />
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Your roadmap is delivered here.</p>
              </div>

              {/* Website URL */}
              <div>
                <label htmlFor="websiteUrl" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: NAVY, marginBottom: 8 }}>
                  <Globe size={13} />
                  Website URL
                </label>
                <input
                  id="websiteUrl" type="text" inputMode="url"
                  value={formData.websiteUrl}
                  onChange={(e) => handleChange("websiteUrl", e.target.value)}
                  placeholder="yourwebsite.com"
                  required
                  style={{ width: "100%", height: 48, padding: "0 14px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 15, color: NAVY, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = LIME; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%", height: 52, marginTop: 4,
                  background: isLoading ? "#c5d98a" : LIME,
                  color: NAVY, border: 0, borderRadius: 0,
                  fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background 160ms ease",
                }}
                onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = "#96ad39"; }}
                onMouseLeave={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = LIME; }}
              >
                {isLoading ? "Building Your Roadmap…" : "Build My Roadmap →"}
              </button>

              {/* Trust chips */}
              <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", letterSpacing: "0.04em", margin: 0 }}>
                Free&nbsp;&nbsp;|&nbsp;&nbsp;No credit card&nbsp;&nbsp;|&nbsp;&nbsp;Roadmap in your inbox
              </p>
            </form>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
