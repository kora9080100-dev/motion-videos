"""Prepares the 3D icons for the coffee video.

- Warms purple/lavender tones toward coffee/cream so icons match the brand.
- Turns the bubble-tea cup into an iced latte (pearls painted out).
- Upscales the hero images 4x with EDSR (OpenCV dnn_superres).

Usage: python3 scripts/prep_images.py <EDSR_x4.pb>
"""
import os
import sys

import cv2
import numpy as np

IMG = os.path.join(os.path.dirname(__file__), "..", "public", "img")


def load(name):
    return cv2.imread(os.path.join(IMG, name), cv2.IMREAD_UNCHANGED)


def save(name, img):
    cv2.imwrite(os.path.join(IMG, name), img)


def colorize(img, hue=14, sat_scale=1.0, keep=None):
    """Tint every pixel to one warm hue (keeps shading). `keep` = (lo, hi)
    OpenCV hue range left untouched, e.g. the iced cup's blue lid."""
    bgr, a = img[:, :, :3], img[:, :, 3]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    h = hsv[:, :, 0]
    mask = np.ones_like(h, dtype=bool)
    if keep:
        mask &= ~((h >= keep[0]) & (h <= keep[1]) & (hsv[:, :, 1] > 40))
    hsv[:, :, 0] = np.where(mask, hue, h)
    hsv[:, :, 1] = np.where(mask, np.clip(hsv[:, :, 1] * sat_scale, 0, 255), hsv[:, :, 1])
    out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    return np.dstack([out, a])


def remove_pearls(img):
    """Paint out the tapioca pearls so the cup reads as an iced latte."""
    bgr, a = img[:, :, :3].copy(), img[:, :, 3]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h, w = a.shape
    yy = np.arange(h)[:, None].repeat(w, 1)
    pearls = ((hsv[:, :, 2] < 175) & (yy > h * 0.6) & (yy < h * 0.93) & (a > 220)).astype(np.uint8) * 255
    pearls = cv2.morphologyEx(pearls, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    pearls = cv2.dilate(pearls, np.ones((9, 9), np.uint8))
    bgr = cv2.inpaint(bgr, pearls, 12, cv2.INPAINT_TELEA)
    return np.dstack([bgr, a])


def upscale(img, sr):
    bgr, a = img[:, :, :3], img[:, :, 3]
    holes = (a == 0).astype(np.uint8) * 255
    filled = cv2.inpaint(bgr, holes, 3, cv2.INPAINT_TELEA)
    up = sr.upsample(filled)
    a_up = cv2.resize(a, (up.shape[1], up.shape[0]), interpolation=cv2.INTER_CUBIC)
    a_up = cv2.GaussianBlur(a_up, (3, 3), 0)
    return np.dstack([up, a_up])


if __name__ == "__main__":
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(sys.argv[1])
    sr.setModel("edsr", 4)

    latte = colorize(load("latte.png"), hue=14, sat_scale=0.9)
    iced = colorize(remove_pearls(load("bubbletea.png")), hue=14, sat_scale=0.8, keep=(85, 115))
    croissant = load("croissant.png")
    scooter = colorize(load("scooter.png"), hue=13, sat_scale=0.95)

    save("latte_small.png", latte)
    save("scooter_warm.png", scooter)
    for name, img in (("latte@4x.png", latte), ("iced@4x.png", iced), ("croissant@4x.png", croissant)):
        save(name, upscale(img, sr))
        print("wrote", name)
