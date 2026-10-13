import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { inCubic, inOut, inQuint, lerp, outExpo, pop, prog, velocity } from "./anim";
import {
  At,
  Background,
  Center,
  MBlur,
  Pic,
  Surface,
  Word,
  Words,
} from "./components";
import { FONT } from "./fonts";
import { C, EMBER_GRADIENT, SHADOW_SMALL } from "./theme";

// Frame windows for each beat (30fps).
const S1 = [0, 112]; // "محتار / وش تاكل؟" → card → silhouette "مطعم واحد يحلّها كلها"
const S3 = [100, 318]; // brand card + menu timeline
const S5 = [310, 368]; // "الكل في واحد"
const S6 = [358, 420]; // "جمر يطبخ كل شي" + burger
const S7 = [418, 496]; // bar + chef peeking "هذي شغلتنا"
const S8 = [484, 566]; // "تعال نسوي لك شي لذيذ."
const S9 = [554, 600]; // logo

const live = (f: number, [a, b]: number[]) => f >= a && f < b;

// ---------------------------------------------------------------------------
// Scene 1–2: pill morphs into a tall card; a chef silhouette rises out of it.
// ---------------------------------------------------------------------------
const HookToCard: React.FC = () => {
  const f = useCurrentFrame();

  // "محتار" lifts and shrinks when the pill lands under it.
  const lift = prog(f, 14, 12, inOut);
  const hookOut = prog(f, 30, 8);

  // Pill → horizontal card → tall card.
  const s = pop(f, 14, 12, 170);
  const m1 = prog(f, 32, 14, inOut);
  const m2 = prog(f, 46, 16, inOut);
  const w = lerp(lerp(640, 740, m1), 700, m2);
  const h = lerp(lerp(160, 470, m1), 640, m2);
  const r = lerp(lerp(80, 46, m1), 50, m2);
  const cy = lerp(960, 1000, m2);

  // Whip out to the left.
  const exit = (x: number) => prog(x, 94, 12, inCubic);
  const e = exit(f);
  const blurX = Math.min(70, velocity(exit, f) * 1350 * 0.32);

  // Silhouette rise.
  const rise = (x: number) => prog(x, 50, 20, outExpo);
  const rp = rise(f);
  const silBlur = Math.min(30, velocity(rise, f) * 900 * 0.35);

  const pillTextOut = prog(f, 30, 6);
  const IMG = 880;
  const OVER = 400; // room above the card for the pop-out

  return (
    <AbsoluteFill>
      {/* Hook word above the pill */}
      <At x={540} y={lerp(960, 790, lift)}>
        <Center
          style={{
            transform: `translate(-50%, -50%) scale(${lerp(1, 0.6, lift)})`,
            opacity: 1 - hookOut,
            filter: `blur(${hookOut * 14}px)`,
          }}
        >
          <Word text="محتار" at={2} size={130} weight={800} />
        </Center>
      </At>

      <MBlur x={blurX}>
        <div style={{ position: "absolute", inset: 0, perspective: 1700 }}>
          <At
            x={540 - 1350 * e}
            y={cy - 180 * e}
            style={{
              transform: `rotateY(${42 * e}deg) rotateZ(${-9 * e}deg) scale(${s})`,
              transformStyle: "preserve-3d",
            }}
          >
            <Surface w={w} h={h} r={r} sheen={prog(f, 18, 40, inOut)}>
              {/* pill label */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 1 - pillTextOut,
                  filter: `blur(${pillTextOut * 10}px)`,
                }}
              >
                <Words words={["وش", "تاكل؟"]} at={18} stagger={4} size={92} tone="white" />
              </div>
            </Surface>

            {/* Silhouette: clipped by the card's sides and bottom, free above it */}
            {f >= 50 ? (
              <div
                style={{
                  position: "absolute",
                  left: -w / 2,
                  top: -h / 2 - OVER,
                  width: w,
                  height: h + OVER,
                  overflow: "hidden",
                  borderRadius: `0 0 ${r}px ${r}px`,
                }}
              >
                <Pic
                  name="cook@4x.png"
                  size={IMG}
                  style={{
                    position: "absolute",
                    left: w / 2 - IMG * 0.5,
                    top: OVER + h - IMG * 0.935 + (1 - rp) * 800,
                    filter: `brightness(0) blur(${silBlur * 0.25}px)`,
                    opacity: 0.94 * Math.min(1, rp * 2),
                  }}
                />
              </div>
            ) : null}

            {/* Copy over the silhouette */}
            <At x={0} y={h / 2 - 235}>
              <Center>
                <Words words={["مطعم", "واحد"]} at={62} stagger={3} size={58} weight={700} tone="white" />
              </Center>
            </At>
            <At x={0} y={h / 2 - 115}>
              <Center>
                <Words words={["يحلّها", "كلها"]} at={70} stagger={6} size={126} tone="white" />
              </Center>
            </At>
          </At>
        </div>
      </MBlur>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3–4: brand card with the chef popping out, then the menu timeline.
// ---------------------------------------------------------------------------
const MENU: [string, string][] = [
  ["برجر", "burger.png"],
  ["ستيك", "steak.png"],
  ["باستا", "pasta.png"],
  ["حلا", "cake.png"],
  ["قهوة", "coffee.png"],
];
const MENU_AT = 150;
const MENU_STEP = 30;

const BrandCard: React.FC = () => {
  const f = useCurrentFrame();
  const w = 980;
  const h = 440;
  const r = 44;
  const CHEF_X = -20; // nudged toward the shorter word so both words stay readable

  // Whip in from the right.
  const enter = (x: number) => prog(x, 102, 16, outExpo);
  const en = enter(f);
  const blurX = Math.min(70, velocity(enter, f) * 1300 * 0.3);

  // Group moves up to make room for the list, then drifts.
  const up = prog(f, 158, 18, inOut);
  const gy = lerp(930, 720, up) - 36 * prog(f, 176, 130, (t) => t);
  const gs = 1 + 0.03 * prog(f, 150, 160, (t) => t);

  // Exit: blur away.
  const out = prog(f, 300, 14, inQuint);

  // Chef rise.
  const chef = pop(f, 112, 15, 150);
  const IMG = 600;
  const OVER = 400;

  const lineX = w / 2 - 110; // timeline sits near the card's right edge (RTL)
  const itemY = (i: number) => h / 2 + 105 + i * 112;
  // Line reaches down to the latest item.
  let lineEnd = h / 2;
  MENU.forEach((_, i) => {
    const p = prog(f, MENU_AT + i * MENU_STEP - 8, 9, inOut);
    if (p > 0) lineEnd = lerp(i === 0 ? h / 2 : itemY(i - 1), itemY(i), p);
  });

  return (
    <MBlur x={blurX}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: 1700,
          opacity: 1 - out,
          filter: out > 0 ? `blur(${out * 22}px)` : undefined,
        }}
      >
        <At
          x={540 + 1300 * (1 - en)}
          y={gy}
          style={{
            transform: `rotateY(${-38 * (1 - en)}deg) scale(${gs * (1 + out * 0.12)})`,
          }}
        >
          <Surface w={w} h={h} r={r} sheen={prog(f, 108, 40, inOut)}>
            {/* Name split around the chef's head */}
            <div style={{ position: "absolute", right: 40, top: 14 }}>
              <Word text="مطعم" at={110} size={118} tone="white" fromX={60} />
            </div>
            <div style={{ position: "absolute", left: 42, top: 14 }}>
              <Word text="جمر" at={116} size={118} tone="white" fromX={60} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 46,
                top: 158,
                display: "flex",
                direction: "rtl",
                gap: 12,
                opacity: 0.92,
              }}
            >
              {["مو", "مطعم", "عادي"].map((t, i) => (
                <Word key={i} text={t} at={128 + i * 4} size={36} weight={700} tone="white" />
              ))}
            </div>
          </Surface>

          {/* Chef pops out of the top edge */}
          <div
            style={{
              position: "absolute",
              left: -w / 2,
              top: -h / 2 - OVER,
              width: w,
              height: h + OVER,
              overflow: "hidden",
              borderRadius: `0 0 ${r}px ${r}px`,
            }}
          >
            <Pic
              name="cook@4x.png"
              size={IMG}
              style={{
                position: "absolute",
                left: w / 2 + CHEF_X - IMG * 0.5,
                top: OVER + h - IMG * 0.93 + (1 - chef) * 700,
                filter: "drop-shadow(0 18px 30px rgba(20,4,6,0.45))",
              }}
            />
          </div>

          {/* Timeline */}
          <div style={{ position: "absolute", left: -w / 2, top: 0, width: w, height: 0 }}>
            <div
              style={{
                position: "absolute",
                left: lineX - 3,
                top: h / 2,
                width: 6,
                height: Math.max(0, lineEnd - h / 2),
                borderRadius: 3,
                background: C.ink,
              }}
            />
            {MENU.map(([label, icon], i) => {
              const a = MENU_AT + i * MENU_STEP;
              const d = pop(f, a, 11, 220);
              const ic = pop(f, a + 4, 10, 180);
              return (
                <React.Fragment key={label}>
                  <div
                    style={{
                      position: "absolute",
                      left: lineX - 19,
                      top: itemY(i) - 19,
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      background: C.ink,
                      boxShadow: "0 0 0 7px #EDEDED",
                      transform: `scale(${d})`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: w - lineX + 44,
                      top: itemY(i),
                      transform: "translateY(-50%)",
                      display: "flex",
                      direction: "rtl",
                      alignItems: "center",
                      gap: 22,
                    }}
                  >
                    <Word text={label} at={a + 1} size={64} weight={800} fromX={50} />
                    <Pic
                      name={icon}
                      size={92}
                      style={{
                        transform: `scale(${ic}) rotate(${(1 - ic) * -25}deg)`,
                        filter: "drop-shadow(0 8px 10px rgba(40,10,12,0.25))",
                      }}
                    />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </At>
      </div>
    </MBlur>
  );
};

// ---------------------------------------------------------------------------
// Scene 5: "الكل في واحد" then zoom-through.
// ---------------------------------------------------------------------------
const AllInOne: React.FC = () => {
  const f = useCurrentFrame();
  const z = prog(f, 350, 14, inQuint);
  const streak = prog(f, 348, 18, (t) => t);
  return (
    <AbsoluteFill>
      <At x={540} y={940}>
        <Center
          style={{
            transform: `translate(-50%, -50%) scale(${1 + z * 3.2})`,
            opacity: 1 - z,
            filter: z > 0 ? `blur(${z * 26}px)` : undefined,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ marginBottom: -28, marginRight: 30 }}>
              <Word text="الكل" at={314} size={86} weight={800} />
            </div>
            <Words words={["في", "واحد"]} at={322} stagger={6} size={210} />
          </div>
        </Center>
      </At>
      {streak > 0 && streak < 1 ? (
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2 + (i % 3) * 0.05;
            const r0 = lerp(120, 900, streak) + (i % 5) * 40;
            const r1 = r0 + 260 + (i % 4) * 60;
            return (
              <line
                key={i}
                x1={540 + Math.cos(a) * r0}
                y1={960 + Math.sin(a) * r0}
                x2={540 + Math.cos(a) * r1}
                y2={960 + Math.sin(a) * r1}
                stroke={C.ink}
                strokeOpacity={0.18 * Math.sin(streak * Math.PI)}
                strokeWidth={4}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6: "جمر يطبخ كل شي" with a big burger rising.
// ---------------------------------------------------------------------------
const Pill: React.FC<{
  text: string;
  at: number;
  w: number;
  h: number;
  size: number;
  gradient?: string;
  rotate?: number;
}> = ({ text, at, w, h, size, gradient, rotate = 0 }) => {
  const f = useCurrentFrame();
  const s = pop(f, at, 11, 200);
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        transform: `scale(${s}) rotate(${rotate}deg)`,
      }}
    >
      <At x={w / 2} y={h / 2}>
        <Surface w={w} h={h} r={h / 2} sheen={prog(f, at + 2, 20, inOut)} gradient={gradient} shadow={SHADOW_SMALL}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: size,
              color: C.white,
              lineHeight: 1,
              direction: "rtl",
              paddingBottom: size * 0.12,
            }}
          >
            {text}
          </div>
        </Surface>
      </At>
    </div>
  );
};

const BurgerScene: React.FC = () => {
  const f = useCurrentFrame();
  const rise = (x: number) => prog(x, 360, 18, outExpo);
  const bp = rise(f);
  const by = 1330 + (1 - bp) * 950;
  const blurY = Math.min(40, velocity(rise, f) * 950 * 0.3);
  const out = prog(f, 406, 12, inQuint);
  const float = Math.sin((f - 378) / 13) * 10 * bp;
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 20}px)` : undefined,
        transform: `scale(${1 - out * 0.08})`,
      }}
    >
      <At x={540} y={560}>
        <Center>
          <div style={{ display: "flex", direction: "rtl", alignItems: "center", gap: 22 }}>
            <Pill text="جمر" at={372} w={210} h={100} size={62} />
            <Word text="يطبخ" at={378} size={66} weight={800} />
          </div>
        </Center>
      </At>
      <At x={540} y={730}>
        <Center>
          <Words words={["كل", "شي"]} at={386} stagger={6} size={220} />
        </Center>
      </At>
      {/* soft contact shadow */}
      <At x={540} y={1700}>
        <div
          style={{
            position: "absolute",
            left: -300,
            top: -40,
            width: 600,
            height: 80,
            borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(60,20,20,0.28), rgba(60,20,20,0))",
            opacity: bp,
            transform: `scale(${1 - float / 120})`,
          }}
        />
      </At>
      <MBlur y={blurY}>
        <At x={540} y={by + float}>
          <Center style={{ transform: `translate(-50%, -50%) rotate(${Math.sin((f - 378) / 19) * 2 * bp}deg)` }}>
            <Pic
              name="burger@4x.png"
              size={820}
              style={{ filter: "drop-shadow(0 30px 40px rgba(60,15,15,0.25))" }}
            />
          </Center>
        </At>
      </MBlur>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 7: glossy bar, chef peeks from behind it — "هذي شغلتنا".
// ---------------------------------------------------------------------------
const ChefPeek: React.FC = () => {
  const f = useCurrentFrame();
  const bar = pop(f, 420, 13, 190);
  const chef = pop(f, 432, 10, 160);
  const exit = (x: number) => prog(x, 478, 14, inQuint);
  const e = exit(f);
  const blurX = Math.min(70, velocity(exit, f) * 1300 * 0.32);
  const wob = Math.sin((f - 440) / 7) * 5 * chef;
  const BW = 660;
  const BH = 176;
  const BY = 960;
  const IMG = 540;
  return (
    <MBlur x={blurX}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${-1300 * e}px)` }}>
        {/* Chef, clipped at the bar's middle so he looks like he's behind it */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: BY,
            overflow: "hidden",
          }}
        >
          <Pic
            name="cook@4x.png"
            size={IMG}
            style={{
              position: "absolute",
              left: 540 - IMG / 2,
              top: BY - IMG * 0.8 + (1 - chef) * 420,
              transform: `rotate(${wob}deg)`,
              transformOrigin: "50% 90%",
            }}
          />
        </div>
        <At x={540} y={BY}>
          <div style={{ transform: `scale(${lerp(0.15, 1, Math.min(bar, 1.2))}, ${lerp(0.6, 1, Math.min(1, bar))})` }}>
            <Surface w={BW} h={BH} r={BH / 2} sheen={prog(f, 426, 20, inOut)} />
          </div>
        </At>
        <At x={540} y={1230}>
          <Center>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ marginBottom: -22, marginRight: 24 }}>
                <Word text="هذي" at={452} size={78} weight={800} />
              </div>
              <Word text="شغلتنا" at={460} size={200} />
            </div>
          </Center>
        </At>
      </div>
    </MBlur>
  );
};

