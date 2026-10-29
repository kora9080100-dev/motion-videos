import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Benefits } from "./scenes/Benefits";
import { Clock } from "./scenes/Clock";
import { CTA } from "./scenes/CTA";
import { Data } from "./scenes/Data";
import { Hook } from "./scenes/Hook";
import { IdeaDetail } from "./scenes/IdeaDetail";
import { Logo } from "./scenes/Logo";
import { PhonePlan } from "./scenes/PhonePlan";
import { Problem } from "./scenes/Problem";
import { Trend } from "./scenes/Trend";
import { move } from "./transitions";

const T = 10; // طول كل انتقال بالفريم

// المشاهد بالترتيب مع مدتها والانتقال اللي بعدها (حسب السكربت المعتمد)
export const SCENES = [
  { id: "Hook", component: Hook, duration: 70, next: "zoom" },
  { id: "Problem", component: Problem, duration: 80, next: "whip" },
  { id: "Clock", component: Clock, duration: 55, next: "blur" },
  { id: "Logo", component: Logo, duration: 70, next: "zoom" },
  { id: "PhonePlan", component: PhonePlan, duration: 120, next: "zoom" },
  { id: "IdeaDetail", component: IdeaDetail, duration: 105, next: "whip" },
  { id: "Trend", component: Trend, duration: 80, next: "zoomOut" },
  { id: "Data", component: Data, duration: 80, next: "whip" },
  { id: "Benefits", component: Benefits, duration: 80, next: "zoom" },
  { id: "CTA", component: CTA, duration: 100, next: null },
] as const;

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.duration, 0) - T * (SCENES.length - 1);

// وين يبدأ كل مشهد في الفيديو كامل (عشان نزامن الأصوات)
const starts = SCENES.map((_, i) => SCENES.slice(0, i).reduce((a, s) => a + s.duration, 0) - T * i);
const at = (scene: (typeof SCENES)[number]["id"], local: number) => starts[SCENES.findIndex((s) => s.id === scene)] + local;

const SFX: { src: string; from: number; volume: number }[] = [
  // ووش مع كل انتقال
  ...starts.slice(1).map((s) => ({ src: "sfx/whoosh.wav", from: s - 2, volume: 0.45 })),
  // طقة لكل كرت مشكلة
  ...[6, 20, 34].map((f) => ({ src: "sfx/switch.wav", from: at("Problem", f), volume: 0.35 })),
  // ضغطات المؤشر
  { src: "sfx/mouse-click.wav", from: at("PhonePlan", 92), volume: 0.7 },
  { src: "sfx/mouse-click.wav", from: at("CTA", 50), volume: 0.7 },
  // نسبة المناسبة اكتملت + علامة الصح
  { src: "sfx/ding.wav", from: at("Trend", 48), volume: 0.3 },
  { src: "sfx/ding.wav", from: at("Data", 60), volume: 0.3 },
  // المزايا الأربع
  ...[8, 16, 24, 32].map((f) => ({ src: "sfx/switch.wav", from: at("Benefits", f), volume: 0.25 })),
];

export const LuzoExplainer: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#02040f" }}>
    <TransitionSeries>
      {SCENES.map((s) => (
        <React.Fragment key={s.id}>
          <TransitionSeries.Sequence name={s.id} durationInFrames={s.duration}>
            <s.component />
          </TransitionSeries.Sequence>
          {s.next && <TransitionSeries.Transition presentation={move(s.next)} timing={linearTiming({ durationInFrames: T })} />}
        </React.Fragment>
      ))}
    </TransitionSeries>
    {SFX.map((x, i) => (
      <Sequence key={i} from={x.from} durationInFrames={60} layout="none" name={`sfx ${x.src}`}>
        <Audio src={staticFile(x.src)} volume={x.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
