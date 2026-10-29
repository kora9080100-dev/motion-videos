import { AbsoluteFill } from "remotion";
import { Background, Glass, Icon, usePop, Words } from "../components";
import { C } from "../theme";

const TILES = [
  { icon: "bulb" as const, label: "3 أفكار يومياً", color: C.saffron },
  { icon: "trend" as const, label: "ترند السعودية", color: C.green },
  { icon: "play" as const, label: "انستقرام وتيك توك", color: "#f472b6" },
  { icon: "chat" as const, label: "بلهجتك", color: C.blue },
];

const Tile: React.FC<{ t: (typeof TILES)[number]; at: number }> = ({ t, at }) => {
  const pop = usePop(at, 11);
  return (
    <Glass style={{ width: 440, height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34, scale: pop, opacity: Math.min(1, pop * 1.4) }}>
      <div style={{ width: 150, height: 150, borderRadius: 44, background: `${t.color}22`, border: `2px solid ${t.color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={t.icon} size={92} color={t.color} />
      </div>
      <span style={{ fontSize: 50, fontWeight: 900, textAlign: "center", padding: "0 20px" }}>{t.label}</span>
    </Glass>
  );
};

// مشهد 9: المزايا الأربع تطلع وحدة ورا الثانية
export const Benefits: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 190 }}>
      <Words text="كل اللي تحتاجه" size={104} delay={2} highlight={["تحتاجه"]} />
    </AbsoluteFill>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 220 }}>
      <div style={{ display: "grid", gridTemplateColumns: "440px 440px", gap: 40, direction: "rtl" }}>
        {TILES.map((t, i) => (
          <Tile key={t.label} t={t} at={8 + i * 8} />
        ))}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
