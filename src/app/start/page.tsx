"use client";

import { useState, useEffect } from "react";
import { trackConversion } from "@/lib/analytics";
import { motion } from "framer-motion";
import Image from "next/image";
import { VideoTestimonial, type Testimonial } from "@/components/video-testimonial";

// ─── Design tokens ───────────────────────────────────────────────────────────
const NAVY = "#112248";
const LIME = "#a7c140";
const SANS = "'sweet-sans-pro', Montserrat, Arial, sans-serif";
const SERIF = "scotch-display, 'Playfair Display', Georgia, serif";
// Body copy runs 18px on a phone up to 22px on desktop on leftrightlabs.com
// (--text-m to --text-l). A fixed 22px gave 25-character lines at 375px.
const BODY = "clamp(17px, 13px + 1.1vw, 22px)";
const BODY_SM = "clamp(16px, 12.5px + 0.8vw, 19px)";

// Quotes, names and titles are carried over verbatim from
// leftrightlabs.com/testimonials so the two sites agree. Vimeo ids come from
// TESTIMONIALS [DB]; posters are local stills, since nine live embeds would
// each load a player before anyone pressed play.
const TESTIMONIALS: Record<string, Testimonial> = {
  jj: {
    vimeoId: "833421705", poster: "/images/testimonials/jj-virgin.jpg",
    quote: "They created a better brand image than I could have ever done for myself. I couldn\u2019t see it\u2026 Trina and her team pulled it out of me.",
    name: "JJ Virgin", title: "4\u00d7 NYT Bestselling Author & Founder of Mindshare Collaborative",
  },
  laila: {
    vimeoId: "514702076", poster: "/images/testimonials/laila-ali.jpg",
    quote: "They wanted to know me. They took everything I said\u2026 my vision, what hadn\u2019t worked\u2026 and turned it into a winning strategy. We\u2019ve been winning ever since.",
    name: "Laila Ali", title: "Boxing Champion, Entrepreneur & Wellness Brand Founder",
  },
  forrest: {
    vimeoId: "818524362", poster: "/images/testimonials/forrest-sauer.jpg",
    quote: "Our brand finally matches the level we\u2019re operating at. The quality of our leads, our client conversations\u2026 everything leveled up.",
    name: "Dr. Forrest Sauer", title: "Founder of Twin Oaks Health",
  },
  geeta: {
    vimeoId: "1117462656", poster: "/images/testimonials/geeta-sidhu-robb.jpg",
    quote: "Working with Left Right Labs enabled the brand to be taken completely seriously. Within about a month and a half, we were at the United Nations in New York presenting the brand.",
    name: "Geeta Sidhu-Robb", title: "Founder of WCorp",
  },
  brent: {
    vimeoId: "1106929482", poster: "/images/testimonials/brent-weaver.jpg",
    quote: "Their work has helped generate hundreds of thousands in sales.",
    name: "Brent Weaver", title: "Founder of UGURUS",
  },
  darlene: {
    vimeoId: "1181622528", poster: "/images/testimonials/darlene-mitchell.jpg",
    quote: "With their help, I was able to elevate my audience to who I truly wanted to serve.",
    name: "Darlene Mitchell", title: "Business Coach",
  },
  tim: {
    vimeoId: "833418560", poster: "/images/testimonials/tim-organ.jpg",
    quote: "We needed clarity\u2026 and Left Right Labs delivered crystal clear direction. Everything they did for us was truly exceptional.",
    name: "Tim Organ", title: "CEO of Mindshare",
  },
  bonni: {
    vimeoId: "1181654682", poster: "/images/testimonials/bonni-london.jpg",
    quote: "I feel like I am more myself\u2026 all of my marketing reflects me now.",
    name: "Bonni London", title: "Founder of London Wellness",
  },
  sherri: {
    vimeoId: "1209633837", poster: "/images/testimonials/sherri-griggs.jpg",
    quote: "Left Right Labs helped me put that into a voice that I can share with others and others can now understand and see what my brand is.",
    name: "Sherri Griggs", title: "Founder of Balanced Body Medical",
  },
};

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

