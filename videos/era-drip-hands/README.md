# Era Drip — كيف يدك تصير مليانه بثانيه؟

Trend edit (9:16, 30fps, ~5.8s): empty gloved hands (slow motion) → quick blend on the beat → hands holding
two Era Drip cups, with a fixed Arabic caption on top. Music is taken from the reference clip the user sent.
The empty-hands clip is colour-matched and reframed to the cups clip so the blend reads as one shot.

- `source/` — original clips and the reference audio.
- `prepare.sh` — upscales the clips to 1080×1920, grades and reframes the empty-hands clip, and copies the
  music and font into `public/`.
- `tools/color-match.py` — builds the LUT that grades the empty-hands clip like the cups clip.
- `src/Composition.tsx` — the edit (cut frame, slow motion, blend, caption).

```bash
npm i
./prepare.sh
npx remotion render EraDripHands ../../out/era-drip-hands.mp4 --crf=16
```
