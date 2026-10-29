import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, LuzoMark, usePop, Words } from "../components";
import { C, clamp, easeOut } from "../theme";

// مشهد 4: الحل = Luzo، مع انفجار ضوء
export const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = usePop(4, 11);
  const burst = interpolate(frame, [0, 26], [0, 1], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill>
      <Background glow={1.3} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.blue}cc 0%, ${C.blueDeep}55 35%, transparent 70%)`,
            scale: 0.2 + burst * 2.2,
            opacity: 1 - burst * 0.75,
          }}
        />
        <div style={{ scale: 0.55 + pop * 0.45, filter: `blur(${interpolate(frame, [4, 16], [18, 0], clamp)}px)` }}>
          <LuzoMark size={230} pulse={Math.max(0, Math.sin(frame / 5))} />
        </div>
        <Words text="خطة محتوى يومية لبراندك" size={76} weight={700} delay={24} stagger={4} highlight={["يومية"]} style={{ marginTop: 70, maxWidth: 900 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
