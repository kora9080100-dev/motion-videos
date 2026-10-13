import React from "react";
import { Img, staticFile } from "remotion";
import { FONT } from "./fonts";
import { C, COFFEE_GRADIENT, SHADOW, SHADOW_SOFT } from "./theme";

// ---------- layout helpers ----------

// Zero-size anchor: children are positioned relative to (x, y).
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

// Box of size w×h centered on its anchor.
export const Box: React.FC<{
  w: number;
  h: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ w, h, style, children }) => (
  <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, ...style }}>
    {children}
  </div>
);

export const Pic: React.FC<{ name: string; size: number; style?: React.CSSProperties }> = ({
  name,
  size,
  style,
}) => (
  <Img
    src={staticFile(`img/${name}`)}
    style={{ width: size, height: size, display: "block", objectFit: "contain", ...style }}
  />
);

// ---------- directional motion blur ----------

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

// ---------- text ----------

export const text = (
  size: number,
  weight = 700,
  color: string = C.ink,
): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.25,
  whiteSpace: "nowrap",
});

// ---------- cursor ----------

// Classic pointing-hand cursor. Hotspot (index fingertip) sits on the anchor.
export const Hand: React.FC<{ press?: number; size?: number }> = ({ press = 0, size = 120 }) => {
  const k = size / 34;
  return (
    <div
      style={{
        position: "absolute",
        left: -13 * k,
        top: -1.5 * k,
        width: 32 * k,
        height: 34 * k,
        transform: `scale(${1 - 0.14 * press}) rotate(${-6 * press}deg)`,
        transformOrigin: `${13 * k}px ${1.5 * k}px`,
        filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))",
      }}
    >
      <svg viewBox="0 0 32 34" width={32 * k} height={34 * k}>
        <path
          d="M10 4.5 A3 3 0 0 1 16 4.5 L16 13 A2.5 2.5 0 0 1 21 13 L21 14 A2.5 2.5 0 0 1 26 14 L26 15.5 A2 2 0 0 1 30 15.5 L30 23.5 C30 28 26.5 31.5 22 31.5 L16 31.5 C13.6 31.5 11.4 30.4 9.9 28.6 L3.6 21 C2.7 19.8 2.8 18.1 3.9 17.1 C5.1 16 6.9 16.1 8 17.2 L10 19.2 Z"
          fill="#fff"
          stroke="#111"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path d="M16 13 V19 M21 14 V19 M26 15.5 V19.5" stroke="#111" strokeWidth={1.3} strokeLinecap="round" />
      </svg>
    </div>
  );
};

// Expanding click ring.
export const Ripple: React.FC<{ t: number; r?: number; color?: string }> = ({ t, r = 80, color = C.coffee }) =>
  t <= 0 || t >= 1 ? null : (
    <div
      style={{
        position: "absolute",
        left: -r * t,
        top: -r * t,
        width: 2 * r * t,
        height: 2 * r * t,
        borderRadius: "50%",
        background: color,
        opacity: 0.45 * (1 - t),
      }}
    />
  );

// ---------- brand ----------

export const Wordmark: React.FC<{ size: number; color?: string; swoosh?: string }> = ({
  size,
  color = C.white,
  swoosh = C.caramel,
}) => (
  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ ...text(size, 900, color), lineHeight: 1 }}>رشفة</div>
    <svg width={size * 1.5} height={size * 0.42} viewBox="0 0 150 42" style={{ marginTop: -size * 0.02 }}>
      <path d="M12 10 Q75 46 138 10" fill="none" stroke={swoosh} strokeWidth={9} strokeLinecap="round" />
      <path d="M122 4 L139 9 L132 25" fill="none" stroke={swoosh} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const AppIcon: React.FC<{ size: number }> = ({ size }) => (
  <Box
    w={size}
    h={size}
    style={{
      borderRadius: size * 0.24,
      background: COFFEE_GRADIENT,
      boxShadow: SHADOW,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%)",
      }}
    />
    <Wordmark size={size * 0.3} />
  </Box>
);

