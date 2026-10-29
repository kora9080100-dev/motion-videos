import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, clamp, easeOut, fontFamily } from "./theme";

/** الخلفية: كحلي مع توهج أزرق يتحرك ببطء ونقاط خفيفة */
export const Background: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 60;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          left: -160 + drift,
          top: 180,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(29,78,216,${0.55 * glow}) 0%, rgba(29,78,216,0) 65%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          right: -300 - drift,
          bottom: -200,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(96,165,250,${0.22 * glow}) 0%, rgba(96,165,250,0) 70%)`,
          filter: "blur(30px)",
        }}
      />
      {Array.from({ length: 26 }).map((_, i) => {
        const x = (i * 397) % 1080;
        const y = ((i * 613) % 1920) - ((frame * (0.4 + (i % 5) * 0.15)) % 1920);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: (y + 1920) % 1920,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: "50%",
              background: i % 7 === 0 ? C.saffron : C.blue,
              opacity: 0.18 + (i % 4) * 0.06,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** نص حركي: كلمة كلمة تطلع من ضبابية (الكلمات المميزة بلون مختلف) */
export const Words: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  size: number;
  weight?: number;
  color?: string;
  highlight?: string[];
  highlightColor?: string;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = 5, size, weight = 900, color = C.ink, highlight = [], highlightColor = C.blue, style }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.28,
        direction: "rtl",
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.25,
        color,
        textAlign: "center",
        ...style,
      }}
    >
      {text.split(" ").map((w, i) => {
        const start = delay + i * stagger;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: highlight.includes(w) ? highlightColor : undefined,
              opacity: interpolate(frame, [start, start + 10], [0, 1], { ...clamp, easing: easeOut }),
              translate: `0px ${interpolate(frame, [start, start + 14], [size * 0.45, 0], { ...clamp, easing: easeOut })}px`,
              filter: `blur(${interpolate(frame, [start, start + 12], [16, 0], { ...clamp, easing: easeOut })}px)`,
              scale: interpolate(frame, [start, start + 14], [0.86, 1], { ...clamp, easing: easeOut }),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** كرت زجاجي مثل كروت الموقع */
export const Glass: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: C.card,
      border: `2px solid ${C.line}`,
      borderRadius: 40,
      boxShadow: "0 30px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
      backdropFilter: "blur(18px)",
      fontFamily,
      color: C.ink,
      direction: "rtl",
      ...style,
    }}
  >
    {children}
  </div>
);

/** شارة صغيرة (نوع الفكرة، الوقت، الهاشتاق) */
export const Chip: React.FC<{ color?: string; children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  color = C.blue,
  children,
  size = 34,
  style,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: `${size * 0.3}px ${size * 0.7}px`,
      borderRadius: 999,
      fontSize: size,
      fontWeight: 700,
      fontFamily,
      color,
      background: `${color}22`,
      border: `2px solid ${color}44`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

/** شعار Luzo: إشارة (نقطة برتقالية + قوسين أزرق) + الاسم */
export const LuzoMark: React.FC<{ size?: number; pulse?: number }> = ({ size = 200, pulse = 0 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.16, direction: "ltr" }}>
    <span style={{ fontFamily, fontWeight: 900, fontSize: size, color: C.ink, letterSpacing: -size * 0.03, lineHeight: 1 }}>luzo</span>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100">
      <circle cx="26" cy="74" r={12 + pulse * 3} fill={C.saffron} />
      <path d="M26 44 A30 30 0 0 1 56 74" stroke={C.blue} strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M26 16 A58 58 0 0 1 84 74" stroke={C.blue} strokeWidth="11" fill="none" strokeLinecap="round" opacity="0.75" />
    </svg>
  </div>
);

/** مؤشر الماوس/الإصبع: يتحرك من نقطة لنقطة ويضغط */
export const Cursor: React.FC<{ from: [number, number]; to: [number, number]; start: number; arrive: number; press: number }> = ({
  from,
  to,
  start,
  arrive,
  press,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [start, arrive], [0, 1], { ...clamp, easing: easeOut });
  const pressScale = interpolate(frame, [press, press + 4, press + 9], [1, 0.82, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: from[0] + (to[0] - from[0]) * t,
        top: from[1] + (to[1] - from[1]) * t,
        opacity: interpolate(frame, [start, start + 6], [0, 1], clamp),
        scale: pressScale,
        filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.5))",
        zIndex: 20,
      }}
    >
      <svg width="86" height="86" viewBox="0 0 24 24">
        <path d="M5 2.5 L5 19.5 L9.6 15.3 L12.6 21.8 L15.4 20.5 L12.5 14.1 L18.8 14.1 Z" fill="#fff" stroke="#0b1220" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** دائرة تنتشر مكان الضغطة */
export const Ripple: React.FC<{ at: number; x: number; y: number; color?: string }> = ({ at, x, y, color = C.blue }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div
      style={{
        position: "absolute",
        left: x - 90,
        top: y - 90,
        width: 180,
        height: 180,
        borderRadius: "50%",
        border: `6px solid ${color}`,
        opacity: frame < at ? 0 : 1 - p,
        scale: 0.3 + p,
        zIndex: 19,
      }}
    />
  );
};

/** ظهور بنطة (pop) */
export const usePop = (at: number, damping = 12) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 180, mass: 0.7 } });
};

// أيقونات بسيطة بخط واحد
export const Icon: React.FC<{ name: "x" | "check" | "bulb" | "trend" | "play" | "chat" | "clock" | "camera"; size?: number; color?: string }> = ({
  name,
  size = 64,
  color = C.ink,
}) => {
  const p = { stroke: color, strokeWidth: 2.2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === "x" && (
        <>
          <circle cx="12" cy="12" r="10" fill={color} stroke="none" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}
      {name === "check" && (
        <>
          <circle cx="12" cy="12" r="10" fill={color} stroke="none" />
          <path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "bulb" && (
        <>
          <path {...p} d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
        </>
      )}
      {name === "trend" && <path {...p} d="M3 17l6-6 4 4 8-8M15 7h6v6" />}
      {name === "play" && (
        <>
          <rect {...p} x="3" y="4" width="18" height="16" rx="4" />
          <path d="M10 9l5 3-5 3z" fill={color} />
        </>
      )}
      {name === "chat" && <path {...p} d="M4 5h16v11H9l-5 4z" />}
      {name === "clock" && (
        <>
          <circle {...p} cx="12" cy="12" r="9" />
          <path {...p} d="M12 7v5l3 2" />
        </>
      )}
      {name === "camera" && (
        <>
          <rect {...p} x="3" y="3" width="18" height="18" rx="5" />
          <circle {...p} cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.2" fill={color} />
        </>
      )}
    </svg>
  );
};
