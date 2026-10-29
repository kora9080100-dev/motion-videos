#!/usr/bin/env bash
# Prepares the media in public/ from the original clips in source/:
# upscales the phone footage to 1080x1920 @ 30fps and copies the music and font.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p public

VF="fps=30,hqdn3d=1.5:1.5:3:3,scale=1080:-2:flags=lanczos,crop=1080:1920,unsharp=5:5:0.5:5:5:0"
for clip in empty-hands full-hands; do
  ffmpeg -v error -y -i "source/$clip.mp4" -vf "$VF" -an \
    -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p "public/$clip.mp4"
done

cp source/reference-audio.m4a public/music.m4a
cp node_modules/@fontsource/tajawal/files/tajawal-arabic-800-normal.woff2 public/tajawal-800.woff2