// ---------- UI icons ----------

export const SearchIcon: React.FC<{ size: number; color?: string }> = ({ size, color = C.coffee }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke={color} strokeWidth={2.4} />
    <path d="M15.5 15.5 L20.5 20.5" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </svg>
);

export const FilterIcon: React.FC<{ size: number; color?: string }> = ({ size, color = C.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round">
    <path d="M3 7 H21 M3 17 H21" />
    <circle cx={8} cy={7} r={2.6} fill="#fff" />
    <circle cx={16} cy={17} r={2.6} fill="#fff" />
  </svg>
);

// I-beam text caret.
export const Caret: React.FC<{ h: number; color?: string }> = ({ h, color = C.ink }) => (
  <svg width={h * 0.32} height={h} viewBox="0 0 10 32">
    <path d="M2 1.5 H8 M5 1.5 V30.5 M2 30.5 H8" stroke={color} strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </svg>
);

// Circle + tick drawn progressively (t1 circle, t2 tick, both 0..1).
export const Check: React.FC<{ size: number; t1: number; t2: number; color?: string }> = ({
  size,
  t1,
  t2,
  color = C.white,
}) => {
  const circ = 2 * Math.PI * 44;
  const tick = 62;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle
        cx={50}
        cy={50}
        r={44}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - t1)}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <path
        d="M30 51 L44 65 L71 37"
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={tick}
        strokeDashoffset={tick * (1 - t2)}
      />
    </svg>
  );
};

// ---------- cards ----------

export const CARD_W = 540;
export const CARD_H = 600;

export type Product = { name: string; price: string; img: string };

// Product card in its native size (540×600); scale it from outside.
export const ProductCard: React.FC<{
  p: Product;
  button?: number; // 0..1 pop of the "اطلب الحين" button
  press?: number;
  contentOpacity?: number;
}> = ({ p, button = 0, press = 0, contentOpacity = 1 }) => (
  <Box
    w={CARD_W}
    h={CARD_H}
    style={{ borderRadius: 44, background: C.card, boxShadow: SHADOW, overflow: "hidden" }}
  >
    <div style={{ opacity: contentOpacity }}>
      <div
        style={{
          position: "absolute",
          left: 30,
          top: 30,
          width: CARD_W - 60,
          height: 370,
          borderRadius: 32,
          background: `radial-gradient(80% 80% at 50% 45%, #FFFFFF 0%, ${C.cream} 70%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pic name={p.img} size={320} style={{ filter: "drop-shadow(0 18px 18px rgba(60,38,26,0.22))" }} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 420,
          direction: "rtl",
          textAlign: "right",
        }}
      >
        <div style={text(50, 700, C.ink)}>{p.name}</div>
        <div style={{ ...text(44, 800, C.coffee), marginTop: 2 }}>{p.price}</div>
      </div>
      {button > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 36,
            bottom: 44,
            width: 230,
            height: 76,
            borderRadius: 38,
            background: COFFEE_GRADIENT,
            boxShadow: SHADOW_SOFT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${button * (1 - 0.1 * press)})`,
            ...text(34, 800, C.white),
            direction: "rtl",
          }}
        >
          اطلب الحين
        </div>
      ) : null}
    </div>
  </Box>
);

export type BannerLine = { t: string; size: number; weight: number };

export const Banner: React.FC<{
  bg: string;
  lines: BannerLine[];
  img: string;
  ink?: string;
  w: number;
  h: number;
}> = ({ bg, lines, img, ink = C.white, w, h }) => (
  <Box w={w} h={h} style={{ borderRadius: 28, background: bg, boxShadow: SHADOW_SOFT, overflow: "hidden" }}>
    <div style={{ position: "absolute", right: 22, top: 18, direction: "rtl", textAlign: "right" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ ...text(l.size, l.weight, ink), lineHeight: 1.15 }}>
          {l.t}
        </div>
      ))}
    </div>
    <Pic
      name={img}
      size={104}
      style={{ position: "absolute", left: 12, bottom: 6, filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.18))" }}
    />
  </Box>
);
