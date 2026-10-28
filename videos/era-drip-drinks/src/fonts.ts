import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const FONT_FAMILY = "Cairo";

// The Arabic subset has no Latin punctuation (like "·"), so load both.
const ARABIC_RANGE =
  "U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC";
const LATIN_RANGE = "U+0000-00FF,U+2000-206F";

for (const weight of ["400", "800"]) {
  loadFont({
    family: FONT_FAMILY,
    url: staticFile(`fonts/cairo-arabic-${weight}-normal.woff2`),
    weight,
    unicodeRange: ARABIC_RANGE,
  });
  loadFont({
    family: FONT_FAMILY,
    url: staticFile(`fonts/cairo-latin-${weight}-normal.woff2`),
    weight,
    unicodeRange: LATIN_RANGE,
  });
}
