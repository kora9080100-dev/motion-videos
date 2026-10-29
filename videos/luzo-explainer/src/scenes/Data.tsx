import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Glass, Icon, usePop, Words } from "../components";
import { C, clamp, easeOut } from "../theme";

const BARS = [0.35, 0.5, 0.42, 0.68, 0.95];
const STATS = [
  ["المشاهدات", "12.4K"],
  ["الحفظ", "380"],
  ["المشاركات", "214"],
];

// مشهد 8: لقطة إحصائيات تنرفع والأعمدة تطلع، وآخر عمود يتحول لعلامة صح
export const Data: React.FC = () => {
  const frame = useCurrentFrame();
  const up = usePop(6, 16);
  const check = usePop(60, 10);
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
        <Words text="نتعلم من أرقامك" size={104} delay={2} highlight={["أرقامك"]} />
        <Words text="وكل يوم الخطة أذكى" size={58} weight={700} color={C.muted} delay={14} stagger={4} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 360 }}>
        <Glass style={{ width: 900, padding: "50px 56px", translate: `0px ${(1 - up) * 700}px` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 46 }}>
            {STATS.map(([k, v], i) => (
              <div key={k} style={{ textAlign: "center", opacity: interpolate(frame, [16 + i * 5, 26 + i * 5], [0, 1], clamp) }}>
                <div style={{ fontSize: 58, fontWeight: 900, direction: "ltr" }}>{v}</div>
                <div style={{ fontSize: 36, color: C.muted, fontWeight: 700 }}>{k}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 420, display: "flex", alignItems: "flex-end", justifyContent: "space-between", direction: "ltr", position: "relative" }}>
            {BARS.map((h, i) => {
              const grow = interpolate(frame, [22 + i * 5, 44 + i * 5], [0, 1], { ...clamp, easing: easeOut });
              const last = i === BARS.length - 1;
              return (
                <div
                  key={i}
                  style={{
                    width: 128,
                    height: 400 * h * grow,
                    borderRadius: 28,
                    background: last ? `linear-gradient(180deg, ${C.green}, #059669)` : `linear-gradient(180deg, ${C.blue}, ${C.blueDeep})`,
                    opacity: last ? 1 - check * 0.15 : 0.9,
                  }}
                />
              );
            })}
            <div style={{ position: "absolute", right: 4, top: -40, scale: check }}>
              <Icon name="check" size={150} color={C.green} />
            </div>
          </div>
        </Glass>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
