import React from "react";
import { AbsoluteFill, Audio, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { inOut, inQuint, lerp, outExpo, pop, prog } from "./anim";
import {
  AppIcon,
  At,
  Banner,
  Box,
  CARD_H,
  CARD_W,
  Caret,
  Check,
  FilterIcon,
  Hand,
  MBlur,
  Pic,
  Product,
  ProductCard,
  Ripple,
  SearchIcon,
  Wordmark,
  text,
} from "./components";
import { C, CARAMEL_GRADIENT, COFFEE_GRADIENT, SHADOW } from "./theme";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// Keyframed value with eased segments.
const kf = (f: number, frames: number[], values: number[], easing = inOut) =>
  interpolate(f, frames, values, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// 0→1→0 pulse, used for presses.
const bump = (f: number, start: number, dur: number) => {
  const t = (f - start) / dur;
  return t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t);
};

// Camera: world point (fx, fy) lands at screen center, zoomed by s.
const Camera: React.FC<{ s: number; fx: number; fy: number; children: React.ReactNode }> = ({
  s,
  fx,
  fy,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: 1080,
      height: 1920,
      transformOrigin: "0 0",
      transform: `translate(540px, 960px) scale(${s}) translate(${-fx}px, ${-fy}px)`,
    }}
  >
    {children}
  </div>
);

// Hand that follows keyframes, with motion blur from its own speed.
const MovingHand: React.FC<{
  frames: number[];
  xs: number[];
  ys: number[];
  presses: number[];
  visibleFrom: number;
  bob?: [number, number];
}> = ({ frames, xs, ys, presses, visibleFrom, bob }) => {
  const f = useCurrentFrame();
  const pos = (t: number) => [kf(t, frames, xs), kf(t, frames, ys)];
  const [x, y0] = pos(f);
  const [px, py] = pos(f - 1);
  const idle = bob && f > bob[0] && f < bob[1] ? Math.sin((f - bob[0]) / 7) * 6 : 0;
  const press = Math.max(0, ...presses.map((p) => bump(f, p, 6)));
  if (f < visibleFrom) return null;
  return (
    <MBlur x={Math.min(24, Math.abs(x - px) * 0.35)} y={Math.min(24, Math.abs(y0 - py) * 0.35)}>
      <At x={x} y={y0 + idle} style={{ opacity: prog(f, visibleFrom, 4) }}>
        <Hand press={press} />
      </At>
    </MBlur>
  );
};

