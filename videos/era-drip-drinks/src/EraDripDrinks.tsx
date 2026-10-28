import React from "react";
import {
  AbsoluteFill,
  Html5Audio,
  Img,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FONT_FAMILY } from "./fonts";

type DrinkId = "hibiscus" | "coffee" | "latte";

type Drink = {
  id: DrinkId;
  name: string;
  note: string;
  // Anchor of the label's bottom edge, in video pixels.
  label: { x: number; y: number; align: "center" | "right" };
  // Extra punch for the cup while it is lit.
  lit: string;
};

const DRINKS: Drink[] = [
  {
    id: "hibiscus",
    name: "كركديه",
    note: "كركديه طبيعي · بارد ومنعش",
    label: { x: 175, y: 1395, align: "center" },
    lit: "brightness(1.5) saturate(1.4) contrast(1.05)",
  },
  {
    id: "coffee",
    name: "قهوة اليوم",
    note: "محصول مختار · يتغير كل يوم",
    label: { x: 505, y: 1235, align: "center" },
    lit: "brightness(1.15) saturate(1.2)",
  },
  {
    id: "latte",
    name: "ايس سبانش لاتيه",
    note: "إسبريسو · حليب · حليب مكثّف",
    label: { x: 1040, y: 1375, align: "right" },
    lit: "brightness(1.08) saturate(1.2)",
  },
];

// Light-switch timeline in frames, synced to the clicks in the soundtrack.
const STEPS: { from: number; to: number; lit: DrinkId[] }[] = [
  { from: 3, to: 23, lit: ["hibiscus"] },
  { from: 57, to: 82, lit: ["coffee"] },
  { from: 116, to: 141, lit: ["latte"] },
  { from: 170, to: 275, lit: ["hibiscus", "coffee", "latte"] },
];

const BLACKOUT_FROM = 275;
export const DURATION_IN_FRAMES = 332;

const DIMMED = "brightness(0.38) saturate(0.7)";

const fullFrame: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const Label: React.FC<{ drink: Drink }> = ({ drink }) => {
  const { x, y, align } = drink.label;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${align === "center" ? "-50%" : "-100%"}, -100%)`,
        direction: "rtl",
        textAlign: align,
        whiteSpace: "nowrap",
        fontFamily: FONT_FAMILY,
        color: "white",
        textShadow: "0 2px 14px rgba(0, 0, 0, 0.55)",
      }}
    >
      <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.25 }}>
        {drink.name}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 400,
          lineHeight: 1.3,
          opacity: 0.88,
        }}
      >
        {drink.note}
      </div>
    </div>
  );
};

export const EraDripDrinks: React.FC = () => {
  const frame = useCurrentFrame();
  const step = STEPS.find((s) => frame >= s.from && frame < s.to);
  const isLit = (id: DrinkId) => step?.lit.includes(id) ?? false;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={{ opacity: frame < BLACKOUT_FROM ? 1 : 0 }}>
        <Img src={staticFile("photo.jpg")} style={{ ...fullFrame, filter: DIMMED }} />
        {DRINKS.map((drink) => (
          <Img
            key={drink.id}
            src={staticFile(`cups/${drink.id}.png`)}
            style={{
              ...fullFrame,
              filter: drink.lit,
              opacity: isLit(drink.id) ? 1 : 0,
            }}
          />
        ))}
        {DRINKS.filter((drink) => isLit(drink.id)).map((drink) => (
          <Label key={drink.id} drink={drink} />
        ))}
      </AbsoluteFill>
      <Html5Audio src={staticFile("audio.m4a")} />
    </AbsoluteFill>
  );
};
