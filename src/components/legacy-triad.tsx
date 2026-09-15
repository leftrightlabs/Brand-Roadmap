"use client";

/**
 * The Brand Elevation triad: Ascend, Align, Activate around a central Legacy.
 *
 * Inline SVG rather than an image file so it picks up the site's own webfonts
 * (an <img src="*.svg"> renders in isolation and would fall back to system
 * faces), scales without a raster asset, and recolours per surface.
 *
 * The shape is a Reuleaux triangle: three arcs, each centred on the opposite
 * vertex with a radius equal to the side, which is why its width and height
 * are identical.
 */

const SANS = "'sweet-sans-pro', Montserrat, Arial, sans-serif";
const SERIF = "scotch-display, 'Playfair Display', Georgia, serif";

const W = 300;                     // constant width of the shape
const R = W / Math.sqrt(3);        // circumradius
const CX = 400;
const TOP = 60;
const CY = TOP + R;

const T: [number, number] = [CX, TOP];
const L: [number, number] = [CX - W / 2, CY + R / 2];
const RT: [number, number] = [CX + W / 2, CY + R / 2];

const f = (n: number) => Math.round(n * 100) / 100;
const path = [
  `M ${f(T[0])} ${f(T[1])}`,
  `A ${W} ${W} 0 0 1 ${f(RT[0])} ${f(RT[1])}`,
  `A ${W} ${W} 0 0 1 ${f(L[0])} ${f(L[1])}`,
  `A ${W} ${W} 0 0 1 ${f(T[0])} ${f(T[1])}`,
  "Z",
].join(" ");

export function LegacyTriad({
  label = "#112248",
  fill = "#a7c140",
  legacy = "#ffffff",
  maxWidth = 560,
  className,
}: {
  /** Colour of the three outer words. */
  label?: string;
  /** Colour of the triangle. */
  fill?: string;
  /** Colour of the word inside the triangle. */
  legacy?: string;
  maxWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 800 470"
      role="img"
      aria-label="The Brand Elevation framework: Ascend, Align and Activate around a central Legacy."
      className={className}
      style={{ width: "100%", maxWidth, height: "auto", display: "block" }}
    >
      <path d={path} fill={fill} />

      <text
        x={CX}
        y={CY + 19}
        textAnchor="middle"
        fill={legacy}
        style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 58 }}
      >
        Legacy
      </text>

      {[
        { t: "ASCEND", x: CX - W / 2 - 40, y: CY - 30, anchor: "end" as const },
        { t: "ALIGN", x: CX + W / 2 + 40, y: CY - 30, anchor: "start" as const },
        { t: "ACTIVATE", x: CX, y: TOP + W + 82, anchor: "middle" as const },
      ].map((n) => (
        <text
          key={n.t}
          x={n.x}
          y={n.y}
          textAnchor={n.anchor}
          fill={label}
          style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: "0.08em" }}
        >
          {n.t}
        </text>
      ))}
    </svg>
  );
}
