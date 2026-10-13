# رشفة — موشن جرافيك لكوفي وهمي

فيديو طولي 1080×1920، ‏30fps، ‏15 ثانية، بأسلوب مرجع iFood (حركة واجهة تطبيق). النسخة النهائية: `out/rashfa-coffee.mp4`.

## التشغيل
```bash
npm install
npm run studio   # معاينة
npx remotion render Rashfa ../../out/rashfa-coffee.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

- الصوت: `python3 scripts/make_audio.py` يولّد `public/audio/track.wav`.
- الصور: `python3 scripts/prep_images.py <EDSR_x4.pb>` يلوّن الأيقونات بألوان القهوة ويكبّر الصور الرئيسية.

## المصادر
- الأيقونات ثلاثية الأبعاد: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT).
- الخط: Cairo من Google Fonts (OFL).
