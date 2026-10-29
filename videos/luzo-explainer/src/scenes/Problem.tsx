import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Glass, Icon, usePop } from "../components";
import { C, clamp } from "../theme";

const ITEMS = ["ما عندي فكرة", "نشرت وما أحد تفاعل", "الترند فاتني"];

const ProblemCard: React.FC<{ text: string; at: number; tilt: number }> = ({ text, at, tilt }) => {
  const frame = useCurrentFrame();
  const enter = usePop(at, 14);
  const x = usePop(at + 9, 10);
  return (
    <Glass
      style={{
        width: 860,
        padding: "44px 54px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 30,
        opacity: interpolate(frame, [at, at + 6], [0, 1], clamp),
        translate: `0px ${(1 - enter) * 160}px`,
        rotate: `${(1 - enter) * tilt}deg`,
      }}
    >
      <span style={{ fontSize: 64, fontWeight: 900 }}>{text}</span>
      <span style={{ scale: x }}>
        <Icon name="x" size={84} color={C.red} />
      </span>
    </Glass>
  );
};

// مشهد 2: المشاكل تتكدس (مثل مرجع Opptics)
export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = frame > 62 ? Math.sin(frame * 2.2) * interpolate(frame, [62, 80], [10, 0], clamp) : 0;
  return (
    <AbsoluteFill>
      <Background glow={0.7} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 40, translate: `${shake}px 0px` }}>
        {ITEMS.map((t, i) => (
          <ProblemCard key={t} text={t} at={6 + i * 14} tilt={i % 2 ? 5 : -5} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
