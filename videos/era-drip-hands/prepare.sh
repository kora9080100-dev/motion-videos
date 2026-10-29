#!/usr/bin/env bash
# Prepares the media in public/ from the original clips in source/:
# upscales the phone footage to 1080x1920 and copies the music and font.
#
# The "empty hands" clip was filmed brighter and from further away than the
# "full hands" clip, so it is graded to match it (tools/color-match.py) and
# zoomed in / shifted up so the shirt, logo and hands line up across the cut.
# It is also kept at its native ~60fps because it plays in slow motion.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p public

LUT="$(mktemp --suffix=.cube)"
trap 'rm -f "$LUT"' EXIT
python3 -I tools/color-match.py source/empty-hands.mp4 source/full-hands.mp4 "$LUT"

CLEAN="hqdn3d=1.5:1.5:3:3"
SHARPEN="unsharp=5:5:0.5:5:5:0"

ffmpeg -v error -y -i source/empty-hands.mp4 -an \
  -vf "$CLEAN,scale=1254:2246:flags=lanczos,crop=1080:1920:110:305,lut3d=$LUT,$SHARPEN" \
  -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p public/empty-hands.mp4

ffmpeg -v error -y -i source/full-hands.mp4 -an \
  -vf "fps=30,$CLEAN,scale=1080:-2:flags=lanczos,crop=1080:1920,$SHARPEN" \
  -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p public/full-hands.mp4

cp source/reference-audio.m4a public/music.m4a
cp node_modules/@fontsource/tajawal/files/tajawal-arabic-800-normal.woff2 public/tajawal-800.woff2
