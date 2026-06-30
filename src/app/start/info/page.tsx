"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const NAVY = "#112248";
const LIME = "#a7c140";

type Answers = {
  brandStage: string;
  primaryGoal: string;
  idealClient: string;
  primaryOffer: string;
  biggestGap: string;
};

type QuestionKey = keyof Answers;

interface Question {
  key: QuestionKey;
  type: "select" | "text";
  title: string;
  help?: string;
  options?: string[];
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    key: "brandStage",
    type: "select",
    title: "Where is your brand right now?",
    help: "So we frame your roadmap to where you actually are.",
    options: ["Establishing it", "Repositioning it", "Scaling it", "Launching something new"],
  },
  {
    key: "primaryGoal",
    type: "select",
    title: "What do you most want in the next 6–12 months?",
    options: [
      "Get clear on my message & positioning",
      "Get noticed & build authority",
      "Get paid — convert & scale revenue",
      "Build a lasting, legacy-level brand",
    ],
  },
  {
    key: "idealClient",
    type: "text",
    title: "Who are you most trying to attract?",
    help: "One sentence is perfect.",
    placeholder: "e.g. Female founders scaling past $1M who feel invisible online",
  },
  {
    key: "primaryOffer",
    type: "text",
    title: "What's your primary offer — and roughly what does it cost?",
    help: "Even a ballpark helps us read your positioning.",
    placeholder: "e.g. 6-month brand intensive, around $25k",
  },
  {
    key: "biggestGap",
    type: "text",
    title: "What feels most ‘off’ about your brand right now?",
    help: "Be honest — this is what we'll speak to first.",
    placeholder: "e.g. It looks polished, but it doesn't sound like the leader I've become",
  },
];

const TOTAL_STEPS = QUESTIONS.length + 1; // questions + contact

