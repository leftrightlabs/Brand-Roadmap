"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  AREA_LABELS,
  STATUS_STYLE,
  VENN_SEGMENTS,
  type AreaKey,
  type AreaStatus,
} from "@/lib/roadmap-types";

const CX = 340;
const CY = 330;
const R_INNER = 250;
const R_OUTER = 302;
const R_LABEL = 276;
const GAP = 2.2;
const POP = 13; // how far a segment slides outward on hover

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [
    Math.round((CX + r * Math.cos(a)) * 100) / 100,
    Math.round((CY + r * Math.sin(a)) * 100) / 100,
  ];
}

function outwardVec(deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [Math.round(Math.cos(a) * POP * 100) / 100, Math.round(Math.sin(a) * POP * 100) / 100];
}

function segmentPath(a0: number, a1: number): string {
  const oS = polar(R_OUTER, a0);
  const oE = polar(R_OUTER, a1);
  const iE = polar(R_INNER, a1);
  const iS = polar(R_INNER, a0);
  return `M ${oS[0]} ${oS[1]} A ${R_OUTER} ${R_OUTER} 0 0 1 ${oE[0]} ${oE[1]} L ${iE[0]} ${iE[1]} A ${R_INNER} ${R_INNER} 0 0 0 ${iS[0]} ${iS[1]} Z`;
}

function labelPath(a0: number, a1: number, bottom: boolean): string {
  if (!bottom) {
    const s = polar(R_LABEL, a0 + 0.5);
    const e = polar(R_LABEL, a1 - 0.5);
    return `M ${s[0]} ${s[1]} A ${R_LABEL} ${R_LABEL} 0 0 1 ${e[0]} ${e[1]}`;
  }
  const s = polar(R_LABEL, a1 - 0.5);
  const e = polar(R_LABEL, a0 + 0.5);
  return `M ${s[0]} ${s[1]} A ${R_LABEL} ${R_LABEL} 0 0 0 ${e[0]} ${e[1]}`;
}

const segVariants: Variants = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { delay: 0.25 + i * 0.07, duration: 0.45, ease: "easeOut" } }),
};

const coreVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { delay: 0.9, duration: 0.6, ease: "easeOut" } },
};

interface BrandVennProps {
  statuses: Partial<Record<AreaKey, AreaStatus>>;
  onSegmentClick?: (area: AreaKey) => void;
  className?: string;
}

export function BrandVenn({ statuses, onSegmentClick, className }: BrandVennProps) {
  const [hover, setHover] = useState<AreaKey | null>(null);
  const clickable = !!onSegmentClick;

  return (
    <div className={className}>
      <div style={{ background: "#112248", border: "1px solid rgba(167,193,64,0.30)", borderRadius: 20, padding: "22px 18px" }}>
        <svg viewBox="0 0 680 660" width="100%" role="img" aria-label="Your brand mapped onto the Get Clear, Get Noticed, Get Paid framework, with nine areas color-coded by status. Hover a segment to focus it.">
          <defs>
            <filter id="vennPop" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* guide rings */}
          <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

          {/* status segments — fan in on load, pop out on hover */}
          {VENN_SEGMENTS.map(({ area, angle }, i) => {
            const status = statuses[area] ?? "Refine";
            const style = STATUS_STYLE[status];
            const a0 = angle - 20 + GAP / 2;
            const a1 = angle + 20 - GAP / 2;
            const bottom = angle > 90 && angle < 270;
            const id = `venn-lp-${area}`;
            const isHover = hover === area;
            const [dx, dy] = outwardVec(angle);
            return (
              <motion.g
                key={area}
                custom={i}
                variants={segVariants}
                initial="hidden"
                animate="show"
                whileHover={{ x: dx, y: dy }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                onMouseEnter={() => setHover(area)}
                onMouseLeave={() => setHover((h) => (h === area ? null : h))}
                onClick={clickable ? () => onSegmentClick!(area) : undefined}
                filter={isHover ? "url(#vennPop)" : undefined}
                style={{ cursor: clickable ? "pointer" : "default" }}
              >
                <path
                  d={segmentPath(a0, a1)}
                  fill={style.color}
                  fillOpacity={isHover ? Math.min(0.62, style.fillOpacity + 0.3) : style.fillOpacity}
                  stroke={style.color}
                  strokeOpacity={isHover ? 1 : 0.9}
                  strokeWidth={isHover ? 3 : 2}
                  style={{ transition: "fill-opacity 220ms ease, stroke-width 220ms ease" }}
                />
                <path id={id} d={labelPath(a0, a1, bottom)} fill="none" />
                <text fill="#ffffff" fontSize="10" letterSpacing="0.4" fontFamily="'sweet-sans-pro', Arial, sans-serif">
                  <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                    {AREA_LABELS[area].toUpperCase()}
                  </textPath>
                </text>
              </motion.g>
            );
          })}

          {/* pillar circles + legacy + names fade in after the segments */}
          <motion.g variants={coreVariants} initial="hidden" animate="show">
            <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6">
              <circle cx="340" cy="240" r="150" />
              <circle cx="262" cy="378" r="150" />
              <circle cx="418" cy="378" r="150" />
            </g>

            <ellipse cx="340" cy="320" rx="44" ry="52" fill="#A7C140" />
            <text x="340" y="327" textAnchor="middle" fontFamily="'scotch-display', serif" fontStyle="italic" fontSize="22" fill="#112248">Legacy</text>

            <text x="340" y="185" textAnchor="middle" fill="#fff" fontFamily="'sweet-sans-pro', Arial, sans-serif" fontSize="14">Get</text>
            <text x="340" y="214" textAnchor="middle" fill="#fff" fontFamily="'scotch-display', serif" fontStyle="italic" fontSize="27">Clear™</text>
            <text x="250" y="394" textAnchor="middle" fill="#fff" fontFamily="'sweet-sans-pro', Arial, sans-serif" fontSize="14">Get</text>
            <text x="250" y="423" textAnchor="middle" fill="#fff" fontFamily="'scotch-display', serif" fontStyle="italic" fontSize="27">Paid</text>
            <text x="430" y="394" textAnchor="middle" fill="#fff" fontFamily="'sweet-sans-pro', Arial, sans-serif" fontSize="14">Get</text>
            <text x="430" y="423" textAnchor="middle" fill="#fff" fontFamily="'scotch-display', serif" fontStyle="italic" fontSize="27">Noticed</text>
          </motion.g>
        </svg>

        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center", marginTop: 16, fontSize: 12.5, color: "rgba(255,255,255,0.7)", letterSpacing: "0.02em" }}>
          {(["Strong", "Refine", "Prioritize"] as AreaStatus[]).map((s) => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: STATUS_STYLE[s].color }} />
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
