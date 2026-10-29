import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

// نفس ألوان موقع Luzo: كحلي غامق + توهج أزرق + نقطة برتقالية
export const C = {
  bg: "#02040f",
  card: "rgba(13, 22, 44, 0.72)",
  line: "rgba(148, 163, 184, 0.18)",
  ink: "#eef2ff",
  muted: "#94a3b8",
  blue: "#60a5fa",
  blueDeep: "#1d4ed8",
  saffron: "#f59e0b",
  green: "#34d399",
  red: "#f87171",
};

// خط Cairo محفوظ داخل المشروع (يشتغل بدون إنترنت وقت التصدير). خط متغيّر: كل الأوزان من 200 إلى 1000
export const fontFamily = "Cairo";
const CAIRO_RANGES = {
  arabic: "U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC",
  "latin-ext": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
  latin: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
};
for (const [subset, unicodeRange] of Object.entries(CAIRO_RANGES)) {
  loadFont({ family: fontFamily, url: staticFile(`fonts/cairo-${subset}.woff2`), weight: "200 1000", unicodeRange });
}

export const FPS = 30;
// حركة ناعمة سريعة البداية وهادية النهاية (مثل إعلانات Apple)
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
