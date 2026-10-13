# جمر — موشن جرافيك لمطعم وهمي

فيديو طولي 1080×1920، ‏30fps، ‏20 ثانية. النسخة النهائية: `out/jamr-restaurant.mp4`.

## التشغيل
```bash
npm install
npm run studio   # معاينة
npx remotion render Jamr ../../out/jamr-restaurant.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

- الصوت: `python3 scripts/make_audio.py` يولّد `public/audio/track.wav`.
- تكبير صور الشيف والبرجر: `scripts/upscale.py` (نموذج EDSR x4 عبر OpenCV).

## المصادر
- الأيقونات ثلاثية الأبعاد: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT).
- الخط: Cairo من Google Fonts (OFL).
