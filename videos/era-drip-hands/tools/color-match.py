"""Builds a .cube LUT that grades one clip to look like another.

Matches the luma histogram of frames sampled from both clips and applies the
resulting tone curve to all three channels (so hues are kept), then tints the
shadows towards the target's average shadow colour. This gives the "empty
hands" footage the same exposure and look as the "full hands" one.

Usage: python3 color-match.py <source.mp4> <target.mp4> <out.cube>
"""
import subprocess
import sys

import numpy as np

W, H = 270, 480
SIZE = 33


def sample_frames(path, count=12):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-vf",
         f"fps=4,scale={W}:{H}", "-frames:v", str(count),
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 3)


def channel_curve(src, dst):
    src_cdf = np.cumsum(np.bincount(src, minlength=256)) / src.size
    dst_cdf = np.cumsum(np.bincount(dst, minlength=256)) / dst.size
    curve = np.interp(src_cdf, dst_cdf, np.arange(256))
    # Keep the curve monotonic and smooth so gradients don't band.
    curve = np.maximum.accumulate(curve)
    kernel = np.ones(9) / 9
    return np.convolve(np.pad(curve, 4, mode="edge"), kernel, mode="valid") / 255


def luma(rgb):
    return np.clip(rgb @ np.array([0.299, 0.587, 0.114]), 0, 255).astype(np.uint8)


def shadow_tint(rgb):
    dark = rgb[luma(rgb) < 60].astype(float)
    return dark.mean(axis=0) - dark.mean()


def main(source, target, out):
    src, dst = sample_frames(source), sample_frames(target)
    tone = channel_curve(luma(src), luma(dst))
    # Apply the target's shadow tint after the tone curve, fading out by the mids.
    tint = (shadow_tint(dst) - shadow_tint(src)) / 255
    fade = np.clip(1 - tone / 0.5, 0, 1)
    curves = [np.clip(tone + tint[c] * fade, 0, 1) for c in range(3)]
    grid = np.linspace(0, 255, SIZE)
    with open(out, "w") as f:
        f.write(f"LUT_3D_SIZE {SIZE}\n")
        for b in grid:
            for g in grid:
                for r in grid:
                    f.write("%.6f %.6f %.6f\n" % tuple(
                        np.interp(v, np.arange(256), curves[c])
                        for c, v in enumerate((r, g, b))))


if __name__ == "__main__":
    main(*sys.argv[1:])
