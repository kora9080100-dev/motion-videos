import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Cursor, LuzoMark, Ripple, usePop, Words } from "../components";
import { C, clamp, fontFamily } from "../theme";

// مشهد 10: الدعوة: جرّب يومين مجاناً، ضغطة على الزر، والشعار مع الرابط
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const btn = usePop(24, 11);
  const press = 50;
  const pressed = interpolate(frame, [press, press + 4, press + 10], [1, 0.93, 1.04], clamp);
  const outro = interpolate(frame, [62, 78], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Background glow={1.2} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
        <Words text="جرّب" size={130} delay={2} />
        <Words text="يومين مجاناً" size={150} delay={9} highlight={["مجاناً"]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 160 }}>
        <div
          style={{
            fontFamily,
            fontSize: 64,
            fontWeight: 900,
            color: "#02040f",
            background: "#fff",
            borderRadius: 999,
            padding: "34px 110px",
            direction: "rtl",
            scale: btn * pressed,
            boxShadow: `0 0 ${interpolate(frame, [press, press + 16], [40, 140], clamp)}px ${C.blue}aa`,
          }}
        >
          ابدأ الحين
        </div>
      </AbsoluteFill>
      <Ripple at={press} x={560} y={1050} color="#fff" />
      <Cursor from={[900, 1700]} to={[560, 1040]} start={30} arrive={47} press={press} />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230, opacity: outro, translate: `0px ${(1 - outro) * 40}px` }}>
        <LuzoMark size={120} pulse={Math.max(0, Math.sin(frame / 5))} />
        <div style={{ fontFamily, fontSize: 52, fontWeight: 700, color: C.blue, marginTop: 26, direction: "ltr" }}>luzo-sa.vercel.app</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