// Words that rise in one by one with a springy bounce.
const BounceWords: React.FC<{
  words: string[];
  at: number;
  stagger: number;
  size: number;
  weight: number;
  color: string;
  outAt?: number;
  wave?: boolean;
}> = ({ words, at, stagger, size, weight, color, outAt, wave }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", direction: "rtl", gap: size * 0.25, alignItems: "baseline" }}>
      {words.map((w, i) => {
        const p = pop(f, at + i * stagger, 11, 190);
        const o = outAt === undefined ? 0 : prog(f, outAt + i * 2, 9, inQuint);
        const wv = wave ? Math.sin((f + i * 7) / 5) * 5 : 0;
        return (
          <span
            key={i}
            style={{
              ...text(size, weight, color),
              display: "inline-block",
              opacity: Math.min(1, Math.max(0, p)) * (1 - o),
              transform: `translateY(${(1 - p) * size * 0.7 + wv + o * size * 1.2}px) rotate(${(1 - Math.min(1, p)) * -14 + o * (i % 2 ? 18 : -14)}deg)`,
              filter: o > 0 ? `blur(${o * 6}px)` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Letter-by-letter typing (Arabic letters re-join naturally as they're added).
const typed = (f: number, s: string, start: number, perChar: number) => {
  const chars = Array.from(s);
  const n = Math.max(0, Math.min(chars.length, Math.floor((f - start) / perChar) + 1));
  return f < start ? "" : chars.slice(0, n).join("");
};

// ---------------------------------------------------------------------------
// Scene A (0–130): app icon → search bar → typing → click search
// ---------------------------------------------------------------------------
const BAR_W = 880;
const BAR_H = 150;
const SEARCH_X = 540 + BAR_W / 2 - 40 - 31; // search icon center (world)

const SearchScene: React.FC = () => {
  const f = useCurrentFrame();
  const CF = [0, 40, 64, 96, 106, 116, 130];
  const s = kf(f, CF, [1.2, 1.2, 1.22, 1.26, 0.96, 0.96, 2.1]);
  const fx = kf(f, CF, [540, 540, 570, 600, 540, 540, 880]);
  const out = prog(f, 117, 9, inQuint);

  // icon → bar
  const appear = pop(f, 0, 12, 160);
  const click = bump(f, 22, 7);
  const m = prog(f, 28, 14, inOut);
  const w = lerp(300, BAR_W, m);
  const h = lerp(300, BAR_H, m);
  const r = lerp(72, 40, m);
  const float = Math.sin(f / 9) * 6 * (1 - m);
  const ui = prog(f, 40, 8);

  const query = typed(f, "قهوة مختصة قريبة", 68, 1.8);
  const typing = f >= 64 && f < 98;
  const caretOn = f >= 64 && (typing || Math.floor(f / 8) % 2 === 0);

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 18}px)` : undefined }}>
      <Camera s={s} fx={fx} fy={960}>
        <At x={540} y={960 + float}>
          <div style={{ transform: `scale(${appear * (1 - 0.08 * click)})` }}>
            <Box w={w} h={h} style={{ borderRadius: r, background: C.card, boxShadow: SHADOW, overflow: "hidden" }}>
              {/* brown face of the app icon fades into the white bar */}
              <div style={{ position: "absolute", inset: 0, background: COFFEE_GRADIENT, opacity: 1 - prog(f, 28, 7, inOut) }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(110deg, rgba(255,255,255,0) 30%, rgba(255,255,255,${0.9 * Math.sin(Math.PI * m)}) 50%, rgba(255,255,255,0) 70%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 1 - prog(f, 28, 8),
                  filter: `blur(${prog(f, 28, 8) * 10}px)`,
                }}
              >
                <Wordmark size={90} />
              </div>

              {/* search bar UI */}
              <div style={{ position: "absolute", inset: 0, opacity: ui }}>
                <div style={{ position: "absolute", right: 40, top: (BAR_H - 62) / 2 }}>
                  <SearchIcon size={62} />
                </div>
                <div style={{ position: "absolute", left: 36, top: (BAR_H - 58) / 2 }}>
                  <FilterIcon size={58} />
                </div>
                <div style={{ position: "absolute", left: 120, top: 38, width: 2.5, height: BAR_H - 76, background: C.line }} />
                <div
                  style={{
                    position: "absolute",
                    right: 128,
                    top: 0,
                    height: BAR_H,
                    display: "flex",
                    alignItems: "center",
                    direction: "rtl",
                  }}
                >
                  {f < 70 ? (
                    <BounceWords
                      words={["وش", "مزاجك", "اليوم؟"]}
                      at={44}
                      stagger={4}
                      size={50}
                      weight={600}
                      color={C.muted}
                      outAt={60}
                    />
                  ) : null}
                  {query ? <span style={text(52, 600, C.ink)}>{query}</span> : null}
                  {caretOn ? (
                    <span style={{ marginRight: 8, display: "inline-flex" }}>
                      <Caret h={62} />
                    </span>
                  ) : null}
                </div>
              </div>
            </Box>
          </div>
        </At>
        <At x={SEARCH_X} y={960}>
          <Ripple t={prog(f, 110, 14, (t) => t)} r={90} />
        </At>
        <MovingHand
          frames={[0, 8, 20, 28, 44, 96, 108, 130]}
          xs={[960, 960, 575, 575, 200, 200, SEARCH_X + 4, SEARCH_X + 4]}
          ys={[1700, 1700, 1000, 1000, 1110, 1110, 972, 972]}
          presses={[22, 110]}
          visibleFrom={8}
          bob={[44, 96]}
        />
      </Camera>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene B–C (120–300): carousel → shop overview → order click
// ---------------------------------------------------------------------------
const PRODUCTS: Product[] = [
  { name: "لاتيه", price: "16 ر.س", img: "latte@4x.png" },
  { name: "آيس لاتيه", price: "19 ر.س", img: "iced@4x.png" },
  { name: "كرواسون", price: "12 ر.س", img: "croissant@4x.png" },
];
const GRID_Y = 1000;
const GRID_S = 0.6;
const CAR_S = 1.2; // card scale while in the carousel
const CAM_S = 1.4; // camera zoom while ordering
const CAM_FY = 1060;
const LIFT = 14;
const gridX = (i: number) => 540 + (1 - i) * 340; // RTL: first item on the right
const HOVER = 254;
const CLICK = 274;
const HANDOFF = 280; // card turns into the tracking card

// Order button position (world) on the hovered middle card.
const BTN = {
  x: 540 + (-CARD_W / 2 + 36 + 115) * GRID_S * 1.08,
  y: GRID_Y - LIFT + (CARD_H / 2 - 44 - 38) * GRID_S * 1.08,
};

const Shop: React.FC = () => {
  const f = useCurrentFrame();
  const enter = prog(f, 123, 16, outExpo);
  const p = kf(f, [150, 162, 174, 186], [0, 1, 1, 2]);
  const g = prog(f, 192, 18, inOut);

  const cs = kf(f, [200, 250, 264, 300], [1, 1.03, CAM_S, CAM_S]);
  const cy = kf(f, [200, 250, 264, 300], [960, 960, CAM_FY, CAM_FY]);
  const out = prog(f, HANDOFF, 12, inOut);

  const hover = prog(f, HOVER, 8, outExpo);
  const button = pop(f, HOVER + 4, 11, 200);
  const press = bump(f, CLICK, 6);

  const cards = PRODUCTS.map((prod, i) => {
    const d = i - p;
    const ad = Math.min(Math.abs(d), 1);
    const car = {
      x: 540 - d * 720,
      y: 960,
      s: CAR_S * (1 - 0.3 * ad),
      rot: Math.max(-1, Math.min(1, d)) * 28,
      blur: 8 * ad,
      op: 1 - 0.3 * ad,
    };
    const lift = i === 1 ? hover : 0;
    return {
      i,
      prod,
      x: lerp(car.x, gridX(i), g),
      y: lerp(car.y, GRID_Y, g) - lift * LIFT,
      s: lerp(car.s, GRID_S, g) * (1 + 0.08 * lift),
      rot: lerp(car.rot, 0, g),
      blur: lerp(car.blur, 0, g),
      op: lerp(car.op, 1, g),
    };
  });
  // Draw side cards first, focused/hovered card last.
  const order = [...cards].sort((a, b) =>
    g < 0.5 ? Math.abs(b.i - p) - Math.abs(a.i - p) : (a.i === 1 ? 1 : 0) - (b.i === 1 ? 1 : 0),
  );

  const titleWords = ["كل", "اللي", "يعدّل", "مزاجك"];

  return (
    <AbsoluteFill
      style={{
        opacity: enter,
        filter: enter < 1 ? `blur(${(1 - enter) * 20}px)` : undefined,
        transform: `scale(${1.08 - 0.08 * enter})`,
      }}
    >
      <Camera s={cs} fx={540} fy={cy}>
        {/* everything except the ordered card fades away at the handoff */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - out, filter: out > 0 ? `blur(${out * 14}px)` : undefined }}>
          <At x={880} y={450} style={{ opacity: prog(f, 198, 10), filter: `blur(${(1 - prog(f, 198, 10)) * 10}px)` }}>
            <div style={{ position: "absolute", left: -110, top: -55, width: 220 }}>
              <Wordmark size={66} color={C.coffee} />
            </div>
          </At>
          <At x={540} y={630}>
            <div style={{ position: "absolute", left: -540, width: 1080, top: -60, display: "flex", justifyContent: "center", direction: "rtl", gap: 22 }}>
              {titleWords.map((w, i) => {
                const q = prog(f, 202 + i * 4, 13, outExpo);
                return (
                  <span
                    key={i}
                    style={{
                      ...text(86, 800, C.ink),
                      display: "inline-block",
                      opacity: q,
                      transform: `translate(${-170 * (1 - q)}px, ${-150 * (1 - q) * (1 - q)}px) rotate(${-28 * (1 - q)}deg)`,
                    }}
                  >
                    {w}
                  </span>
                );
              })}
            </div>
          </At>
          <At x={540} y={730} style={{ opacity: prog(f, 216, 10), filter: `blur(${(1 - prog(f, 216, 10)) * 8}px)` }}>
            <div style={{ position: "absolute", left: -540, width: 1080, top: -26, textAlign: "center", direction: "rtl", ...text(40, 600, C.muted) }}>
              اطلب قهوتك وتوصلك وين ما كنت
            </div>
          </At>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 1262,
              width: 960,
              height: 3,
              borderRadius: 2,
              background: C.line,
              transformOrigin: "right center",
              transform: `scaleX(${prog(f, 222, 14, inOut)})`,
            }}
          />
          {[
            { bg: CARAMEL_GRADIENT, lines: [{ t: "قهوة اليوم", size: 32, weight: 700 }, { t: "بـ 9 ر.س", size: 50, weight: 900 }], img: "latte_small.png", ink: C.white },
            { bg: COFFEE_GRADIENT, lines: [{ t: "توصيل", size: 32, weight: 700 }, { t: "مجاني", size: 50, weight: 900 }], img: "scooter_warm.png", ink: C.white },
            { bg: C.cream, lines: [{ t: "خصم 30%", size: 46, weight: 900 }, { t: "على الحلا", size: 32, weight: 700 }], img: "cake.png", ink: C.coffee },
          ].map((b, i) => {
            const sp = pop(f, 226 + i * 5, 13, 150);
            return (
              <At key={i} x={gridX(i)} y={1450 + (1 - sp) * 340} style={{ opacity: Math.min(1, sp * 1.5) }}>
                <Banner w={320} h={240} bg={b.bg} lines={b.lines} img={b.img} ink={b.ink} />
              </At>
            );
          })}
        </div>

        {/* product cards */}
        <div style={{ position: "absolute", inset: 0, perspective: 1800 }}>
          {order.map((c) =>
            c.i === 1 && f >= HANDOFF ? null : (
              <At
                key={c.i}
                x={c.x}
                y={c.y}
                style={{
                  transform: `rotateY(${c.rot}deg) scale(${c.s})`,
                  opacity: c.op * (c.i === 1 ? 1 : 1 - out),
                  filter: c.blur > 0.2 ? `blur(${c.blur}px)` : undefined,
                }}
              >
                <ProductCard p={c.prod} button={c.i === 1 ? button : 0} press={c.i === 1 ? press : 0} />
              </At>
            ),
          )}
        </div>

        <At x={BTN.x} y={BTN.y}>
          <Ripple t={prog(f, CLICK, 14, (t) => t)} r={80} />
        </At>
        <div style={{ opacity: 1 - out }}>
          <MovingHand
            frames={[236, 254, 262, 272, 300]}
            xs={[820, 575, 575, BTN.x + 6, BTN.x + 6]}
            ys={[2000, 1050, 1050, BTN.y + 4, BTN.y + 4]}
            presses={[CLICK]}
            visibleFrom={236}
          />
        </div>
      </Camera>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene D–E (280–410): card becomes the tracking card → delivered
// ---------------------------------------------------------------------------
const Tracking: React.FC = () => {
  const f = useCurrentFrame();
  // Starts exactly where the hovered card sits on screen at the handoff.
  const startS = GRID_S * 1.08 * CAM_S;
  const g = prog(f, HANDOFF, 16, inOut);
  const w = lerp(CARD_W * startS, 880, g);
  const h = lerp(CARD_H * startS, 520, g);
  const r = lerp(44 * startS, 50, g);
  const y = lerp((GRID_Y - LIFT - CAM_FY) * CAM_S + 960, 960, g);

  const ui = prog(f, 287, 8);
  const fill = prog(f, 298, 46, inOut);
  const barOut = prog(f, 344, 8);
  const done = prog(f, 348, 10, inOut);
  const popScale = 1 + 0.05 * bump(f, 348, 12);
  const shrink = 1 - 0.08 * prog(f, 384, 14, inOut);
  const out = prog(f, 398, 10, inQuint);

  const TRACK = 680;
  const lead = TRACK / 2 - fill * TRACK; // leading edge x (fills right→left)
  const moving = fill > 0 && fill < 1 ? 1 : 0;

  const msg = typed(f, "وصل طلبك", 368, 1.8);

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 14}px)` : undefined }}>
      <At x={540} y={y} style={{ transform: `scale(${popScale * shrink * (1 - 0.1 * out)})` }}>
        <Box
          w={w}
          h={h}
          style={{
            borderRadius: r,
            // white → caramel → coffee keeps the turn warm instead of gray
            background: interpolateColors(done, [0, 0.45, 1], [C.card, C.caramelLight, C.coffee]),
            boxShadow: SHADOW,
            overflow: "hidden",
          }}
        >
          {/* the ordered card's content dissolves as it morphs */}
          <div
            style={{
              position: "absolute",
              left: w / 2,
              top: h / 2,
              transform: `scale(${w / CARD_W}, ${h / CARD_H})`,
              opacity: 1 - prog(f, HANDOFF + 2, 10),
              filter: `blur(${prog(f, HANDOFF + 2, 10) * 14}px)`,
            }}
          >
            <ProductCard p={PRODUCTS[1]} button={1} />
          </div>
        </Box>

        {/* progress */}
        <div style={{ opacity: ui * (1 - barOut) }}>
          <div style={{ position: "absolute", left: -TRACK / 2, top: -30, width: TRACK, height: 16, borderRadius: 8, background: C.line }} />
          <div
            style={{
              position: "absolute",
              left: lead,
              top: -30,
              width: fill * TRACK,
              height: 16,
              borderRadius: 8,
              background: COFFEE_GRADIENT,
            }}
          />
          <Pic
            name="scooter_warm.png"
            size={150}
            style={{
              position: "absolute",
              left: lead - 75,
              top: -30 - 146 - Math.abs(Math.sin(f / 2.2)) * 5 * moving,
              filter: "drop-shadow(0 8px 8px rgba(60,38,26,0.2))",
            }}
          />
        </div>
        {f < 360 ? (
          <div style={{ position: "absolute", left: -440, width: 880, top: 40, display: "flex", justifyContent: "center", opacity: ui }}>
            <BounceWords words={["طلبك", "في", "الطريق"]} at={300} stagger={4} size={62} weight={800} color={C.ink} outAt={342} wave />
          </div>
        ) : null}

        {/* delivered */}
        {f >= 352 ? (
          <>
            <div style={{ position: "absolute", left: -105, top: -200, transform: `scale(${Math.max(0, pop(f, 352, 12, 180))})` }}>
              <Check size={210} t1={prog(f, 354, 12, inOut)} t2={prog(f, 362, 10, inOut)} />
            </div>
            <div
              style={{
                position: "absolute",
                left: -440,
                width: 880,
                top: 46,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
                direction: "rtl",
              }}
            >
              <span style={text(66, 800, C.white)}>{msg}</span>
              <Pic name="latte_small.png" size={84} style={{ transform: `scale(${Math.max(0, pop(f, 384, 11, 200))})` }} />
            </div>
          </>
        ) : null}
      </At>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene F (404–450): outro
// ---------------------------------------------------------------------------
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const icon = pop(f, 406, 12, 160);
  const handle = typed(f, "@rashfa.coffee", 416, 1.2);
  return (
    <AbsoluteFill>
      <At x={540} y={880 + Math.sin(f / 10) * 5}>
        <div style={{ transform: `scale(${icon})` }}>
          <AppIcon size={300} />
        </div>
      </At>
      <At x={540} y={1130}>
        <div style={{ position: "absolute", left: -540, width: 1080, top: -38, textAlign: "center", direction: "ltr", ...text(62, 700, C.ink) }}>
          {handle}
        </div>
      </At>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(90% 60% at 50% 45%, #FBFAF8 0%, ${C.bg} 70%)`,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("audio/track.wav")} />
      {f < 132 && <SearchScene />}
      {f >= 120 && f < 300 && <Shop />}
      {f >= HANDOFF && f < 410 && <Tracking />}
      {f >= 402 && <Outro />}
    </AbsoluteFill>
  );
};
