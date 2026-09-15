"use client";

import { useState } from "react";

const SANS = "'sweet-sans-pro', Montserrat, Arial, sans-serif";
const NAVY = "#112248";
const LIME = "#a7c140";

export interface Testimonial {
  /** Vimeo id only; the embed URL is built here. */
  vimeoId: string;
  poster: string;
  quote: string;
  name: string;
  title: string;
}

/**
 * Click-to-play video testimonial, matching leftrightlabs.com/testimonials.
 *
 * The poster is a local still rather than a live iframe: nine Vimeo embeds on
 * one page would each pull their own player bundle before anyone pressed play.
 * The iframe is only mounted once the reader actually asks for it, which is
 * also why it carries autoplay.
 */
export function VideoTestimonial({ t, dark = false }: { t: Testimonial; dark?: boolean }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 6,
          overflow: "hidden",
          background: "#0E1B3D",
          borderTop: `3px solid ${LIME}`,
        }}
      >
        {playing ? (
          <iframe
            src={`https://player.vimeo.com/video/${t.vimeoId}?autoplay=1&byline=0&title=0&portrait=0`}
            title={`${t.name} on working with Left Right Labs`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${t.name}'s testimonial`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              padding: 0,
              border: 0,
              cursor: "pointer",
              background: `url(${t.poster}) center/cover no-repeat`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 62,
                height: 62,
                borderRadius: "50%",
                background: "rgba(17,34,72,0.72)",
                border: "2px solid rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(2px)",
              }}
            >
              {/* Nudged right so the triangle looks optically centred. */}
              <span
                style={{
                  marginLeft: 5,
                  width: 0,
                  height: 0,
                  borderTop: "11px solid transparent",
                  borderBottom: "11px solid transparent",
                  borderLeft: "18px solid #fff",
                }}
              />
            </span>
          </button>
        )}
      </div>

      <blockquote
        style={{
          margin: 0,
          fontFamily: SANS,
          fontSize: "clamp(16px, 12.5px + 0.8vw, 19px)",
          lineHeight: 1.5,
          color: dark ? "rgba(255,255,255,0.86)" : "rgba(0,0,0,0.82)",
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </blockquote>

      <figcaption
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 15,
          lineHeight: 1.45,
          letterSpacing: "0.02em",
          color: dark ? "#fff" : NAVY,
        }}
      >
        {t.name}
        <span style={{ display: "block", fontWeight: 400, color: dark ? "rgba(255,255,255,0.66)" : "rgba(0,0,0,0.6)" }}>
          {t.title}
        </span>
      </figcaption>
    </figure>
  );
}
