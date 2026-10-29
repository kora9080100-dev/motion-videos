import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, usePop, Words } from "../components";
import { C, clamp, easeOut } from "../theme";

// مشهد 3: الساعة تدور = نفس الحيرة كل يوم
export const Clock: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = usePop(0, 13);
  const spin = interpolate(frame, [0, 55], [0, 900], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill>
      <Background glow={0.6} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 70 }}>
        <svg width={440} height={440} viewBox="0 0 200 200" style={{ scale: pop }}>
          <circle cx="100" cy="100" r="88" fill="rgba(13,22,44,0.8)" stroke={C.line} strokeWidth="5" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="100" y1="22" x2="100" y2={i % 3 ? "30" : "36"} stroke={C.muted} strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 30} 100 100)`} />
          ))}
          <line x1="100" y1="100" x2="100" y2="52" stroke={C.ink} strokeWidth="7" strokeLinecap="round" transform={`rotate(${spin / 12} 100 100)`} />
          <line x1="100" y1="100" x2="100" y2="34" stroke={C.saffron} strokeWidth="5" strokeLinecap="round" transform={`rotate(${spin} 100 100)`} />
          <circle cx="100" cy="100" r="7" fill={C.saffron} />
        </svg>
        <div>
          <Words text="كل يوم" size={110} delay={6} />
          <Words text="نفس الحيرة؟" size={130} delay={14} highlight={["الحيرة؟"]} highlightColor={C.saffron} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
