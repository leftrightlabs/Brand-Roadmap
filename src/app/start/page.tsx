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
        fontSize: "clamp(36px, 5vw, 76px)",
        lineHeight: 1,
        letterSpacing: "-0.01em",
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
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        padding: "15px 38px",
        background: LIME,
        color: NAVY,
        border: 0,
        borderRadius: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        textAlign: "center",
        textWrap: "balance",
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
              {isLoading ? "Loading…" : "Start Here"}
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
          className="hero-grid"
          style={{
            ...container,
            position: "relative",
            paddingTop: "clamp(120px, 16vh, 180px)",
            paddingBottom: "clamp(80px, 10vw, 130px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: SANS, fontWeight: 400, fontSize: 16, letterSpacing: "2px", textTransform: "uppercase", color: LIME, margin: 0 }}
            >
              Your Free Brand Elevation Roadmap
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "clamp(38px, 4.8vw, 70px)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  textTransform: "capitalize",
                  color: "#fff",
                  margin: 0,
                  paddingBottom: "1.5em",
                  textWrap: "pretty" as React.CSSProperties["textWrap"],
                }}
              >
                <Scaley>
                  Your Brand Is the Best-Kept Secret in Your Industry.
                  <br />
                  <em style={{ fontStyle: "italic", fontWeight: 400 }}>Let&apos;s Ruin That.</em>
                </Scaley>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.82)", maxWidth: 660, margin: 0 }}
            >
              The people who&apos;ve worked with you already know. Everyone else is
              still deciding from your website. Your free Brand Elevation Roadmap
              finds every place your brand is keeping you quiet, and hands you the
              one to fix first.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.82)", maxWidth: 660, margin: 0 }}
            >
              About five minutes, and free, before you spend another dime guessing
              what to do next.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <AccentBtn onClick={handleCTA} disabled={isLoading}>
                {isLoading ? "Loading…" : <>Get My Free Brand Elevation Roadmap&nbsp;→</>}
              </AccentBtn>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px", marginTop: 4 }}
            >
              {["Free to start", "About five minutes", "Your first fix included"].map((item) => (
                <span
                  key={item}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: SANS,
                    fontSize: 16,
                    letterSpacing: "0.04em",
                    color: "rgba(255,255,255,0.78)",
                  }}
                >
                  <span style={{ color: LIME, fontSize: 13 }}>✦</span>
                  {item}
                </span>
              ))}
            </motion.div>

            {/* Logo strip … the same asset the credibility band used to carry,
                moved up here per the v6 copy so proof lands above the fold. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              style={{ marginTop: "clamp(20px, 3vw, 36px)", maxWidth: 720 }}
            >
              <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", margin: "0 0 18px" }}>
                The framework behind these brands.
              </p>
              <picture>
                <source srcSet="/images/logos/logo-strip-desktop.png" media="(min-width: 768px)" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logos/logo-strip-mobile.png"
                  alt="Client logos: JJ Virgin, Laila Ali, Mindshare, Family Brand, Katalyst and DesBio"
                  style={{ maxWidth: "100%", height: "auto", opacity: 0.9, display: "block" }}
                />
              </picture>
            </motion.div>
          </div>

          {/* Report mockup … the top of a real Roadmap (header, Legacy Read, the
              nine-lever wheel) so the product is visible before anyone scrolls. */}
          <motion.div
            className="hero-mockup"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative" }}
          >
            <Image
              src="/images/report-mockup.png"
              alt="A Brand Elevation Roadmap report, opened to the Legacy Read and the nine-lever wheel"
              width={1000}
              height={905}
              priority
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderTop: `4px solid ${LIME}`,
                borderRadius: 4,
                boxShadow: "0 30px 80px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10)",
              }}
            />
          </motion.div>
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
            <ScotchH2>
              Somebody Just <em style={{ fontStyle: "italic", fontWeight: 400 }}>Googled You.</em>
            </ScotchH2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                You were introduced on a podcast. Someone in the audience typed
                your name into their phone before the episode finished, landed on
                your site, gave it the eight seconds everyone gives everything, and
                formed a complete opinion about what you charge.
              </p>
              <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                You weren&apos;t in the room for that conversation.{" "}
                <strong style={{ color: "#000", fontWeight: 600 }}>
                  Your brand was, and it may have said a few things you&apos;d never
                  say out loud.
                </strong>{" "}
                That you&apos;re newer at this than you are. That you&apos;re roughly
                interchangeable with the other four people they&apos;re considering.
                That your fee should probably start with a smaller number.
              </p>
              <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                None of that reflects your work. It reflects a brand that stopped
                keeping up with you somewhere around your last big leap… and is
                still describing the version of you it met.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start", marginTop: 6 }}>
              <AccentBtn onClick={handleCTA} disabled={isLoading}>
                {isLoading ? "Loading…" : <>Get My Free Brand Elevation Roadmap&nbsp;→</>}
              </AccentBtn>
              <p style={{ fontFamily: SANS, fontSize: 15, letterSpacing: "0.06em", color: "rgba(17,34,72,0.6)", margin: 0 }}>
                No credit card&nbsp;&nbsp;•&nbsp;&nbsp;About five minutes&nbsp;&nbsp;•&nbsp;&nbsp;Never expires
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
          style={{ ...container }}
          initial="hidden"
          whileInView="visible"
          variants={rv}
          viewport={vp}
        >
          <ScotchH2 center style={{ maxWidth: 900, margin: "0 auto clamp(40px, 6vw, 72px)" }}>
            The Framework Behind the Brands You{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>Already Recognize</em>
          </ScotchH2>
        </motion.div>

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
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                Brand Elevation™ is the framework we&apos;ve used with JJ Virgin,
                Laila Ali, Mindshare, DesBio, and two decades of founders whose work
                had outpaced the brand carrying it.{" "}
                <strong style={{ color: "#000", fontWeight: 600 }}>
                  Your Roadmap runs on the same framework. Free.
                </strong>
              </p>
              <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                A generic AI prompt returns generic advice. Ours reads your{" "}
                <em style={{ fontStyle: "italic" }}>actual</em> brand… your site,
                your language, how you price and position what you sell… and returns
                findings that would be useless to anyone else. Then it puts them in
                order. Get Clear. Get Noticed. Get Paid.
              </p>
              <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(17,34,72,0.72)", margin: 0 }}>
                The order is doing more work than it appears to. No one gets noticed
                for a message that hasn&apos;t landed, and no one commands premium
                fees for work the market hasn&apos;t registered. So we begin at the
                foundation, which is the least visible part of the work and the
                reason the rest of it holds.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          THE THREE TIERS … navy, 3 columns of pillars
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: NAVY, ...sectionPad }}>
        <div style={container}>
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center", maxWidth: 820, margin: "0 auto" }}
          >
            <ScotchH2 white center>
              Get Clear. Get Noticed.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Get Paid.</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.82)", maxWidth: 720, margin: 0 }}>
              Three pillars. Nine levers. One order that never changes.
            </p>
          </motion.div>

          {/* Process diagram — the framework at a glance. Its navy background
              matches this band, so it sits flush with no visible edges. */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", justifyContent: "center", marginTop: "clamp(40px, 5vw, 64px)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand-framework-venn.png"
              alt="The Left Right Labs Brand Elevation framework — Get Clear, Get Noticed, and Get Paid — with nine levers (Brand Personality, Signature Framework, Elevated Audience, Magnetic Voice, Visual Positioning, Online Presence, Brand Authority, Offer Positioning, Visionary Growth) around a central Legacy."
              style={{ width: "100%", maxWidth: 640, height: "auto", display: "block" }}
            />
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="cards3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid rgba(255,255,255,0.14)", marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {[
              {
                num: "01", tier: "Get Clear",
                lead: "Clarity first. On your business, your model, and exactly who you're for. Everything else is built on this, which is why nothing else comes before it.",
                pillars: [
                  ["Brand Personality", "The traits that make your brand unmistakably yours."],
                  ["Signature Framework", "The approach that's yours alone, and can't be borrowed."],
                  ["Elevated Audience", "A refined picture of who you serve at your highest level."],
                ],
              },
              {
                num: "02", tier: "Get Noticed",
                lead: "Then presence. How your brand looks, sounds, and shows up, so you're the one they remember.",
                pillars: [
                  ["Magnetic Voice", "The way your brand talks, so it finally sounds like the person behind it."],
                  ["Visual Positioning", "The identity system that makes you recognizable before anyone reads a word."],
                  ["Online Presence", "How easily you're found wherever your people already are."],
                ],
              },
              {
                num: "03", tier: "Get Paid",
                lead: "Then the money. The authority and the offers to command what your reputation has already earned.",
                pillars: [
                  ["Brand Authority", "The credibility that makes you the obvious choice before anyone asks for a proposal."],
                  ["Offer Positioning", "Services and pricing aligned so clients move through your work the way it was meant to flow."],
                  ["Visionary Growth", "Strategy that keeps pace with you, because you're not finished."],
                ],
              },
            ].map((col, i) => (
              <div key={i} style={{ padding: "44px 40px 48px", display: "flex", flexDirection: "column", gap: 20, borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.14)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", fontSize: "clamp(34px, 4vw, 52px)", lineHeight: 1, color: LIME }}>
                    <span style={{ display: "inline-block", transform: "scaleY(1.2)", transformOrigin: "top left" }}>{col.num}</span>
                  </span>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(30px, 3.4vw, 48px)", lineHeight: 1, color: "#fff", margin: 0 }}>{col.tier}</h3>
                </div>
                <p style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.45, color: "rgba(255,255,255,0.78)", margin: 0 }}>{col.lead}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 6 }}>
                  {col.pillars.map(([name, desc]) => (
                    <div key={name} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 16, letterSpacing: "0.04em", color: "#fff" }}>{name}</span>
                      <span style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.45, color: "rgba(255,255,255,0.66)" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          METHOD VIDEO … white, explainer (PLACEHOLDER embed)
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", ...sectionPad }}>
        <div style={container}>
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 800, margin: "0 auto clamp(32px, 4vw, 56px)", alignItems: "center", textAlign: "center" }}
          >
            <ScotchH2 center>
              Why Clarity <em style={{ fontStyle: "italic", fontWeight: 400 }}>Comes First</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(17,34,72,0.72)", margin: 0 }}>
              A few minutes on the method behind your Roadmap… why clarity has to
              land before visibility, and what that one free lever tends to set in
              motion.
            </p>
          </motion.div>

          {/* Method video — Vimeo unlisted (player URL + `h=` privacy hash). */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: NAVY, overflow: "hidden", borderTop: `4px solid ${LIME}` }}
          >
            <iframe
              src="https://player.vimeo.com/video/1213335065?h=b0f9f53887&title=0&byline=0&portrait=0"
              title="Why your Brand Elevation Roadmap is the first step"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              allowFullScreen
            />
          </motion.div>
        </div>
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
            <ScotchH2 white center>
              Everything{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Inside Your Roadmap</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.82)", maxWidth: 680, margin: 0 }}>
              Free to start, with one real lever included. The complete plan is
              $97, with a fourteen-day money-back guarantee.
            </p>
          </motion.div>

          {/* Dark numbered cards */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="cards3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid rgba(255,255,255,0.14)", marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {[
              { num: "01", h3: "Where You're Losing People", p: "A straight read across all nine levers. Which ones are working for you, and which are quietly turning people away." },
              { num: "02", h3: "The One to Pull First, Free", p: "We give away the best one on purpose. You'll know exactly which lever moves the most for your brand right now, at no cost, along with three short lessons on the method behind it. One specific action, not another suggestion to clarify your messaging." },
              { num: "03", h3: "Your Full 90-Day Plan", p: "When you're ready, $97 gives you the other eight, sequenced across 30, 60, and 90 days, so you work them in the order that compounds. It comes with example rewrites in your own voice, so you're never starting from a blank page, and a link you can hand to whoever helps you carry it out." },
            ].map((card, i) => (
              <div key={i} style={{ padding: "44px 40px 48px", display: "flex", flexDirection: "column", gap: 18, borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.14)" }}>
                <p style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, color: LIME, margin: "0 0 8px" }}>
                  <span style={{ display: "block", transform: "scaleY(1.2)", transformOrigin: "top left" }}>{card.num}</span>
                </p>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(24px, 2.4vw, 32px)", lineHeight: 1.1, textTransform: "capitalize", color: "#fff", margin: 0 }}>{card.h3}</h3>
                <p style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.45, color: "rgba(255,255,255,0.78)", margin: 0 }}>{card.p}</p>
              </div>
            ))}
          </motion.div>

          {/* Price / value stack + CTA */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ marginTop: "clamp(48px, 6vw, 84px)", textAlign: "center", display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, justifyContent: "center" }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(56px, 8vw, 96px)", lineHeight: 1, color: LIME }}>
                <span style={{ display: "inline-block", transform: "scaleY(1.2)", transformOrigin: "center" }}>$97</span>
              </span>
              <span style={{ fontFamily: SANS, fontSize: 18, color: "rgba(255,255,255,0.7)" }}>for the complete plan</span>
            </div>
            <p className="bal" style={{ fontFamily: SANS, fontSize: 20, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 640, margin: 0 }}>
              All eight remaining levers, example rewrites in your voice, ninety
              days of sequencing, and a link your team can work from. Ninety days of
              direction for less than the cost of a single hour with most
              strategists.
            </p>
            <p className="bal" style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.5, color: "rgba(255,255,255,0.66)", maxWidth: 560, margin: 0 }}>
              Fourteen-day money-back guarantee. When it doesn&apos;t earn its
              place, you have your $97 back.
            </p>
            <AccentBtn onClick={handleCTA} disabled={isLoading}>
              {isLoading ? "Loading…" : <>Get My Free Brand Elevation Roadmap&nbsp;→</>}
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
            <ScotchH2>
              Three Steps. <em style={{ fontStyle: "italic", fontWeight: 400 }}>About Five Minutes.</em>
            </ScotchH2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="cards3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid rgba(17,34,72,0.12)", marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {[
              { num: "01", h3: "Tell Us About Your Brand", p: "Your website, your details, and five questions about where you're headed and who you want in the room." },
              { num: "02", h3: "We Read Your Brand", p: "Your online presence goes through the Brand Elevation™ framework, which is looking for the gap between what you actually deliver and what your brand is currently promising." },
              { num: "03", h3: "See Your Roadmap", p: "On screen about two minutes later, with a link in your inbox to keep. It never expires." },
            ].map((card, i) => (
              <div key={i} style={{ padding: "44px 40px 48px", display: "flex", flexDirection: "column", gap: 18, borderLeft: i === 0 ? "none" : "1px solid rgba(17,34,72,0.12)" }}>
                <p style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, color: LIME, margin: "0 0 8px" }}>
                  <span style={{ display: "block", transform: "scaleY(1.2)", transformOrigin: "top left" }}>{card.num}</span>
                </p>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(24px, 2.4vw, 32px)", lineHeight: 1.1, textTransform: "capitalize", color: NAVY, margin: 0 }}>{card.h3}</h3>
                <p style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.45, color: "rgba(17,34,72,0.72)", margin: 0 }}>{card.p}</p>
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
              <p style={{ fontFamily: SANS, fontWeight: 400, fontStyle: "italic", fontSize: 20, lineHeight: 1.5, color: "#fff", margin: 0, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
                &ldquo;I&apos;ve never had a branding company so intimately involved in every step.&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto" }}>
                <Image src="/images/jj-virgin-2.png" alt="JJ Virgin" width={56} height={56} style={{ borderRadius: 999, objectFit: "cover", flexShrink: 0, width: 56, height: 56 }} />
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>JJ Virgin</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.78)", marginTop: 5 }}>4× NYT Bestselling Author &amp; Founder, Mindshare Collaborative</div>
                </div>
              </div>
            </div>

            {/* Laila Ali … lime monogram */}
            <div style={{ borderLeft: `3px solid ${LIME}`, background: "rgba(255,255,255,0.04)", padding: "36px 34px", display: "flex", flexDirection: "column", gap: 26 }}>
              <p style={{ fontFamily: SANS, fontWeight: 400, fontStyle: "italic", fontSize: 20, lineHeight: 1.5, color: "#fff", margin: 0, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
                &ldquo;They gave me a roadmap… and we&apos;ve been winning ever since.&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto" }}>
                <Image src="/images/laila-ali.jpg" alt="Laila Ali" width={56} height={56} style={{ borderRadius: 999, objectFit: "cover", flexShrink: 0, width: 56, height: 56 }} />
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>Laila Ali</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.78)", marginTop: 5 }}>World Champion Athlete &amp; Lifestyle Entrepreneur</div>
                </div>
              </div>
            </div>

            {/* Chris & Melissa Smith … lime monogram */}
            <div style={{ borderLeft: `3px solid ${LIME}`, background: "rgba(255,255,255,0.04)", padding: "36px 34px", display: "flex", flexDirection: "column", gap: 26 }}>
              <p style={{ fontFamily: SANS, fontWeight: 400, fontStyle: "italic", fontSize: 20, lineHeight: 1.5, color: "#fff", margin: 0, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
                &ldquo;It felt effortless… we walked away with a beautiful brand and solid strategy.&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto" }}>
                <Image src="/images/chris-melissa.png" alt="Chris &amp; Melissa Smith" width={56} height={56} style={{ borderRadius: 999, objectFit: "cover", objectPosition: "top center", flexShrink: 0, width: 56, height: 56 }} />
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>Chris &amp; Melissa Smith</div>
                  <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.78)", marginTop: 5 }}>Founders, Family Brand</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.78)", maxWidth: 760, margin: "48px 0 0" }}
          >
            These leaders came to us for private brand engagements. Your Roadmap
            runs on the same framework theirs did.
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
          <ScotchH2 white center>
            Award-Winning Branding for Leaders{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>Who Know Who They Are</em>
          </ScotchH2>
          <p className="bal" style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.82)", maxWidth: 800, margin: "26px auto 0", textAlign: "center" }}>
            Nearly two decades of bringing clarity, message, and presence into
            alignment. Some of our clients arrived with a name you&apos;d recognize
            and a brand that no longer matched it. Some arrived years before anyone
            knew them. Where you are in your growth doesn&apos;t change the
            framework. Whether your brand has kept pace with you does.
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
            <ScotchH2>
              Your Questions, <em style={{ fontStyle: "italic", fontWeight: 400 }}>Answered</em>
            </ScotchH2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ marginTop: "clamp(40px, 5vw, 64px)", borderTop: "1px solid rgba(17,34,72,0.12)", maxWidth: 900 }}
          >
            <FaqItem q="Is This Actually" qEm="Free?" a="It is, and there's no catch to go looking for. No credit card, and nothing that starts charging you quietly in thirty days. You get the full read across all nine levers, three short lessons, and the one lever to pull first, at no cost. The other eight and your 90-day plan are $97, whenever you decide you want them." defaultOpen />
            <FaqItem q="What If The $97 Upgrade" qEm="Isn't Useful?" a="Then you have your $97 back. Fourteen days, no questions. We'd rather refund the occasional plan than have anyone feel they paid for something that will sit unread. Your Roadmap lives online, never expires, and there's no PDF to lose." />
            <FaqItem q="Will I Be Pitched At" qEm="The End?" a="You'll see the $97 option inside your free Roadmap, and we'll follow up by email, because we're a business and you're an adult who can decide. What you won't get is a surprise sales call, a countdown timer, or a message in your DMs. Read the free version, pull the one lever, and decide from there." />
            <FaqItem q="How Is This Different From A Generic" qEm="Online Quiz?" a="A quiz asks you a dozen multiple-choice questions and sorts you into a category. Your Roadmap doesn't ask what your brand is like. It looks. It reads your actual website and public presence, runs what it finds through the Brand Elevation™ framework, and returns findings specific enough to be useless to anyone else. No two Roadmaps are the same." />
            <FaqItem q="Why Do You Fix Things In A Specific" qEm="Order?" a="Because the order is where most brand work quietly fails. Founders invest in visibility before the message is clear, or in a new site before they know exactly who it's for, and then wonder why the beautiful new thing didn't move anything. Clarity comes first because everything else is built on it. Presence without clarity is noise with a nice font, and premium pricing without either is a hope. So we sequence it: Get Clear, Get Noticed, Get Paid." />
            <FaqItem q="I've Already Invested In Branding. Why Would I" qEm="Need This?" a="Then you'll recognize a real read when you see one. Brands don't stay aligned on their own. You've grown since that last investment, your offers have changed, your audience has moved upmarket, and the brand you paid for is still describing the version of you it met. The Roadmap is a check-in, not a do-over: which parts of that investment are still earning their place, and which have quietly drifted." />
            <FaqItem q="How Much Time Does This" qEm="Actually Take?" a="About five minutes on your end. Your website, a few details, and five questions about your goals and who you're trying to reach. Then our side takes about two minutes to read everything and build your Roadmap. It arrives on screen and in your inbox, and it never expires." />
            <FaqItem q="How Does AI Fit" qEm="Into This?" a="AI does the reading. It moves through your entire public brand presence in the time it would take a strategist to open the first tab, and it holds every finding against the Brand Elevation™ framework we built over nearly two decades of client work. The framework is ours. The judgment about what matters, and in what order, is ours. AI makes it possible to give you that read in two minutes instead of two weeks." />
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

            <ScotchH2 white>
              Five Minutes{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>From Now</em>
            </ScotchH2>

            <p style={{ fontFamily: SANS, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.82)", maxWidth: 600, margin: 0 }}>
              You could be looking at the specific reasons your brand isn&apos;t
              landing the way you do in person, and the one lever to pull about it.
            </p>

            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, lineHeight: 1.6, color: LIME, maxWidth: 600, margin: 0 }}>
              Because clarity looks good on you.
            </p>

            <AccentBtn onClick={handleCTA} disabled={isLoading}>
              {isLoading ? "Loading…" : <>Get My Free Brand Elevation Roadmap&nbsp;→</>}
            </AccentBtn>

            <p style={{ fontFamily: SANS, fontSize: 15, letterSpacing: "0.06em", color: "rgba(255,255,255,0.78)", margin: 0 }}>
              No credit card to start&nbsp;&nbsp;•&nbsp;&nbsp;About five minutes&nbsp;&nbsp;•&nbsp;&nbsp;Never expires
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
              Build the Brand You&apos;re{" "}
              <em style={{ color: LIME }}>Meant</em>{" "}
              to Lead.<sup style={{ fontSize: 9 }}>™</sup>
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
            <span>We take your brand seriously. Ourselves? Not so much.</span>
            <span>© 2026 Left Right Labs. All rights reserved.</span>
            <span>Brand Elevation™ · Dallas, TX</span>
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

        .hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(40px, 5vw, 80px);
          align-items: center;
        }
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-mockup { max-width: 560px; }
        }

        /* Typography polish … avoid orphans everywhere, balance the short
           centered lines that were ragging badly. */
        .baa-page p { text-wrap: pretty; }
        .baa-page .bal { text-wrap: balance !important; }

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