// ─── Scaley … the Scotch Display signature, per [CANON] Brand ────────────────
// Canon (2026-09-03): set the face at 1.2x its nominal size and compress it
// horizontally to 83.33%. Same letterform proportions as the old scaleY(1.2),
// but the extra height comes from font-size, which participates in layout, so
// nothing overflows and no padding hack has to guess how many lines wrapped.
function Scaley({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <span
      style={{
        display: "block",
        width: "fit-content",
        marginInline: center ? "auto" : 0,
        fontSize: "1.2em",
        lineHeight: 0.85,
        paddingInline: "0.1em",
        transform: "scaleX(0.8333)",
        transformOrigin: center ? "center" : "left center",
      }}
    >
      {children}
    </span>
  );
}

// ─── ScotchH2 … uses Scaley internally ───────────────────────────────────────
/**
 * The three reassurance badges under every CTA. One definition, three call
 * sites: they drifted out of sync once already.
 */
function Badges({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 22px", marginTop: 4 }}>
      {["Full assessment, free", "Takes 5 minutes", "First fix included"].map((item) => (
        <span
          key={item}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: SANS,
            fontSize: 16,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            color: dark ? "rgba(17,34,72,0.72)" : "rgba(255,255,255,0.78)",
          }}
        >
          <span style={{ color: LIME, fontSize: 13 }}>✦</span>
          {item}
        </span>
      ))}
    </div>
  );
}

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
        fontSize: "clamp(32px, 5vw, 76px)",
        lineHeight: 1,
        letterSpacing: "-0.01em",
        textTransform: "capitalize",
        color: white ? "#fff" : NAVY,
        textWrap: "balance" as React.CSSProperties["textWrap"],
        margin: 0,
        paddingBottom: "0.35em",
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
            color: NAVY,
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
            color: "#000",
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
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: "clamp(15px, 12px + 0.55vw, 20px)",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        padding: "clamp(12px, 1vw, 15px) clamp(22px, 2.6vw, 38px)",
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
    // Sent, not buffered: this is a full page navigation, so anything still in
    // the buffer dies with the document. The tag configures within a few hundred
    // milliseconds of load and this fires on a click, so it is always ready.
    trackConversion("cta_start_assessment_clicked", {
      event_category: "engagement",
      event_label: "start_page",
    });
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
              width={144}
              height={41}
              style={{ height: 41, width: "auto" }}
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
            <AccentBtn onClick={handleCTA} disabled={isLoading} className="hdr-cta">
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
          style={{
            ...container,
            position: "relative",
            paddingTop: "clamp(120px, 16vh, 180px)",
            paddingBottom: "clamp(80px, 10vw, 130px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: "clamp(36px, 4vw, 56px)" }}>\1
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
                  \1\n                  maxWidth: 1100,
                  textWrap: "pretty" as React.CSSProperties["textWrap"],
                }}
              >
                <Scaley>
                  Somebody Just Googled You.
                  <br />
                  <em style={{ fontStyle: "italic", fontWeight: 400 }}>Here&apos;s What Your Brand Told Them.</em>
                \1\n          </div>\n\n          <div className="hero-grid">\n          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 660, margin: 0 }}
            >
              The people who&apos;ve worked with you already know. Everyone else is
              still deciding from your website.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 660, margin: 0 }}
            >
              Your free Brand Elevation Profile finds every place your brand is
              mismatched, and tells you exactly what to fix first… before you spend
              another dime guessing what to do next.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <AccentBtn onClick={handleCTA} disabled={isLoading}>
                {isLoading ? "Loading…" : <>Get My Free Brand Elevation Profile&nbsp;→</>}
              </AccentBtn>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
            >
              <Badges />
            </motion.div>

          </div>

          {/* Report mockup … the top of a real Profile (header, What We See, the
              nine-step wheel) so the product is visible before anyone scrolls. */}
          <motion.div
            className="hero-mockup"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative" }}
          >
            <Image
              src="/images/report-mockup.png"
              alt="A Brand Elevation Profile report, showing the What We See summary and the nine-step wheel"
              width={1400}
              height={1332}
              priority
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderTop: `4px solid ${LIME}`,
                borderRadius: 4,
                \1\n          </div>\2

      {/* ════════════════════════════════════════════════════════
          LOGO BAND … navy, full-bleed proof strip
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: NAVY, paddingTop: "clamp(26px, 3vw, 44px)", paddingBottom: "clamp(26px, 3vw, 44px)", borderTop: "1px solid rgba(255,255,255,0.10)" }}>
        <motion.div
          initial="hidden" whileInView="visible" variants={rv} viewport={vp}
          className="ctr"
          style={{ textAlign: "center" }}
        >
          <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 16, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.62)", margin: "0 0 clamp(18px, 2.4vw, 30px)" }}>
            The framework behind these brands.
          </p>
          {/* Full-bleed: the strip asset is 2048px wide, so it stays crisp
              edge to edge on anything short of a very large display. */}
          <div style={{ paddingLeft: "max(16px, 2vw)", paddingRight: "max(16px, 2vw)" }}>
            <picture>
              <source srcSet="/images/logos/logo-strip-desktop.png" media="(min-width: 768px)" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logos/logo-strip-mobile.png"
                alt="Client logos: JJ Virgin, Laila Ali, Mindshare, Family Brand, Katalyst and DesBio"
                style={{ width: "100%", maxWidth: 1380, height: "auto", opacity: 0.6, display: "block", margin: "0 auto" }}
              />
            </picture>
          </div>
        </motion.div>
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
              You Weren&apos;t in the{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Room.</em>
            </ScotchH2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "#000", margin: 0 }}>
                You were introduced on a podcast. Someone in the audience typed
                your name into their phone before the episode finished, landed on
                your site, gave it the eight seconds everyone gives everything, and
                formed a complete opinion about what you charge.
              </p>
              <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "#000", margin: 0 }}>
                You weren&apos;t there for that conversation.{" "}
                <strong style={{ color: "#000", fontWeight: 700 }}>
                  Your brand was, and it may have said a few things you&apos;d never
                  say out loud.
                </strong>{" "}
                That you&apos;re newer at this than you are, that you&apos;re roughly
                interchangeable with the other four people they&apos;re considering,
                and that your fee should probably start with a smaller number.
              </p>
              <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "#000", margin: 0 }}>
                That gap isn&apos;t your work. It&apos;s a brand that stopped keeping
                up with you somewhere around your last big leap… and is still
                describing the version of you it met.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start", marginTop: 6 }}>
              <AccentBtn onClick={handleCTA} disabled={isLoading}>
                {isLoading ? "Loading…" : <>Get My Free Brand Elevation Profile&nbsp;→</>}
              </AccentBtn>
              <Badges dark />
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
          PROOF … navy, three video testimonials
          Sits between the problem and the method: the reader has just been
          told their brand is misrepresenting them, so this is where they ask
          whether it can actually be fixed.
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: NAVY, ...sectionPad }}>
        <div style={container}>
          <motion.div
            className="ctr"
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center", maxWidth: 820, margin: "0 auto" }}
          >
            <ScotchH2 white center>
              Recognize <em style={{ fontStyle: "italic", fontWeight: 400 }}>Anyone?</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 720, margin: 0 }}>
              Every founder here worked through the Brand Elevation Method, and your Profile runs on the same one.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="tgrid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 34, marginTop: "clamp(40px, 5vw, 64px)" }}
          >
            {[TESTIMONIALS.jj, TESTIMONIALS.laila, TESTIMONIALS.forrest].map((t) => (
              <VideoTestimonial key={t.vimeoId} t={t} dark />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          THE STRATEGIC LENS … white, image left / text right
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#fff", ...sectionPad }}>
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
              <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "#000", margin: 0 }}>
                The Brand Elevation Method is the framework we&apos;ve used with JJ Virgin,
                Laila Ali, Mindshare, DesBio, and two decades of founders whose work
                had outpaced the brand carrying it.{" "}
                <strong style={{ color: "#000", fontWeight: 700 }}>
                  Your Profile runs on the same framework. Free.
                </strong>
                </p>
                <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "#000", margin: 0 }}>
                  It was built for founders whose work has moved faster than their
                  website… the ones getting introduced with a résumé the brand
                  hasn&apos;t caught up to yet. When that&apos;s you, the read is going to
                  be useful. When you&apos;re still deciding what the business is, come
                  back once you&apos;ve decided.
                </p>
              <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "#000", margin: 0 }}>
                A generic AI prompt returns generic advice. Ours reads your{" "}
                <em style={{ fontStyle: "italic" }}>actual</em> brand… your site,
                your language, how you price and position what you sell… and returns
                findings that would be useless to anyone else. No two Profiles have
                ever matched, and yes, we checked. Then it puts them in order. Get
                Clear. Get Noticed. Get Paid.
              </p>
              <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "#000", margin: 0 }}>
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
            className="ctr"
            style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center", maxWidth: 820, margin: "0 auto" }}
          >
            {/* The section above introduces Brand Elevation, so this one has to
                name the method outright, or the diagram below never gets
                identified as the method. "Get Clear. Get Noticed. Get Paid."
                is the method's descriptor, not a section title, so it sits
                here as a subhead. */}
            <ScotchH2 white center>
              The Brand Elevation{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Method</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontWeight: 600, fontSize: "clamp(18px, 1.9vw, 26px)", letterSpacing: "0.02em", color: LIME, margin: 0 }}>
              Get Clear. Get Noticed. Get Paid.
            </p>
          </motion.div>

          {/* Process diagram — the framework at a glance. Its navy background
              matches this band, so it sits flush with no visible edges. */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="ctr"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "clamp(40px, 5vw, 64px)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand-elevation-framework-wheel.png"
              alt="The Brand Elevation framework: Get Clear, Get Noticed and Get Paid overlapping at Align, Activate and Ascend with Legacy at the centre, ringed by the nine steps."
              style={{ width: "100%", maxWidth: 620, height: "auto", display: "block" }}
            />
            <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 620, margin: "clamp(20px, 2.4vw, 30px) 0 0", textAlign: "center" }}>
              Each segment on the outer ring is one of the nine steps. Your Profile reads all nine and shows you which step to take next.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="cards3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid rgba(255,255,255,0.14)", marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {[
              {
                num: "01", tier: "Get Clear",
                pillars: [
                  ["Brand Personality", "The traits that make your brand unmistakably yours."],
                  ["Signature Framework", "The approach that's yours alone, and can't be borrowed."],
                  ["Elevated Audience", "A refined picture of who you serve at your highest level."],
                ],
              },
              {
                num: "02", tier: "Get Noticed",
                pillars: [
                  ["Magnetic Voice", "The way your brand talks, so it finally sounds like the person behind it."],
                  ["Visual Positioning", "The identity system that makes you recognizable before anyone reads a word."],
                  ["Online Presence", "How easily you're found wherever your people already are."],
                ],
              },
              {
                num: "03", tier: "Get Paid",
                pillars: [
                  ["Brand Authority", "The credibility that makes you the obvious choice before anyone asks for a proposal."],
                  ["Offer Positioning", "Services and pricing aligned so clients move through your work the way it was meant to flow."],
                  ["Visionary Growth", "Strategy that keeps pace with you, because you're not finished."],
                ],
              },
            ].map((col, i) => (
              <div key={i} style={{ padding: "44px 40px 48px", display: "flex", flexDirection: "column", gap: 20, borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.14)" }}>
                {/* Number sits above the tier, not beside it: inline, the pair
                    outgrew a third of the row and "Get Noticed" broke across
                    two lines. */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", fontSize: "clamp(30px, 3.2vw, 42px)", lineHeight: 1, color: LIME }}>
                    <span style={{ display: "inline-block", fontSize: "1.2em", lineHeight: 0.85, transform: "scaleX(0.8333)", transformOrigin: "left center" }}>{col.num}</span>
                  </span>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(26px, 2.6vw, 38px)", lineHeight: 1.05, color: "#fff", margin: 0, whiteSpace: "nowrap" }}>{col.tier}</h3>
                </div>
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
            className="ctr"
            style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 800, margin: "0 auto clamp(32px, 4vw, 56px)", alignItems: "center", textAlign: "center" }}
          >
            <ScotchH2 center>
              Why We Won&apos;t Let You Start{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>With the Logo</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "#000", margin: 0 }}>
              This short video covers the method behind your Profile… why clarity
              has to land before visibility, and what that one free step tends to
              set in motion.
            </p>
          </motion.div>

          {/* Method video — Vimeo unlisted (player URL + `h=` privacy hash). */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: NAVY, overflow: "hidden", borderTop: `4px solid ${LIME}` }}
          >
            <iframe
              src="https://player.vimeo.com/video/1213335065?h=b0f9f53887&title=0&byline=0&portrait=0"
              title="Why your Brand Elevation Profile is the first step"
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
            className="ctr"
            style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center", maxWidth: 800, margin: "0 auto" }}
          >
            <ScotchH2 white center>
              What&apos;s Free, What&apos;s $97,{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>and Why</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 680, margin: 0 }}>
              The full assessment across all nine steps is free, with your first
              step unlocked so you can act on it today. The complete plan is $97,
              with a fourteen-day money-back guarantee.
            </p>
          </motion.div>

          {/* Dark numbered cards */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="cards3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid rgba(255,255,255,0.14)", marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {[
              { num: "01", h3: "Where You're Losing People", p: "A complete read across all nine steps, free, showing you which ones are working for you and which are quietly turning people away." },
              { num: "02", h3: "The Best One, Free, On Purpose", p: "You'll know exactly which step matters most for your brand right now, at no cost, along with three short lessons on the method behind it. You'll leave with one specific action instead of another vague note to clarify your messaging." },
              { num: "03", h3: "The Other Eight, In Order", p: "When you're ready, $97 gives you the other eight steps in the order they have to happen, Get Clear first… because a message nobody understands can't get noticed, and a brand nobody notices doesn't get paid. It comes with example rewrites in your own voice, so you're never starting from a blank page, and a link you can hand to whoever helps you carry it out." },
            ].map((card, i) => (
              <div key={i} style={{ padding: "44px 40px 48px", display: "flex", flexDirection: "column", gap: 18, borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.14)" }}>
                <p style={{ fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1, color: LIME, margin: "0 0 8px" }}>
                  <span style={{ display: "block", width: "fit-content", fontSize: "1.2em", lineHeight: 0.85, transform: "scaleX(0.8333)", transformOrigin: "left center" }}>{card.num}</span>
                </p>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(24px, 2.4vw, 32px)", lineHeight: 1.1, textTransform: "capitalize", color: "#fff", margin: 0 }}>{card.h3}</h3>
                <p style={{ fontFamily: SANS, fontSize: BODY_SM, lineHeight: 1.5, color: "rgba(255,255,255,0.78)", margin: 0 }}>{card.p}</p>
              </div>
            ))}
          </motion.div>

          {/* Price / value stack + CTA */}
          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="ctr"
            style={{ marginTop: "clamp(48px, 6vw, 84px)", textAlign: "center", display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, justifyContent: "center" }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(56px, 8vw, 96px)", lineHeight: 1, color: LIME }}>
                <span style={{ display: "inline-block", fontSize: "1.2em", lineHeight: 0.85, transform: "scaleX(0.8333)", transformOrigin: "center" }}>$97</span>
              </span>
              <span style={{ fontFamily: SANS, fontSize: 18, color: "rgba(255,255,255,0.7)" }}>for the complete plan</span>
            </div>
            <p className="bal" style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 640, margin: 0 }}>
              All eight remaining steps, sequenced, with example rewrites in your
              voice and a link your team can work from. Every step for less than
              the cost of a single hour with most strategists.
            </p>
            <p className="bal" style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.5, color: "rgba(255,255,255,0.66)", maxWidth: 560, margin: 0 }}>
              You have fourteen days to decide whether the Profile earned its place,
              or your money comes back, no questions asked.
              </p>
              <div className="ctr" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", maxWidth: 620, marginTop: 8 }}>
                <p className="bal" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, lineHeight: 1.5, color: "#fff", margin: 0 }}>
                  &ldquo;I wish I knew I needed to start here… I&apos;ve never put it together
                  like this. We&apos;re in a good place.&rdquo;
                </p>
                <p style={{ fontFamily: SANS, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                  Dr. Debbie Bright, DC, MS · on working through the Method
                </p>
              </div>
            <AccentBtn onClick={handleCTA} disabled={isLoading}>
              {isLoading ? "Loading…" : <>Get My Free Brand Elevation Profile&nbsp;→</>}
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
              Five Minutes From You.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Two From Us.</em>
            </ScotchH2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="steps3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {/* A connected stepper rather than a third numbered card grid: the
                section above already runs 01/02/03 in cards, and these are a
                sequence, so they should look like one. */}
            {[
              { num: "1", h3: "Tell Us About Your Brand", p: "You give us your website, a few details, and answers to five questions about where you're headed and who you want in the room." },
              { num: "2", h3: "We Read Your Brand", p: "Your online presence goes through the Brand Elevation Method, which looks for the gap between what you actually deliver and what your brand is currently promising." },
              { num: "3", h3: "See Your Profile", p: "It shows up on screen about two minutes later, with a link in your inbox to keep, and it never expires." },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16, paddingRight: 32 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${LIME}`, background: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", fontSize: 22, color: NAVY,
                    }}
                  >
                    {step.num}
                  </span>
                  {i < 2 && <span className="step-line" style={{ flex: 1, height: 1, background: "rgba(17,34,72,0.18)" }} />}
                </div>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "clamp(24px, 2.4vw, 32px)", lineHeight: 1.1, textTransform: "capitalize", color: NAVY, margin: 0 }}>{step.h3}</h3>
                <p style={{ fontFamily: SANS, fontSize: BODY_SM, lineHeight: 1.5, color: "#000", margin: 0 }}>{step.p}</p>
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
            className="ctr"
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center", textAlign: "center", maxWidth: 820, margin: "0 auto" }}
          >
            <ScotchH2 white center>
              Six Founders Who Ran It <em style={{ fontStyle: "italic", fontWeight: 400 }}>First</em>
            </ScotchH2>
            <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 720, margin: 0 }}>
              Same framework, same order, six different founders.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            className="tgrid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 34, marginTop: "clamp(40px, 5vw, 72px)" }}
          >
            {[TESTIMONIALS.geeta, TESTIMONIALS.brent, TESTIMONIALS.darlene,
              TESTIMONIALS.tim, TESTIMONIALS.bonni, TESTIMONIALS.sherri].map((t) => (
              <VideoTestimonial key={t.vimeoId} t={t} dark />
            ))}
          </motion.div>

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
          className="ctr"
          style={{ ...container, textAlign: "center", position: "relative", zIndex: 2 }}
        >
          <ScotchH2 white center>
            Award-Winning Branding for Leaders Who Know Who They Are{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400, textTransform: "none" }}>(and aren&apos;t afraid to show it)</em>
          </ScotchH2>
          <p className="bal" style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 800, margin: "26px auto 0", textAlign: "center" }}>
            We&apos;ve spent nearly two decades telling founders the thing nobody else
            in the room would say. Some of our clients arrived with a name you&apos;d
            recognize and a brand that no longer matched it, and some arrived years
            before anyone knew who they were. The framework doesn&apos;t care where you
            are in your growth. What it looks for is whether your brand has kept pace
            with you.
          </p>
          <p style={{ fontFamily: SANS, fontWeight: 600, fontSize: BODY, lineHeight: 1.45, color: "#fff", maxWidth: 800, margin: "18px auto 0", textAlign: "center" }}>
            The Brand Elevation Profile answers this for you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 34 }}>
            <AccentBtn onClick={handleCTA} disabled={isLoading}>
              {isLoading ? "Loading…" : <>Get My Free Brand Elevation Profile&nbsp;→</>}
            </AccentBtn>
            <Badges />
          </div>
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
              You Have Questions.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>We Have Opinions.</em>
            </ScotchH2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" variants={rv} viewport={vp}
            style={{ marginTop: "clamp(40px, 5vw, 64px)", borderTop: "1px solid rgba(17,34,72,0.12)", maxWidth: 900 }}
          >
            <FaqItem q="Is this actually" qEm="free?" a="Free as in nobody asks for a card, and free as in actually useful, which is the rarer kind. You get the full read on all nine steps, three short lessons on the Method, and your first move spelled out in full, because we would rather you know exactly where your brand stands than wonder what we're holding back. The other eight steps, in the order they have to happen, are $97 when you want them… and they'll still be sitting there when you do." defaultOpen />
            <FaqItem q="What happens when the $97 plan" qEm="isn't for me?" a="Then it comes back to you, and we mean that literally. You get fourteen days to decide whether the plan earned its place, and when it hasn't, one email gets you a refund with no form to fill out and no reason required. We would much rather return the occasional $97 than have someone carrying around a plan they never wanted to open. Your Profile stays online either way, and it never expires." />
            <FaqItem q="Will I be pitched at" qEm="the end?" a="A little, and we'll own it. The $97 option sits inside your free Profile, and a few emails will follow over the next several days, because we'd love for you to keep going and we're not shy about saying so. What you won't get is a sales call you never asked for, a countdown clock, or a stranger sliding into your DMs. Read the free version, make your first move, and take the rest at whatever pace suits you." />
            <FaqItem q="How is this different from an" qEm="online quiz?" a="A quiz asks you to describe your brand and then sorts you into one of five boxes. Your Profile skips the asking and goes to look. It reads your actual website and your public presence, runs everything it finds through the Brand Elevation Method, and hands back findings that only make sense for you, because they came from your words, your offers, and your prices. No two Profiles have ever matched, and yes, we checked." />
            <FaqItem q="What if my site is" qEm="embarrassing right now?" a="Good. That's the version we want to read. The further your brand has drifted from where you actually are, the sharper and more useful the Profile gets, because the gap is the whole point. Founders with a polished site and a fuzzy message get a subtler read. Founders who've been avoiding their homepage for two years get the clearest one we write." />
            <FaqItem q="Why do you fix things in a specific" qEm="order?" a="Because the order is where most brand work falls apart. Founders invest in visibility before the message has landed, or in a gorgeous new site before they know exactly who it's for, and then wonder why the beautiful new thing didn't move anything. Clarity goes first because everything else stands on it… a message nobody understands can't get noticed, and a brand nobody notices doesn't get paid. So your Profile starts there too, Get Clear, then Get Noticed, then Get Paid, and it runs that way every single time on purpose." />
            <FaqItem q="I've already invested in branding. Why would I" qEm="need this?" a="Then you already know what the right read is worth, and this one is free. Brands don't hold still. You've grown since that last investment, your offers have shifted, your audience has moved up, and the brand you paid for is still describing the version of you it met back then. Think of your Profile as a check-in on that work: it shows you which parts are still earning their keep and which have drifted while you were busy being good at your job." />
            <FaqItem q="How much time does this" qEm="actually take?" a="About five minutes on your side, most of it spent answering five questions about where you're headed and who you want in the room. Then we take about two more to read everything and build your Profile. It shows up on your screen and in your inbox, it lives online, and it never expires, so there's no PDF to lose in a downloads folder." />
            <FaqItem q="How does AI fit" qEm="into this?" a="AI does the reading, and it's very good at reading. It moves through your entire public presence in the time it would take one of us to open the first tab, and it holds everything it finds against the Brand Elevation Method we built over nearly two decades with real clients. The Method, and the judgment about what matters and in what order, came from us. AI is what lets you have that read in two minutes instead of two weeks." />
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

            <p style={{ fontFamily: SANS, fontSize: BODY, lineHeight: 1.45, color: "rgba(255,255,255,0.82)", maxWidth: 600, margin: 0 }}>
              You could be looking at the specific reasons your brand isn&apos;t
              landing the way you do in person, and the first step to take.
            </p>

            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, lineHeight: 1.6, color: LIME, maxWidth: 600, margin: 0 }}>
              Because clarity looks good on you.
            </p>

            <AccentBtn onClick={handleCTA} disabled={isLoading}>
              {isLoading ? "Loading…" : <>Get My Free Brand Elevation Profile&nbsp;→</>}
            </AccentBtn>

            <Badges />
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
          <div className="foot-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 48, flexWrap: "wrap" }}>
            <Image
              src="/images/logos/LRL_Logo_2025_White.svg"
              alt="Left Right Labs"
              width={168}
              height={55}
              style={{ height: 55, width: "auto" }}
            />
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: "#fff", margin: 0 }}>
              Build the Brand You&apos;re{" "}
              <em style={{ color: LIME }}>Meant</em>{" "}
              to Lead.<sup style={{ fontSize: 9 }}>™</sup>
            </p>
          </div>
          <div
            className="foot-row"
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
            <span>Brand Elevation · Dallas, TX</span>
          </div>
        </div>
      </footer>

      {/* ─── Global heading override + responsive ─── */}
      <style>{`
        /* globals.css still applies the retired vertical stretch to h1/h2
           site-wide. Scaley applies the canon squeeze per element here, so
           cancel the global rule or the two would stack. */
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
          align-items: start;
        }
        /* Stacks at 1240 rather than 960: below that the left column is too
           narrow to keep the three hero badges on a single line. */
        @media (max-width: 1240px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-mockup { max-width: 620px; }
        }

        /* Typography polish … avoid orphans everywhere, balance the short
           centered lines that were ragging badly. */
        .baa-page p { text-wrap: pretty; }
        .baa-page .bal { text-wrap: balance !important; }
        /* Centred copy wants balance, not pretty: pretty only guards the last
           line, which leaves a centred block ragging badly above it. Tagging
           the container means anything centred inside it balances by default. */
        .baa-page .ctr :is(p, h1, h2, h3, h4, h5, h6, li, span) {
          text-wrap: balance;
        }
        /* Footer lines wrap on phones ("...Ourselves? Not so / much."), and
           pretty only guards the last line. */
        .baa-page .foot-row > * { text-wrap: balance; }

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
          /* Footer rows are space-between flex rows. On a phone they wrap into
             one item per line, and space-between with a single item hugs the
             left edge, so stack them as centred columns instead. */
          .foot-row {
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            gap: 22px !important;
          }
          .foot-row > * { text-align: center !important; }
          .steps3 { grid-template-columns: 1fr !important; gap: 36px; }
          .steps3 > div { padding-right: 0 !important; }
          .step-line { display: none !important; }
        }

        @media (max-width: 880px) {
          .cards3 {
            grid-template-columns: 1fr !important;
          }
          .cards3 > div {
            border-left: none !important;
            border-top: 1px solid rgba(17,34,72,0.12) !important;
            /* The 40px column gutters made sense between three columns; stacked
               on a 375px screen they left 255px for the text. */
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-top: 32px !important;
            padding-bottom: 36px !important;
          }
          .hdr-cta {
            font-size: 14px !important;
            padding: 12px 18px !important;
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
