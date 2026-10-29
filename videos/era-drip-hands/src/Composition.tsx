import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Composition,
  Html5Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
} from "remotion";

const FPS = 30;

// The music's downbeat lands at 2.50s; trimming 1 frame off the start puts it
// exactly on the cut from empty hands to full hands (frame 74).
const MUSIC_TRIM = 1;
const CUT_FRAME = 74;

// Start the "full hands" clip just before the cups are lifted up.
const FULL_HANDS_TRIM = 12;

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

export const EraDripHands: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence durationInFrames={CUT_FRAME}>
        <OffthreadVideo src={staticFile("empty-hands.mp4")} muted />
      </Sequence>
      <Sequence from={CUT_FRAME}>
        <OffthreadVideo
          src={staticFile("full-hands.mp4")}
          trimBefore={FULL_HANDS_TRIM}
          muted
        />
      </Sequence>
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
