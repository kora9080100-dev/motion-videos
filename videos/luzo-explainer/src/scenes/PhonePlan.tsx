import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Chip, Cursor, Icon, Ripple, usePop, Words } from "../components";
import { C, clamp, fontFamily } from "../theme";

const IDEAS = [
  { chip: "فيديو تيك توك", icon: "play" as const, color: "#f472b6", hook: "أنواع الزباين الساعة 7 الصبح", score: 0.92 },
  { chip: "ريلز انستقرام", icon: "camera" as const, color: C.blue, hook: "طلبنا من 10 زباين يخمنون السعر", score: 0.84 },
  { chip: "كاروسيل", icon: "camera" as const, color: C.saffron, hook: "4 أشياء تخرب قهوتك", score: 0.78 },
];

// مشهد 5: جوال فيه "خطة اليوم" و3 كروت تدخل، والمؤشر يضغط الأولى (مثل مرجع iFood)
export const PhonePlan: React.FC = () => {
  const frame = useCurrentFrame();
  const phone = usePop(4, 16);
  const press = 92;
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
        <Words text="كل صباح:" size={84} delay={2} />
        <Words text="3 أفكار جاهزة" size={104} delay={10} highlight={["3", "أفكار"]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", perspective: 1800 }}>
        <div
          style={{
            width: 700,
            height: 1240,
            marginBottom: -120,
            borderRadius: 90,
            border: "12px solid #1e293b",
            background: "linear-gradient(180deg, #071128 0%, #030712 100%)",
            boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 120px ${C.blueDeep}55`,
            padding: "70px 40px",
            direction: "rtl",
            fontFamily,
            color: C.ink,
            translate: `0px ${(1 - phone) * 500}px`,
            rotate: `x ${interpolate(frame, [0, 120], [14, 4], clamp)}deg`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
            <span style={{ fontSize: 54, fontWeight: 900 }}>خطة اليوم</span>
            <Chip size={30} color={C.green}>
              جاهزة
            </Chip>
          </div>
          {IDEAS.map((idea, i) => {
            const at = 22 + i * 12;
            const enter = interpolate(frame, [at, at + 14], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
            const pressed = i === 0 ? interpolate(frame, [press, press + 4, press + 10], [1, 0.95, 1.02], clamp) : 1;
            return (
              <div
                key={idea.hook}
                style={{
                  background: "rgba(15,23,42,0.9)",
                  border: `2px solid ${i === 0 && frame > press ? C.blue : C.line}`,
                  borderRadius: 34,
                  padding: "30px 32px",
                  marginBottom: 26,
                  opacity: enter,
                  translate: `${(1 - enter) * 300}px 0px`,
                  scale: pressed,
                }}
              >
                <Chip size={28} color={idea.color}>
                  <Icon name={idea.icon} size={30} color={idea.color} />
                  {idea.chip}
                </Chip>
                <div style={{ fontSize: 44, fontWeight: 700, marginTop: 18, lineHeight: 1.35 }}>{idea.hook}</div>
                <div style={{ height: 12, borderRadius: 99, background: "rgba(148,163,184,0.15)", marginTop: 20 }}>
                  <div style={{ height: 12, borderRadius: 99, background: idea.color, width: `${idea.score * 100 * interpolate(frame, [at + 8, at + 30], [0, 1], clamp)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Ripple at={press} x={540} y={1000} />
      <Cursor from={[880, 1820]} to={[520, 990]} start={62} arrive={88} press={press} />
    </AbsoluteFill>
  );
};
