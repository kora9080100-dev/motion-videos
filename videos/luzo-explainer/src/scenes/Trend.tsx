import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Chip, Glass, Icon, usePop, Words } from "../components";
import { C, clamp, easeOut } from "../theme";

// مشهد 7: ترند مدروس على البراند: نسبة المناسبة ودليل الانتشار
export const Trend: React.FC = () => {
  const frame = useCurrentFrame();
  const card = usePop(6, 15);
  const pct = interpolate(frame, [18, 48], [0, 85], { ...clamp, easing: easeOut });
  const views = interpolate(frame, [24, 56], [0, 143], { ...clamp, easing: easeOut });
  const R = 120;
  const circ = 2 * Math.PI * R;
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
        <Words text="ترند مدروس" size={110} delay={2} highlight={["مدروس"]} />
        <Words text="على براندك" size={110} delay={10} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 380 }}>
        <Glass style={{ width: 900, padding: "56px 60px", scale: 0.8 + card * 0.2, opacity: card, display: "flex", flexDirection: "column", gap: 34 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Chip color={C.saffron}>صوت رائج</Chip>
            <Chip color={C.green} style={{ scale: usePop(48, 9) }}>
              يناسبك {Math.round(pct)}%
            </Chip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
            <svg width={2 * R + 40} height={2 * R + 40} viewBox={`0 0 ${2 * R + 40} ${2 * R + 40}`}>
              <circle cx={R + 20} cy={R + 20} r={R} stroke="rgba(148,163,184,0.18)" strokeWidth="22" fill="none" />
              <circle
                cx={R + 20}
                cy={R + 20}
                r={R}
                stroke={C.green}
                strokeWidth="22"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                transform={`rotate(-90 ${R + 20} ${R + 20})`}
              />
              <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill={C.ink} fontSize="78" fontWeight="900">
                {Math.round(pct)}%
              </text>
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <span style={{ fontSize: 70, fontWeight: 900, direction: "ltr", textAlign: "right" }}>Hello, October</span>
              <span style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 44, color: C.muted, fontWeight: 700 }}>
                <Icon name="trend" size={50} color={C.green} />
                {Math.round(views)} ألف فيديو
              </span>
            </div>
          </div>
        </Glass>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
