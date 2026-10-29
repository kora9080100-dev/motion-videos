import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Html5Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

const FPS = 30;

// The music's downbeat lands at 2.50s; trimming 1 frame off the start puts it
// exactly on the cut from empty hands to full hands (frame 74).
const MUSIC_TRIM = 1;
const CUT_FRAME = 74;

// The ~60fps "empty hands" clip plays in slow motion so that it reaches the
// moment the palms are held out in front (1.43s in) right on the cut.
const EMPTY_HANDS_SPEED = 0.58;

// The "full hands" clip is at the same spot on the cut, just before the cups
// are lifted up.
const FULL_HANDS_TRIM = 12;

// The two clips blend over a few frames around the cut, with a small zoom
// punch and blur on the beat, so the cups seem to appear in the empty hands.
const BLEND_HALF = 3;

// Music is 5.80s long.
const DURATION = 173;

const FONT_FAMILY = "Tajawal";

loadFont({
  family: FONT_FAMILY,
  url: staticFile("tajawal-800.woff2"),
  weight: "800",
});

const Caption: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 255,
      }}
    >
      <div
        dir="rtl"
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: 800,
          fontSize: 74,
          lineHeight: 1.32,
          color: "white",
          textAlign: "center",
          textShadow:
            "0 2px 6px rgba(0, 0, 0, 0.55), 0 4px 22px rgba(0, 0, 0, 0.35)",
        }}
      >
        كيف يدك تصير
        <br />
        مليانه بثانيه؟
      </div>
    </AbsoluteFill>
  );
};

const Footage: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;

  const fullHandsOpacity = interpolate(
    frame,
    [CUT_FRAME - BLEND_HALF, CUT_FRAME + BLEND_HALF],
    [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  const zoom = interpolate(
    frame,
    [CUT_FRAME - 6, CUT_FRAME, CUT_FRAME + 10],
    [1, 1.06, 1],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );
  const blur = interpolate(
    frame,
    [CUT_FRAME - BLEND_HALF, CUT_FRAME, CUT_FRAME + BLEND_HALF + 1],
    [0, 5, 0],
    clamp,
  );

  return (
    <AbsoluteFill
      style={{ transform: `scale(${zoom})`, filter: `blur(${blur}px)` }}
    >
      <Sequence durationInFrames={CUT_FRAME + BLEND_HALF}>
        <OffthreadVideo
          src={staticFile("empty-hands.mp4")}
          playbackRate={EMPTY_HANDS_SPEED}
          muted
        />
      </Sequence>
      <Sequence
        from={CUT_FRAME - BLEND_HALF}
        style={{ opacity: fullHandsOpacity }}
      >
        <OffthreadVideo
          src={staticFile("full-hands.mp4")}
          trimBefore={FULL_HANDS_TRIM - BLEND_HALF}
          muted
        />
      </Sequence>
    </AbsoluteFill>
  );
};

export const EraDripHands: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Footage />
      <Html5Audio
        src={staticFile("music.m4a")}
        trimBefore={MUSIC_TRIM}
        volume={(f) =>
          interpolate(f, [DURATION - 4, DURATION], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Caption />
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="EraDripHands"
      component={EraDripHands}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
