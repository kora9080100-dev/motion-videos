# Era Drip — كيف يدك تصير مليانه بثانيه؟

Trend edit (9:16, 30fps, ~5.8s): empty gloved hands → cut on the beat → hands holding two Era Drip cups,
with a fixed Arabic caption on top. Music is taken from the reference clip the user sent.

- `source/` — original clips and the reference audio.
- `prepare.sh` — upscales the clips to 1080×1920 @ 30fps and copies the music and font into `public/`.
- `src/Composition.tsx` — the edit (cut frame, trims, caption).

```bash
npm i
./prepare.sh
npx remotion render EraDripHands ../../out/era-drip-hands.mp4 --crf=16
```