export default function IntakeWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Answers>({ brandStage: "", primaryGoal: "", idealClient: "", primaryOffer: "", biggestGap: "" });
  const [contact, setContact] = useState({ name: "", email: "", websiteUrl: "" });

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };
  const normaliseUrl = (url: string) => {
    const t = url.trim();
    if (!t) return t;
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  };

  const setAnswer = (key: QuestionKey, value: string) => setAnswers((p) => ({ ...p, [key]: value }));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));

  const selectOption = (key: QuestionKey, value: string) => {
    setAnswer(key, value);
    setTimeout(next, 160); // brief beat so the selection registers visually
  };

  const submit = async () => {
    const url = normaliseUrl(contact.websiteUrl);
    if (!contact.name.trim()) { toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" }); return; }
    if (!isValidEmail(contact.email)) { toast({ title: "Valid email required", description: "Please enter a valid email address.", variant: "destructive" }); return; }
    if (!isValidUrl(url)) { toast({ title: "Valid website URL required", description: "Please enter a full URL (e.g. https://yoursite.com).", variant: "destructive" }); return; }

    setIsLoading(true);
    const payload = { name: contact.name.trim(), email: contact.email.trim(), websiteUrl: url, ...answers };
    sessionStorage.setItem("webAuditFormData", JSON.stringify(payload));

    if (typeof window !== "undefined") {
      if (window.gtag) window.gtag("event", "lead_captured", { event_category: "engagement", event_label: "Intake Completed", value: 1 });
      if (window.clarity) window.clarity("set", "conversion", "lead_captured");
    }
    fetch("/api/web-audit/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: payload.name, email: payload.email }),
    }).catch((err) => console.warn("[intake] submit-lead error:", err));

    router.push("/start/analyzing");
  };

  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);
  const isContact = step === QUESTIONS.length;
  const q = QUESTIONS[step];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px", border: "1px solid #e2e8f0", background: "#f8fafc",
    fontSize: 16, color: NAVY, outline: "none", boxSizing: "border-box", borderRadius: 0,
    fontFamily: "'sweet-sans-pro', Montserrat, Arial, sans-serif",
  };
  const limeBtn: React.CSSProperties = {
    width: "100%", height: 52, background: LIME, color: NAVY, border: 0, borderRadius: 0,
    fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12" style={{ background: NAVY, fontFamily: "'sweet-sans-pro', Montserrat, Arial, sans-serif" }}>
      <div className="w-full max-w-xl">
        {/* Eyebrow + progress */}
        <div className="text-center mb-6">
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: LIME, marginBottom: 16 }}>
            Your Brand Roadmap™
          </p>
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 999, overflow: "hidden" }}>
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ height: "100%", background: LIME }} />
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 10, letterSpacing: "0.06em" }}>
            {isContact ? "Last step" : `Question ${step + 1} of ${QUESTIONS.length}`}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", padding: "36px 32px 30px", minHeight: 340 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {!isContact ? (
                <>
                  <h2 style={{ fontFamily: "scotch-display, 'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(24px, 4vw, 34px)", lineHeight: 1.15, color: NAVY, marginBottom: q.help ? 8 : 22, textWrap: "balance" as React.CSSProperties["textWrap"] }}>
                    {q.title}
                  </h2>
                  {q.help && <p style={{ fontSize: 14, color: "#64748b", marginBottom: 22 }}>{q.help}</p>}

                  {q.type === "select" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {q.options!.map((opt) => {
                        const selected = answers[q.key] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => selectOption(q.key, opt)}
                            style={{
                              textAlign: "left", padding: "16px 18px", borderRadius: 0, cursor: "pointer",
                              border: `1.5px solid ${selected ? LIME : "#e2e8f0"}`,
                              background: selected ? "rgba(167,193,64,0.12)" : "#fff",
                              color: NAVY, fontSize: 16, fontWeight: 500, transition: "all 140ms ease",
                            }}
                            onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "#cbd5e1"; }}
                            onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "text" && (
                    <form onSubmit={(e) => { e.preventDefault(); next(); }}>
                      <textarea
                        autoFocus
                        rows={2}
                        value={answers[q.key]}
                        onChange={(e) => setAnswer(q.key, e.target.value)}
                        placeholder={q.placeholder}
                        style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = LIME; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                      />
                      <button type="submit" style={{ ...limeBtn, marginTop: 18 }}>Continue →</button>
                    </form>
                  )}
                </>
              ) : (
                <>
                  <h2 style={{ fontFamily: "scotch-display, 'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(24px, 4vw, 34px)", lineHeight: 1.15, color: NAVY, marginBottom: 8 }}>
                    Where should we send it?
                  </h2>
                  <p style={{ fontSize: 14, color: "#64748b", marginBottom: 22 }}>Your personalized roadmap lands here in minutes.</p>
                  <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <input autoFocus type="text" value={contact.name} onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" required style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = LIME; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }} />
                    <input type="email" value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} placeholder="Email address" required style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = LIME; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }} />
                    <div style={{ position: "relative" }}>
                      <Globe size={15} style={{ position: "absolute", left: 14, top: 16, color: "#94a3b8" }} />
                      <input type="text" inputMode="url" value={contact.websiteUrl} onChange={(e) => setContact((p) => ({ ...p, websiteUrl: e.target.value }))} placeholder="yourwebsite.com" required style={{ ...inputStyle, paddingLeft: 38 }} onFocus={(e) => { e.currentTarget.style.borderColor = LIME; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }} />
                    </div>
                    <button type="submit" disabled={isLoading} style={{ ...limeBtn, height: 54, marginTop: 4, background: isLoading ? "#c5d98a" : LIME, cursor: isLoading ? "not-allowed" : "pointer" }}>
                      {isLoading ? "Building Your Roadmap…" : "Build My Roadmap →"}
                    </button>
                    <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", letterSpacing: "0.04em", margin: 0 }}>
                      No credit card&nbsp;&nbsp;|&nbsp;&nbsp;Roadmap in your inbox in minutes
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Back */}
        {step > 0 && (
          <button onClick={back} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 18, background: "transparent", border: 0, color: "rgba(255,255,255,0.6)", fontSize: 13, letterSpacing: "0.06em", cursor: "pointer" }}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </div>
    </div>
  );
}
