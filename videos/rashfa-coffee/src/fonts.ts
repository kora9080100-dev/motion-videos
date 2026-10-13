import { continueRender, delayRender, staticFile } from "remotion";

// Cairo is a variable font: one file per script covers every weight.
const handle = delayRender("Loading Cairo");
const arabic = new FontFace(
  "Cairo",
  `url('${staticFile("fonts/cairo-arabic.woff2")}') format('woff2')`,
  {
    weight: "200 1000",
    unicodeRange:
      "U+0600-06FF, U+0750-077F, U+0870-08FF, U+200C-200E, U+FB50-FDFF, U+FE70-FEFC",
  },
);
const latin = new FontFace(
  "Cairo",
  `url('${staticFile("fonts/cairo-latin.woff2")}') format('woff2')`,
  { weight: "200 1000", unicodeRange: "U+0000-00FF, U+2000-206F, U+FEFF" },
);
Promise.all([arabic.load(), latin.load()])
  .then((faces) => {
    faces.forEach((f) => document.fonts.add(f));
    continueRender(handle);
  })
  .catch((err) => {
    console.error(err);
    continueRender(handle);
  });

export const FONT = "Cairo, sans-serif";
