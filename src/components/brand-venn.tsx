"use client";

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

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [
    Math.round((CX + r * Math.cos(a)) * 100) / 100,
    Math.round((CY + r * Math.sin(a)) * 100) / 100,
  ];
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
    const s = polar(R_LABEL, a0 + 1.5);
    const e = polar(R_LABEL, a1 - 1.5);
    return `M ${s[0]} ${s[1]} A ${R_LABEL} ${R_LABEL} 0 0 1 ${e[0]} ${e[1]}`;
  }
  const s = polar(R_LABEL, a1 - 1.5);
  const e = polar(R_LABEL, a0 + 1.5);
  return `M ${s[0]} ${s[1]} A ${R_LABEL} ${R_LABEL} 0 0 0 ${e[0]} ${e[1]}`;
}

interface BrandVennProps {
  statuses: Partial<Record<AreaKey, AreaStatus>>;
  onSegmentClick?: (area: AreaKey) => void;
  className?: string;
}

export function BrandVenn({ statuses, onSegmentClick, className }: BrandVennProps) {
  return (
    <div className={className}>
      <div
        style={{
          background: "#0E1B3D",
          border: "1px solid rgba(167,193,64,0.28)",
          borderRadius: 16,
          padding: "18px 16px",
        }}
      >
        <svg viewBox="0 0 680 660" width="100%" role="img" aria-label="Your brand mapped onto the Get Clear, Get Noticed, Get Paid framework, with nine areas color-coded by status.">
          <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />

          {VENN_SEGMENTS.map(({ area, angle }) => {
            const status = statuses[area] ?? "Refine";
            const style = STATUS_STYLE[status];
            const a0 = angle - 20 + GAP / 2;
            const a1 = angle + 20 - GAP / 2;
            const bottom = angle > 90 && angle < 270;
            const id = `venn-lp-${area}`;
            const clickable = !!onSegmentClick;
            return (
              <g
                key={area}
                onClick={clickable ? () => onSegmentClick!(area) : undefined}
                style={clickable ? { cursor: "pointer" } : undefined}
              >
                <path
                  d={segmentPath(a0, a1)}
                  fill={style.color}
                  fillOpacity={style.fillOpacity}
                  stroke={style.color}
                  strokeOpacity={0.85}
                  strokeWidth={1}
                />
                <path id={id} d={labelPath(a0, a1, bottom)} fill="none" />
                <text fill="#ffffff" fontSize="11" letterSpacing="1.4" fontFamily="'sweet-sans-pro', sans-serif">
                  <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                    {AREA_LABELS[area].toUpperCase()}
                  </textPath>
                </text>
              </g>
            );
          })}

          <g fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2">
            <circle cx="340" cy="240" r="150" />
            <circle cx="262" cy="378" r="150" />
            <circle cx="418" cy="378" r="150" />
          </g>

          <ellipse cx="340" cy="320" rx="44" ry="52" fill="#A7C140" />
          <text x="340" y="327" textAnchor="middle" fontFamily="'scotch-display', serif" fontStyle="italic" fontSize="22" fill="#0E1B3D">Legacy</text>

          <text x="340" y="183" textAnchor="middle" fill="#fff" fontFamily="'sweet-sans-pro', sans-serif" fontSize="15">Get</text>
          <text x="340" y="214" textAnchor="middle" fill="#fff" fontFamily="'scotch-display', serif" fontStyle="italic" fontSize="30">Clear™</text>
          <text x="248" y="392" textAnchor="middle" fill="#fff" fontFamily="'sweet-sans-pro', sans-serif" fontSize="15">Get</text>
          <text x="248" y="423" textAnchor="middle" fill="#fff" fontFamily="'scotch-display', serif" fontStyle="italic" fontSize="30">Paid</text>
          <text x="432" y="392" textAnchor="middle" fill="#fff" fontFamily="'sweet-sans-pro', sans-serif" fontSize="15">Get</text>
          <text x="432" y="423" textAnchor="middle" fill="#fff" fontFamily="'scotch-display', serif" fontStyle="italic" fontSize="30">Noticed</text>

          <text x="276" y="305" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontFamily="'sweet-sans-pro', sans-serif" fontSize="12" letterSpacing="1.5">ASCEND</text>
          <text x="404" y="305" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontFamily="'sweet-sans-pro', sans-serif" fontSize="12" letterSpacing="1.5">ALIGN</text>
          <text x="340" y="410" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontFamily="'sweet-sans-pro', sans-serif" fontSize="12" letterSpacing="1.5">ACTIVATE</text>
        </svg>

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
          {(["Strong", "Refine", "Prioritize"] as AreaStatus[]).map((s) => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_STYLE[s].color }} />
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
