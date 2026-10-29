import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background, Chip, Glass, Icon, usePop, Words } from "../components";
import { C, clamp, easeOut } from "../theme";

const HOOK = "أنواع الزباين الساعة 7 الصبح";
const LINES = [
  ["0–2ث", "لقطة الكاونتر والطابور"],
  ["2–6ث", "الزبون المستعجل على الدوام"],
  ["6–10ث", "اللي يطلب نفس الطلب كل يوم"],
  ["10–14ث", "المفاجأة في آخر ثانية"],
];
const TAGS = ["#كافيهات_الرياض", "#قهوة_مختصة", "#ترند"];

// مشهد 6: الكرت يكبر ويطلع فيه السكربت بالثواني والكابشن والهاشتاقات
export const IdeaDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const card = usePop(0, 16);
  const typed = Math.floor(interpolate(frame, [10, 34], [0, HOOK.length], clamp));
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 140 }}>
        <Words text="السكربت بالثواني" size={92} delay={2} highlight={["بالثواني"]} />
        <Words text="ومعه الكابشن والهاشتاقات" size={56} weight={700} color={C.muted} delay={70} stagger={4} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 260 }}>
        <Glass style={{ width: 940, padding: "50px 54px", scale: 0.85 + card * 0.15, opacity: card }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Chip color="#f472b6">
              <Icon name="play" size={34} color="#f472b6" />
              فيديو تيك توك
            </Chip>
            <Chip color={C.saffron}>
              <Icon name="clock" size={34} color={C.saffron} />
              أفضل وقت 8:30م
            </Chip>
          </div>
          <div style={{ fontSize: 66, fontWeight: 900, marginTop: 34, minHeight: 90, lineHeight: 1.3 }}>
            {HOOK.slice(0, typed)}
            <span style={{ opacity: frame < 40 && Math.floor(frame / 4) % 2 === 0 ? 1 : 0, color: C.blue }}>|</span>
          </div>
          <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 22 }}>
            {LINES.map(([t, l], i) => {
              const at = 34 + i * 8;
              return (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "center",
                    fontSize: 46,
                    opacity: interpolate(frame, [at, at + 8], [0, 1], clamp),
                    translate: `${interpolate(frame, [at, at + 12], [60, 0], { ...clamp, easing: easeOut })}px 0px`,
                  }}
                >
                  <span style={{ color: C.blue, fontWeight: 900, minWidth: 190, direction: "ltr", textAlign: "right" }}>{t}</span>
                  <span style={{ fontWeight: 700 }}>{l}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 40 }}>
            {TAGS.map((tag, i) => {
              const pop = usePop(74 + i * 5, 10);
              return (
                <Chip key={tag} color={C.green} size={36} style={{ scale: pop }}>
                  {tag}
                </Chip>
              );
            })}
          </div>
        </Glass>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
