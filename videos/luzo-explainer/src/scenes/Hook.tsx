import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Words } from "../components";
import { clamp } from "../theme";

// مشهد 1: السؤال اللي يوقف السكرول
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background glow={interpolate(frame, [0, 40], [0.6, 1.2], clamp)} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", scale: interpolate(frame, [0, 70], [1, 1.07]) }}>
        <Words text="وش تنشر" size={150} delay={4} stagger={6} />
        <Words text="اليوم؟" size={210} delay={16} highlight={["اليوم؟"]} style={{ marginTop: -10 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