// ---------------------------------------------------------------------------
// Scene 8: "تعال نسوي لك شي لذيذ."
// ---------------------------------------------------------------------------
const LetsMake: React.FC = () => {
  const f = useCurrentFrame();
  const out = prog(f, 548, 12, inQuint);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 20}px)` : undefined,
        transform: `scale(${1 + out * 0.06})`,
      }}
    >
      <At x={540} y={950}>
        <Center>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ marginBottom: -14, marginRight: 22 }}>
              <Word text="تعال" at={490} size={84} weight={800} fromX={140} />
            </div>
            <Words words={["نسوي", "لك", "شي"]} at={496} stagger={5} size={158} fromX={160} />
            <div style={{ alignSelf: "flex-start", marginTop: 4, marginLeft: -10 }}>
              <Pill text="لذيذ." at={516} w={250} h={104} size={64} gradient={EMBER_GRADIENT} rotate={-5} />
            </div>
          </div>
        </Center>
      </At>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 9: logo.
// ---------------------------------------------------------------------------
const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const fire = pop(f, 558, 11, 170);
  const settle = 1 + 0.03 * prog(f, 560, 40, (t) => t);
  return (
    <AbsoluteFill style={{ transform: `scale(${settle})` }}>
      <At x={540} y={740}>
        <Center style={{ transform: `translate(-50%, -50%) scale(${fire})` }}>
          <Pic name="fire.png" size={200} style={{ filter: "drop-shadow(0 16px 22px rgba(194,65,12,0.35))" }} />
        </Center>
      </At>
      <At x={540} y={960}>
        <Center>
          <Word text="جمر" at={562} size={270} dur={12} />
        </Center>
      </At>
      <At x={540} y={1145}>
        <Center>
          <Words words={["برجر", "على", "الفحم"]} at={570} stagger={4} size={66} weight={700} tone="ember" />
        </Center>
      </At>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("audio/track.wav")} />
      <Background />
      {live(f, S1) && <HookToCard />}
      {live(f, S3) && <BrandCard />}
      {live(f, S5) && <AllInOne />}
      {live(f, S6) && <BurgerScene />}
      {live(f, S7) && <ChefPeek />}
      {live(f, S8) && <LetsMake />}
      {live(f, S9) && <Logo />}
    </AbsoluteFill>
  );
};
