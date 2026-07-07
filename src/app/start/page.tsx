"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// ─── Design tokens ───────────────────────────────────────────────────────────
const NAVY = "#112248";
const LIME = "#a7c140";
const SANS = "'sweet-sans-pro', Montserrat, Arial, sans-serif";
const SERIF = "scotch-display, 'Playfair Display', Georgia, serif";

// ─── Scroll reveal ───────────────────────────────────────────────────────────
const rv = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] as const },
  },
};
const vp = { once: true, margin: "-80px" as const };

// ─── Eyebrow ─────────────────────────────────────────────────────────────────
function Eyebrow({
  children,
  lime = false,
  center = false,
}: {
  children: React.ReactNode;
  lime?: boolean;
  center?: boolean;
}) {
  return (
    <p
      style={{
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: lime ? LIME : NAVY,
        display: "inline-flex",
        alignItems: "center",
        gap: "14px",
        margin: 0,
        ...(center ? { justifyContent: "center", width: "100%" } : {}),
      }}
    >
      <span style={{ color: LIME }}>✦</span>
      {children}
    </p>
  );
}

// ─── Scaley … the LRL scaleY(1.2) typographic signature ─────────────────────
// Mirrors the exact same component used on /mirror. Uses display:block (not
// inline-block) so scaleY only compounds once. useLayoutEffect measures the
// actual rendered overflow and sets paddingTop/paddingBottom on the parent
// heading so the visual text never bleeds into adjacent elements.
function Scaley({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const spanRect = el.getBoundingClientRect();
    const prev = parent.previousElementSibling as HTMLElement | null;
    let expectedParentTop = spanRect.top;
    if (prev) {
      const prevRect = prev.getBoundingClientRect();
      const prevMB = parseFloat(getComputedStyle(prev).marginBottom) || 0;
      expectedParentTop = prevRect.bottom + prevMB;
    }
    const upwardOverflow = Math.max(0, Math.ceil(expectedParentTop - spanRect.top));
    const downwardOverflow = Math.ceil((spanRect.height - upwardOverflow) / 6) + 8;
    if (upwardOverflow > 0) parent.style.paddingTop = `${upwardOverflow}px`;
    parent.style.paddingBottom = `${downwardOverflow}px`;
  }, []);
  return (
    <span
      ref={ref}
      style={{
        display: "block",
        transform: "scaleY(1.2)",
        transformOrigin: center ? "top center" : "top left",
      }}
    >
      {children}
    </span>
  );
}

// ─── ScotchH2 … uses Scaley internally ───────────────────────────────────────
function ScotchH2({
  children,
  white = false,
  center = false,
  style: extraStyle,
}: {
  children: React.ReactNode;
  white?: boolean;
  center?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <h2
      style={{
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: "clamp(32px, 4.5vw, 68px)",
        lineHeight: 1,
        letterSpacing: 0,
        textTransform: "capitalize",
        color: white ? "#fff" : NAVY,
        textWrap: "balance" as React.CSSProperties["textWrap"],
        margin: 0,
        paddingBottom: "1.5em",
        ...(center ? { textAlign: "center" } : {}),
        ...extraStyle,
      }}
    >
      <Scaley center={center}>{children}</Scaley>
    </h2>
  );
}

