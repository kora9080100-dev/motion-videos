// Renders the PNG app icons and the link-preview (Open Graph) image into public/.
//   node scripts/make-images.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const fontDir = path.join(root, 'node_modules/@fontsource-variable/cairo/files');
const font = (f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(fontDir, f)).toString('base64')}) format('woff2')`;
const logo = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');

const css = `
@font-face { font-family: Cairo; font-weight: 200 1000; src: ${font('cairo-arabic-wght-normal.woff2')}; unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF; }
@font-face { font-family: Cairo; font-weight: 200 1000; src: ${font('cairo-latin-wght-normal.woff2')}; }
* { margin: 0; box-sizing: border-box; }
body { font-family: Cairo, sans-serif; }
`;

const og = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>${css}
body { width: 1200px; height: 630px; overflow: hidden; color: #fff;
  background: radial-gradient(700px 420px at 85% 0%, rgba(124,58,237,.6), transparent 65%),
              radial-gradient(600px 400px at 0% 100%, rgba(255,122,26,.3), transparent 65%), #0b0716;
  display: flex; align-items: center; gap: 48px; padding: 0 70px; }
.text { flex: 1; min-width: 0; }
.logo svg { width: 250px; height: 250px; filter: drop-shadow(0 30px 60px rgba(124,58,237,.6)); }
h1 { font-size: 104px; font-weight: 900; line-height: 1.15; white-space: nowrap;
  background: linear-gradient(180deg,#fff 20%,#e0d4ff 60%,#ffb680 100%); -webkit-background-clip: text; color: transparent; }
.en { direction: ltr; text-align: right; letter-spacing: .35em; color: #ffa24d; font-weight: 800; font-size: 26px; margin: 4px 0 18px; }
p { white-space: nowrap; font-size: 36px; font-weight: 700; color: #d9cff5; line-height: 1.5; }
.pills { display: flex; gap: 14px; margin-top: 26px; }
.pill { white-space: nowrap; font-size: 25px; font-weight: 800; padding: 8px 22px; border-radius: 999px; border: 2px solid rgba(196,181,253,.3); background: rgba(255,255,255,.06); }
.pill.o { border-color: rgba(255,122,26,.6); background: rgba(255,122,26,.18); }
</style></head><body>
<div class="logo">${logo}</div>
<div class="text">
  <h1>اكشف الكذبة</h1>
  <div class="en">CATCH THE LIAR</div>
  <p>الكل يعرف الكلمة السرية… إلا واحد! 🤫</p>
  <div class="pills"><span class="pill o">👥 ٣–١٠ لاعبين</span><span class="pill">📱 من جوالاتكم</span><span class="pill">✨ بدون تسجيل</span></div>
</div>
</body></html>`;

const icon = (size) => `<!doctype html><html><head><style>${css}
body { width: ${size}px; height: ${size}px; background: #0b0716; display: grid; place-items: center; }
svg { width: ${Math.round(size * 0.86)}px; height: ${Math.round(size * 0.86)}px; }
</style></head><body>${logo}</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(og);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(pub, 'og.png') });
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(icon(size));
    await page.screenshot({ path: path.join(pub, `icon-${size}.png`) });
  }
  await browser.close();
  console.log('images written to public/');
})();
