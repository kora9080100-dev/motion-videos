import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { outExpo, prog } from "./anim";
import { FONT } from "./fonts";
import {
  BRAND_GRADIENT,
  C,
  H,
  INK_GRADIENT,
  SHADOW,
  W,
} from "./theme";

// ---------- Background: light gray, dot grid, slow dashed arcs ----------

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <pattern
            id="dots"
            width={36}
            height={36}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${(t * 6) % 36} ${(t * 10) % 36})`}
          >
            <circle cx={18} cy={18} r={2.4} fill={C.dot} />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="48%" r="62%">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="70%" stopColor="#fff" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="dotMask">
            <rect x={70} y={110} width={W - 140} height={H - 220} fill="url(#fade)" />
          </mask>
        </defs>
        <rect width={W} height={H} fill="url(#dots)" mask="url(#dotMask)" />
        <g>
          <DashedArc cx={1180} cy={-80} r={760} start={150 + t * 9} sweep={70} />
          <DashedArc cx={-140} cy={2050} r={820} start={-60 + t * 7} sweep={65} />
          <DashedArc cx={1250} cy={1500} r={520} start={160 - t * 8} sweep={55} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// An arc drawn as a dashed path between two angles.
const DashedArc: React.FC<{
  cx: number;
  cy: number;
  r: number;
  start: number;
  sweep: number;
}> = ({ cx, cy, r, start, sweep }) => {
  const a0 = (start * Math.PI) / 180;
  const a1 = ((start + sweep) * Math.PI) / 180;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return (
    <path
      d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`}
      fill="none"
      stroke={C.dash}
      strokeWidth={5}
      strokeLinecap="round"
      strokeDasharray="20 20"
    />
  );
};

// ---------- Directional motion blur (SVG filter on HTML) ----------

let blurId = 0;
export const MBlur: React.FC<{
  x?: number;
  y?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x = 0, y = 0, style, children }) => {
  const id = React.useMemo(() => `mb${blurId++}`, []);
  const on = x > 0.3 || y > 0.3;
  return (
    <div style={{ position: "absolute", inset: 0, ...style, filter: on ? `url(#${id})` : undefined }}>
      {on ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={`${x} ${y}`} />
          </filter>
        </svg>
      ) : null}
      {children}
    </div>
  );
};

// ---------- Kinetic words ----------

export type Tone = "ink" | "white" | "ember";

const toneStyle = (tone: Tone): React.CSSProperties => {
  if (tone === "white") return { color: C.white };
  if (tone === "ember") return { color: C.ember };
  return {
    backgroundImage: INK_GRADIENT,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
};

// One word that arrives with blur + rise (the reference's signature move).
export const Word: React.FC<{
  text: string;
  at: number;
  size: number;
  weight?: number;
  tone?: Tone;
  dur?: number;
  fromX?: number;
  style?: React.CSSProperties;
}> = ({ text, at, size, weight = 900, tone = "ink", dur = 10, fromX = 0, style }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur, outExpo);
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.15,
        whiteSpace: "nowrap",
        opacity: Math.min(1, p * 1.6),
        filter: `blur(${(1 - p) * 16}px)`,
        transform: `translate(${(1 - p) * fromX}px, ${(1 - p) * size * 0.28}px) scale(${1.12 - 0.12 * p})`,
        // Room for dots below ي etc. — gradient text only paints inside the box.
        padding: "0.2em 0.08em",
        margin: "-0.2em -0.08em",
        ...toneStyle(tone),
        ...style,
      }}
    >
      {text}
    </span>
  );
};

// A row of words revealed one after another, right-to-left.
export const Words: React.FC<{
  words: string[];
  at: number;
  stagger?: number;
  size: number;
  weight?: number;
  tone?: Tone;
  gap?: number;
  fromX?: number;
}> = ({ words, at, stagger = 5, size, weight, tone, gap = 0.22, fromX }) => (
  <div
    style={{
      display: "flex",
      direction: "rtl",
      justifyContent: "center",
      alignItems: "baseline",
      gap: size * gap,
    }}
  >
    {words.map((w, i) => (
      <Word
        key={i}
        text={w}
        at={at + i * stagger}
        size={size}
        weight={weight}
        tone={tone}
        fromX={fromX}
      />
    ))}
  </div>
);

// ---------- Glossy surfaces (cards & pills) ----------

// Diagonal light streak that sweeps across a surface; t in 0..1.
export const Sheen: React.FC<{ t: number; strength?: number }> = ({ t, strength = 0.22 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      overflow: "hidden",
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: "-50%",
        bottom: "-50%",
        width: "45%",
        left: `${-60 + t * 180}%`,
        transform: "rotate(18deg)",
        background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${strength}) 50%, rgba(255,255,255,0) 100%)`,
      }}
    />
  </div>
);

export const Surface: React.FC<{
  w: number;
  h: number;
  r: number;
  sheen?: number;
  gradient?: string;
  shadow?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ w, h, r, sheen = 0.35, gradient = BRAND_GRADIENT, shadow = SHADOW, children, style }) => (
  <div
    style={{
      position: "absolute",
      width: w,
      height: h,
      left: -w / 2,
      top: -h / 2,
      borderRadius: r,
      background: gradient,
      boxShadow: `${shadow}, inset 0 2px 0 rgba(255,255,255,0.16), inset 0 0 0 1.5px rgba(255,255,255,0.06)`,
      overflow: "hidden",
      ...style,
    }}
  >
    {/* soft top-left glow, like the reference's lit corner */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(120% 90% at 10% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%)",
      }}
    />
    <Sheen t={sheen} />
    {children}
  </div>
);

// Positions children so that (x, y) is their center.
export const At: React.FC<{
  x: number;
  y: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x, y, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, ...style }}>
    {children}
  </div>
);

// Centered text block helper (absolute, centered on its anchor).
export const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      transform: "translate(-50%, -50%)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pic: React.FC<{
  name: string;
  size: number;
  style?: React.CSSProperties;
}> = ({ name, size, style }) => (
  <Img
    src={staticFile(`img/${name}`)}
    style={{ width: size, height: size, display: "block", ...style }}
  />
);