// ─── FAQ item ────────────────────────────────────────────────────────────────
function FaqItem({
  q,
  qEm,
  a,
  defaultOpen = false,
}: {
  q: string;
  qEm: string;
  a: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid rgba(17,34,72,0.12)" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 24,
          padding: "28px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: "clamp(18px, 2vw, 22px)",
            color: NAVY,
            letterSpacing: "0.01em",
          }}
        >
          {q}{" "}
          <em
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            {qEm}
          </em>
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontSize: 28,
            lineHeight: 1,
            color: LIME,
            fontWeight: 400,
            flexShrink: 0,
            minWidth: 24,
            textAlign: "center",
          }}
        >
          {open ? "–" : "+"}
        </span>
      </button>
      {open && (
        <div
          style={{
            paddingBottom: 30,
            paddingRight: 48,
            color: "rgba(17,34,72,0.72)",
            fontSize: 16,
            lineHeight: 1.7,
            maxWidth: 760,
            fontFamily: SANS,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Accent CTA button ───────────────────────────────────────────────────────
function AccentBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "16px 32px",
        background: LIME,
        color: NAVY,
        border: 0,
        borderRadius: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        opacity: disabled ? 0.7 : 1,
        transition: "filter 160ms cubic-bezier(0.22,1,0.36,1)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(0.9)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
    >
      {children}
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function StartPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCTA = () => {
    setIsLoading(true);
    if (typeof window !== "undefined" && typeof (window as Window & { gtag?: Function }).gtag === "function") {
      (window as Window & { gtag: Function }).gtag("event", "cta_start_assessment_clicked", {
        event_category: "engagement",
        event_label: "start_page",
      });
    }
    window.location.href = "/start/info";
  };

  const container = {
    maxWidth: 1280,
    margin: "0 auto",
    paddingLeft: "max(20px, 5vw)",
    paddingRight: "max(20px, 5vw)",
  } as React.CSSProperties;

  const sectionPad = {
    paddingTop: "clamp(80px, 11vw, 168px)",
    paddingBottom: "clamp(80px, 11vw, 168px)",
  } as React.CSSProperties;

  return (
    <div className="baa-page" style={{ fontFamily: SANS, background: "#fff", overflowX: "hidden" }}>

      {/* ════════════════════════════════════════════════════════
          NAV … fixed, transparent → navy on scroll
      ════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? NAVY : "transparent",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.14)"
            : "1px solid transparent",
          transition: "background 260ms cubic-bezier(0.22,1,0.36,1), border-color 260ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div
          style={{
            ...container,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 80,
          }}
        >
          <a href="#top" aria-label="Left Right Labs home" style={{ border: 0, display: "block", lineHeight: 0 }}>
            <Image
              src="/images/logos/LRL_Logo_2025_White.svg"
              alt="Left Right Labs"
              width={120}
              height={34}
              style={{ height: 34, width: "auto" }}
              priority
            />
          </a>

          <nav style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 3vw, 44px)" }}>
            {["What You Get|#walkaway", "How It Works|#how", "FAQ|#faq"].map((item) => {
              const [label, href] = item.split("|");
              return (
                <a
                  key={href}
                  href={href}
                  className="nav-link"
                  style={{
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 12.5,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#fff",
                    textDecoration: "none",
                    border: 0,
                    opacity: 0.9,
                    transition: "opacity 160ms ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.6"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9"; }}
                >
                  {label}
                </a>
              );
            })}
            <AccentBtn onClick={handleCTA} disabled={isLoading}>
              {isLoading ? "Loading…" : "Get My Brand Roadmap"}
            </AccentBtn>
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          HERO … full-bleed photo, scrim, copy
      ════════════════════════════════════════════════════════ */}
      <section id="top" style={{ position: "relative", overflow: "hidden", minHeight: "90vh" }}>
        <Image
          src="/images/collage-header-blue.webp"
          alt=""
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(17,34,72,0.80) 0%, rgba(17,34,72,0.74) 45%, rgba(11,22,52,0.93) 100%)",
          }}
        />
        <div
          style={{
            ...container,
            position: "relative",
            paddingTop: "clamp(120px, 16vh, 180px)",
            paddingBottom: "clamp(80px, 10vw, 130px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Eyebrow lime>Your Free Brand Roadmap From Left Right Labs</Eyebrow>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "clamp(34px, 5.5vw, 72px)",
                  lineHeight: 1,
                  letterSpacing: 0,
                  textTransform: "capitalize",
                  color: "#fff",
                  margin: 0,
                  paddingBottom: "1.5em",
                  textWrap: "pretty" as React.CSSProperties["textWrap"],
                }}
              >
                <Scaley>
                  Your Brand Is{" "}
                  <em style={{ fontStyle: "italic", fontWeight: 400 }}>Costing</em>{" "}
                  You The Clients You&apos;ve Already Earned.
                </Scaley>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(255,255,255,0.82)", maxWidth: 660, margin: 0 }}
            >
              Get your personalized Brand Advantage™ Roadmap … the sequenced
              route to stop your brand from costing you the clients you&apos;ve
              already earned. See the whole map, the one place to start, and
              your first move spelled out in full, free. On your screen in
              minutes, and in your inbox to keep.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <AccentBtn onClick={handleCTA} disabled={isLoading}>
                {isLoading ? "Loading…" : <>Get My Brand Roadmap&nbsp;→</>}
              </AccentBtn>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px", marginTop: 4 }}
            >
              {["Free to start", "About 2 minutes", "On screen + in your inbox"].map((item) => (
                <span
                  key={item}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: SANS,
                    fontSize: 14,
                    letterSpacing: "0.04em",
                    color: "rgba(255,255,255,0.78)",
                  }}
                >
                  <span style={{ color: LIME, fontSize: 13 }}>✦</span>
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          YOU'VE OUTGROWN YOUR BRAND … white, text/image split
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", ...sectionPad }}>
        <motion.div
          style={{ ...container, display: "grid", gap: "clamp(40px, 6vw, 96px)", alignItems: "center" }}
          className="split-grid"
          initial="hidden"
          whileInView="visible"
          variants={rv}
          viewport={vp}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Eyebrow>The Problem</Eyebrow>
            <ScotchH2>
              You&apos;ve <em style={{ fontStyle: "italic", fontWeight: 400 }}>Outgrown</em> Your Brand
            </ScotchH2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                You&apos;ve built something real. Your expertise is proven, your
                clients get results, and your reputation precedes you. But when
                someone lands on your website for the first time, does your brand
                reflect the leader you&apos;ve become?
              </p>
              <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                For most established experts, the answer is no.{" "}
                <strong style={{ color: "#000", fontWeight: 600 }}>
                  The brand that got you here wasn&apos;t designed for where
                  you&apos;re going.
                </strong>{" "}
                Your messaging may be strong in person but diluted online. Your
                visual presence may feel polished without feeling premium. Your
                positioning may be clear to you but invisible to the clients you
                actually want to attract.
              </p>
              <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                Your Brand Roadmap gives you the strategic clarity to close that
                gap … where your brand is drifting, the order to fix it in, the
                one place to start, and your first move spelled out in full,
                from the brand strategists behind some of the most recognized
                names in the industry.
              </p>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <Image
              src="/images/people-networking.webp"
              alt="Founders connecting at a premium networking event"
              width={640}
              height={640}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: 640,
                objectFit: "cover",
                display: "block",
                borderTop: `4px solid ${LIME}`,
              }}
            />
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          THE STRATEGIC LENS … white, image left / text right
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", paddingBottom: "clamp(80px, 11vw, 168px)" }}>
        <motion.div
          style={{ ...container, display: "grid", gap: "clamp(40px, 6vw, 96px)", alignItems: "center" }}
          className="split-grid split-grid--img-left"
          initial="hidden"
          whileInView="visible"
          variants={rv}
          viewport={vp}
        >
          <div style={{ position: "relative" }}>
            <Image
              src="/images/Katalyst_WebPages.png"
              alt="Brand strategy work across multiple web pages"
              width={640}
              height={480}
              style={{ width: "100%", height: "auto", objectFit: "cover", display: "block", borderTop: `4px solid ${LIME}` }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Eyebrow>The Methodology</Eyebrow>
            <ScotchH2>
              The Strategic Lens{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Behind</em>{" "}
              Your Roadmap
            </ScotchH2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                Your roadmap is built on the same methodology Left Right Labs
                has applied to leaders like JJ Virgin, Laila Ali, and other
                top-tier thought leaders … the Brand Advantage™ framework that
                examines messaging, positioning, and visual identity the way a
                brand strategist would.
              </p>
              <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                Your brand is analyzed through that strategic lens, and the
                output isn&apos;t a score or a generic critique.{" "}
                <strong style={{ color: "#000", fontWeight: 600 }}>
                  It&apos;s a sequenced set of moves
                </strong>{" "}
                … the exact changes to make, in the order to make them, so
                your brand stops drifting and starts attracting the clients
                you actually want.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHAT YOU'LL WALK AWAY WITH … photo band, navy
      ════════════════════════════════════════════════════════ */}
      <section id="walkaway" style={{ position: "relative", overflow: "hidden", background: NAVY }}>
        <Image src="/images/Architecture-Bird.webp" alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(17,34,72,0.88), rgba(11,22,52,0.92))" }} />

        <div style={{ ...container, position: "relative", ...sectionPad }}>
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center", maxWidth: 800, margin: "0 auto" }}
          >
            <Eyebrow lime center>Your Roadmap</Eyebrow>
            <ScotchH2 white center>
              What You&apos;ll{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Walk Away</em>{" "}
              With
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(255,255,255,0.82)", maxWidth: 680, margin: 0 }}>
              Not a score. Not a critique. It&apos;s your Brand Roadmap … the
              whole route mapped across all nine areas, the order to follow, and
              your first move unlocked in full. Free to start. Every remaining
              move unlocks whenever you&apos;re ready.
            </p>
          </motion.div>

          {/* Dark numbered cards */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="cards3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid rgba(255,255,255,0.14)", marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {[
              { num: "01", h3: "Where Your Brand Is Leaking Clients", p: "A read across all nine areas of your brand … the exact places your messaging, positioning, or visual identity is sending the wrong signal, and what it's costing you in clients who never reach out." },
              { num: "02", h3: "Your #1 Priority, First Move Unlocked", p: "We pinpoint the single place to start and hand you that first move in full … the specific, actionable change to make, spelled out for your brand and not a template." },
              { num: "03", h3: "Every Move, In The Right Order", p: "Your complete thirty, sixty, ninety day plan, sequenced the way it actually works … Get Clear, then Get Noticed, then Get Paid, starting at your biggest gap. You'll see the full route mapped, ready to unlock move by move whenever you want it." },
            ].map((card, i) => (
              <div key={i} style={{ padding: "44px 40px 48px", display: "flex", flexDirection: "column", gap: 18, borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.14)" }}>
                <p style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, color: LIME, margin: "0 0 8px" }}>
                  <span style={{ display: "block", transform: "scaleY(1.2)", transformOrigin: "top left" }}>{card.num}</span>
                </p>
                <h3 style={{ fontFamily: SANS, fontWeight: 600, fontSize: "clamp(18px, 2vw, 24px)", lineHeight: 1.25, color: "#fff", margin: 0 }}>{card.h3}</h3>
                <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.78)", margin: 0 }}>{card.p}</p>
              </div>
            ))}
          </motion.div>

          {/* Pull quote + CTA */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ marginTop: "clamp(48px, 6vw, 84px)", textAlign: "center", display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}
          >
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(24px, 3vw, 40px)", lineHeight: 1.25, color: "#fff", maxWidth: 880, margin: 0, textWrap: "balance" as React.CSSProperties["textWrap"] }}>
              Your expertise built the business. Now let your brand carry the weight … so you don&apos;t have to.
            </p>
            <AccentBtn onClick={handleCTA} disabled={isLoading}>
              {isLoading ? "Loading…" : <>Get My Brand Roadmap&nbsp;→</>}
            </AccentBtn>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS … white, 3 light numbered cards
      ════════════════════════════════════════════════════════ */}
      <section id="how" style={{ background: "#fff", ...sectionPad }}>
        <div style={container}>
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 800 }}
          >
            <Eyebrow>The Process</Eyebrow>
            <ScotchH2>
              How It <em style={{ fontStyle: "italic", fontWeight: 400 }}>Works</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(17,34,72,0.72)", margin: 0 }}>
              Three steps. About two minutes to start. Your personalized Brand
              Roadmap appears on screen the moment it&apos;s ready, and a link
              lands in your inbox to keep.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="cards3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid rgba(17,34,72,0.12)", marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {[
              { num: "01", h3: "Tell Us About Your Brand", p: "Your website, your contact details, and five quick questions about your goals and your ideal client. Those questions are what make your roadmap genuinely yours instead of generic." },
              { num: "02", h3: "We Map Your Brand", p: "Our AI runs your brand through the Brand Advantage™ framework … the same Get Clear, Get Noticed, Get Paid lens we apply to A-list clients … to find where your brand is misaligned and what to do about it." },
              { num: "03", h3: "See Your Roadmap", p: "Your personalized Brand Roadmap appears on screen in about two minutes, with a link in your inbox to keep. You'll see the full route in order, where your brand is leaking, your top priority, and your first move in full." },
            ].map((card, i) => (
              <div key={i} style={{ padding: "44px 40px 48px", display: "flex", flexDirection: "column", gap: 18, borderLeft: i === 0 ? "none" : "1px solid rgba(17,34,72,0.12)" }}>
                <p style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, color: LIME, margin: "0 0 8px" }}>
                  <span style={{ display: "block", transform: "scaleY(1.2)", transformOrigin: "top left" }}>{card.num}</span>
                </p>
                <h3 style={{ fontFamily: SANS, fontWeight: 600, fontSize: "clamp(18px, 2vw, 24px)", lineHeight: 1.25, color: NAVY, margin: 0 }}>{card.h3}</h3>
                <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.65, color: "rgba(17,34,72,0.72)", margin: 0 }}>{card.p}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHAT LEADERS SAY … navy, 3 testimonial cards
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: NAVY, ...sectionPad }}>
        <div style={container}>
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 22 }}
          >
            <Eyebrow lime>Proof</Eyebrow>
            <ScotchH2 white>
              What Leaders <em style={{ fontStyle: "italic", fontWeight: 400 }}>Say</em>
            </ScotchH2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="tgrid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {/* JJ Virgin */}
            <div style={{ borderLeft: `3px solid ${LIME}`, background: "rgba(255,255,255,0.04)", padding: "36px 34px", display: "flex", flexDirection: "column", gap: 26 }}>
              <p style={{ fontFamily: SANS, fontWeight: 400, fontStyle: "italic", fontSize: 18, lineHeight: 1.55, color: "#fff", margin: 0, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
                &ldquo;I&apos;ve worked with other branding companies, but none so intimately involved at every step. Left Right Labs pulled our brand out of us in a way I never could have done alone.&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto" }}>
                <Image src="/images/jj-virgin-2.png" alt="JJ Virgin" width={56} height={56} style={{ borderRadius: 999, objectFit: "cover", flexShrink: 0, width: 56, height: 56 }} />
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>JJ Virgin</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.78)", marginTop: 5 }}>4× NYT Bestselling Author &amp; Founder, Mindshare Collaborative</div>
                </div>
              </div>
            </div>

            {/* Laila Ali … lime monogram */}
            <div style={{ borderLeft: `3px solid ${LIME}`, background: "rgba(255,255,255,0.04)", padding: "36px 34px", display: "flex", flexDirection: "column", gap: 26 }}>
              <p style={{ fontFamily: SANS, fontWeight: 400, fontStyle: "italic", fontSize: 18, lineHeight: 1.55, color: "#fff", margin: 0, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
                &ldquo;They took the time to know me, my business, my goals … and built a plan we&apos;ve been winning with ever since. The results speak for themselves.&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto" }}>
                <Image src="/images/laila-ali.jpg" alt="Laila Ali" width={56} height={56} style={{ borderRadius: 999, objectFit: "cover", flexShrink: 0, width: 56, height: 56 }} />
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>Laila Ali</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.78)", marginTop: 5 }}>World Champion Athlete &amp; Lifestyle Entrepreneur</div>
                </div>
              </div>
            </div>

            {/* Chris & Melissa Smith … lime monogram */}
            <div style={{ borderLeft: `3px solid ${LIME}`, background: "rgba(255,255,255,0.04)", padding: "36px 34px", display: "flex", flexDirection: "column", gap: 26 }}>
              <p style={{ fontFamily: SANS, fontWeight: 400, fontStyle: "italic", fontSize: 18, lineHeight: 1.55, color: "#fff", margin: 0, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
                &ldquo;We didn&apos;t just get a beautiful brand. We got the strategy behind it … and that&apos;s what changed everything for our business.&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto" }}>
                <Image src="/images/chris-melissa.png" alt="Chris &amp; Melissa Smith" width={56} height={56} style={{ borderRadius: 999, objectFit: "cover", objectPosition: "top center", flexShrink: 0, width: 56, height: 56 }} />
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>Chris &amp; Melissa Smith</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.78)", marginTop: 5 }}>Founders, Family Brand</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(255,255,255,0.78)", maxWidth: 760, margin: "48px 0 0" }}
          >
            These leaders came to Left Right Labs for full brand strategy
            engagements. The free Brand Roadmap you&apos;re about to get is
            built on the same strategic methodology … the fastest way to see
            where your brand stands, before committing to anything.
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TRUSTED BY … navy, real logo strip image
      ════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", paddingTop: "clamp(56px, 7vw, 104px)", paddingBottom: "clamp(56px, 7vw, 104px)" }}>
        {/* Background image — same client collage as the hero */}
        <Image
          src="/images/collage-header-blue.webp"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center", zIndex: 0 }}
        />
        {/* Scrim — slightly heavier than the hero so the logos read cleanly */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(17,34,72,0.92) 0%, rgba(17,34,72,0.88) 50%, rgba(17,34,72,0.92) 100%)",
            zIndex: 1,
          }}
        />
        <motion.div
          initial="hidden" whileInView="visible" variants={rv} viewport={vp}
          style={{ ...container, textAlign: "center", position: "relative", zIndex: 2 }}
        >
          <p style={{ fontFamily: SANS, fontWeight: 600, fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", margin: "0 0 30px" }}>
            Trusted By Brands Like Yours
          </p>
          <picture>
            <source srcSet="/images/logos/logo-strip-desktop.png" media="(min-width: 768px)" />
            <img
              src="/images/logos/logo-strip-mobile.png"
              alt="Client logos: JJ Virgin, Laila Ali, Mindshare, Family Brand, Katalyst, DesBio and more"
              style={{ maxWidth: "100%", height: "auto", opacity: 0.85, margin: "0 auto", display: "block" }}
            />
          </picture>
          <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(255,255,255,0.78)", maxWidth: 760, margin: "36px auto 0", textAlign: "center" }}>
            Left Right Labs is an award-winning brand strategy consultancy.
            We&apos;ve worked with JJ Virgin, Laila Ali, and the thought leaders
            who are serious about building brands that match their authority.
          </p>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          YOUR QUESTIONS, ANSWERED … white, accordion
      ════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: "#fff", ...sectionPad }}>
        <div style={container}>
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 800 }}
          >
            <Eyebrow>Questions</Eyebrow>
            <ScotchH2>
              Your Questions, <em style={{ fontStyle: "italic", fontWeight: 400 }}>Answered</em>
            </ScotchH2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ marginTop: "clamp(40px, 5vw, 64px)", borderTop: "1px solid rgba(17,34,72,0.12)", maxWidth: 900 }}
          >
            <FaqItem q="Is This Actually" qEm="Free?" a="Your Brand Roadmap is free to start. No credit card. You get the whole route mapped … where your brand is leaking across all nine areas, the order to fix it in, your number one priority, and your first move spelled out in full, on screen in minutes and in your inbox to keep. Unlocking every remaining move, your full thirty, sixty, ninety day plan, and a downloadable version is an optional $97 upgrade. No pressure either way." defaultOpen />
            <FaqItem q="Will I Be Pitched At" qEm="The End?" a="No pressure, ever. Your roadmap is yours to keep and act on. When you want the rest, unlocking every move is an optional $97 upgrade, and when it makes sense to work together we'll make that path clear. Nothing is gated behind a sales call, and the value is yours regardless." />
            <FaqItem q="How Is This Different From A Generic" qEm="Online Quiz?" a="A quiz gives you a score. A roadmap gives you a plan. Your brand is analyzed the way Left Right Labs analyzes A-list clients, and what comes back is a sequenced set of specific moves … not a generic critique." />
            <FaqItem q="Why Do You Fix Things In A Specific" qEm="Order?" a="Because brand problems compound in sequence. Get Clear comes first … when your positioning and message are settled, every decision downstream gets easier. Then Get Noticed, so the right people actually see you. Then Get Paid, so it converts and scales. Your roadmap starts you at your biggest gap and moves in the order that makes each step build on the last, instead of fixing things at random." />
            <FaqItem q="I've Already Invested In Branding. Why Would I" qEm="Need This?" a="Because the brand that got you here often hasn't kept pace with who you've become. The roadmap shows you exactly where your current brand has drifted, what to realign, and what to do first … so the work you've already invested in starts paying off again." />
            <FaqItem q="How Much Time Does This" qEm="Actually Take?" a="About two to three minutes … your website, your details, and five quick questions about your goals and ideal client. Our AI does the heavy lifting, and your roadmap appears on screen shortly after, with a link in your inbox." />
            <FaqItem q="How Does AI Fit" qEm="Into This?" a="It's human-led and AI-assisted. AI handles the analysis at speed; the framework, the judgment about what matters, and the sequencing of moves come from the same team behind some of the most recognized brands in the industry." />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA CLOSE … photo band, left-aligned
      ════════════════════════════════════════════════════════ */}
      <section id="start" style={{ position: "relative", overflow: "hidden", background: NAVY }}>
        <Image src="/images/blurred-hotel.webp" alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(17,34,72,0.94) 38%, rgba(17,34,72,0.62) 100%)" }} />
        <div style={{ ...container, position: "relative", ...sectionPad }}>
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "flex-start", maxWidth: 640 }}
          >
            <Eyebrow lime>Your Next Move</Eyebrow>

            <ScotchH2 white>
              Get The Exact Moves That Will{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Re-Align</em>{" "}
              Your Brand
            </ScotchH2>

            <p style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.8, color: "rgba(255,255,255,0.82)", maxWidth: 600, margin: 0 }}>
              You&apos;ve spent years building credibility that commands rooms.
              This is a couple of minutes to get the Brand Roadmap that shows
              where your brand is leaking, the order to fix it in, and your
              first move in full.
            </p>

            <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.78)", maxWidth: 560, margin: 0 }}>
              Free to start. No pressure. Your roadmap on screen and in your inbox.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                "Your personalized Brand Advantage™ Roadmap, on screen in minutes",
                "The whole route mapped, in order, across all nine areas",
                "Your #1 priority, with the first move unlocked in full",
                "Free to start. No credit card. Every move unlocks at $97.",
              ].map((item) => (
                <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontFamily: SANS, fontSize: 16, lineHeight: 1.5, color: "#fff" }}>
                  <span style={{ color: LIME, flexShrink: 0, lineHeight: 1.5 }}>✦</span>
                  {item}
                </li>
              ))}
            </ul>

            <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.78)", maxWidth: 560, margin: 0 }}>
              You&apos;ve built the reputation. This is where you get the plan to make your brand carry it.
            </p>

            <AccentBtn onClick={handleCTA} disabled={isLoading}>
              {isLoading ? "Loading…" : <>Get My Brand Roadmap&nbsp;→</>}
            </AccentBtn>

            <p style={{ fontFamily: SANS, fontSize: 14, letterSpacing: "0.06em", color: "rgba(255,255,255,0.78)", margin: 0 }}>
              No credit card to start&nbsp;&nbsp;•&nbsp;&nbsp;About 2 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER … navy, logo left / tagline right
      ════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: NAVY,
          color: "rgba(255,255,255,0.78)",
          paddingTop: "clamp(64px, 8vw, 112px)",
          paddingBottom: 56,
          borderTop: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        <div style={container}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 48, flexWrap: "wrap" }}>
            <Image
              src="/images/logos/LRL_Logo_2025_White.svg"
              alt="Left Right Labs"
              width={140}
              height={46}
              style={{ height: 46, width: "auto" }}
            />
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: "#fff", margin: 0 }}>
              Build The Brand You&apos;re{" "}
              <em style={{ color: LIME }}>Meant</em>{" "}
              To Lead.<sup style={{ fontSize: 9 }}>™</sup>
            </p>
          </div>
          <div
            style={{
              marginTop: 56,
              paddingTop: 26,
              borderTop: "1px solid rgba(255,255,255,0.14)",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              fontFamily: SANS,
              fontSize: 12.5,
              letterSpacing: "0.05em",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            <span>© 2026 Left Right Labs. All rights reserved.</span>
            <span>Your Brand Advantage™ · Dallas, TX</span>
          </div>
        </div>
      </footer>

      {/* ─── Global heading override + responsive ─── */}
      <style>{`
        /* globals.css applies scaleY(1.2) to ALL h1/h2 site-wide.
           Scaley handles the transform per-element here … cancel the
           global rule so it doesn't double-scale and add extra line height. */
        .baa-page h1, .baa-page h2, .baa-page h3, .baa-page h4,
        .baa-page h5, .baa-page h6, .baa-page .font-heading {
          transform: none !important;
          letter-spacing: normal !important;
        }
        .baa-page h1, .baa-page h2 {
          line-height: 1 !important;
        }

        html { scroll-behavior: smooth; }

        @media (max-width: 860px) {
          .nav-link { display: none !important; }
        }

        .split-grid {
          grid-template-columns: 1.05fr 0.95fr;
        }
        .split-grid--img-left {
          grid-template-columns: 0.95fr 1.05fr;
        }
        @media (max-width: 880px) {
          .split-grid,
          .split-grid--img-left {
            grid-template-columns: 1fr !important;
          }
          .split-grid--img-left > div:first-child {
            order: -1;
          }
        }

        @media (max-width: 880px) {
          .cards3 {
            grid-template-columns: 1fr !important;
          }
          .cards3 > div {
            border-left: none !important;
            border-top: 1px solid rgba(17,34,72,0.12) !important;
          }
          .cards3 > div:first-child {
            border-top: 0 !important;
          }
          .tgrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
