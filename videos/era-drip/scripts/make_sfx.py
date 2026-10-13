"""Generates the sound effects used by the video into public/sfx (numpy only)."""
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
rng = np.random.default_rng(7)


def t(dur):
    return np.arange(int(SR * dur)) / SR


def bandpass(x, lo, hi):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    mask = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-9), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3), 0, 1)
    return np.fft.irfft(spec * mask, len(x))


def sweep(f0, f1, dur, curve=1.0):
    tt = t(dur)
    f = f0 + (f1 - f0) * (tt / dur) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def save(name, x, gain=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    stereo = np.stack([x, x], axis=1)
    data = (stereo * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


os.makedirs(OUT, exist_ok=True)

# Message sent: quick bubbly pop
d = 0.12
tt = t(d)
pop = sweep(500, 1400, d, 0.5) * np.exp(-tt * 38)
pop += 0.3 * sweep(1000, 2600, d, 0.5) * np.exp(-tt * 55)
save("send.wav", pop, 0.75)

# Message received: soft two-note ding
d = 0.55
tt = t(d)
ding = np.sin(2 * np.pi * 1318 * tt) * np.exp(-tt * 9) * (tt < 0.12)
tt2 = np.clip(tt - 0.1, 0, None)
ding += np.sin(2 * np.pi * 1760 * tt2) * np.exp(-tt2 * 7) * (tt >= 0.1)
ding += 0.25 * np.sin(2 * np.pi * 3520 * tt2) * np.exp(-tt2 * 12) * (tt >= 0.1)
save("receive.wav", ding, 0.7)

# Typing: soft ticks
d = 1.2
x = np.zeros(int(SR * d))
for k in range(9):
    s = int(SR * (0.05 + k * 0.125 + rng.uniform(-0.02, 0.02)))
    n = int(SR * 0.02)
    tick = bandpass(rng.standard_normal(n), 2000, 6000) * np.exp(-np.arange(n) / SR * 260)
    x[s:s + n] += tick * rng.uniform(0.5, 1)
save("typing.wav", x, 0.35)

# Whoosh: filtered noise swell
d = 0.45
tt = t(d)
env = np.sin(np.pi * (tt / d) ** 0.7) ** 2
nz = rng.standard_normal(len(tt))
wh = bandpass(nz, 300, 3500) * env
save("whoosh.wav", wh, 0.6)

# Fast whip for montage cuts
d = 0.22
tt = t(d)
env = np.sin(np.pi * tt / d) ** 3
whip = bandpass(rng.standard_normal(len(tt)), 800, 7000) * env
save("whip.wav", whip, 0.5)

# Impact: deep boom + transient
d = 1.1
tt = t(d)
boom = sweep(90, 38, d, 0.4) * np.exp(-tt * 3.2)
boom += 0.6 * bandpass(rng.standard_normal(len(tt)), 60, 2500) * np.exp(-tt * 25)
save("impact.wav", boom, 0.95)

# Beat hit (kick-ish thump) for montage cuts
d = 0.35
tt = t(d)
hit = sweep(150, 45, d, 0.3) * np.exp(-tt * 11)
hit += 0.25 * bandpass(rng.standard_normal(len(tt)), 2000, 9000) * np.exp(-tt * 60)
save("hit.wav", hit, 0.85)

# Glitch: digital stutter
d = 0.25
x = np.zeros(int(SR * d))
pos = 0
while pos < len(x):
    n = int(SR * rng.uniform(0.012, 0.03))
    f = rng.choice([180, 360, 720, 1440, 2880])
    seg = np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * rng.uniform(0.3, 1)
    if rng.random() < 0.3:
        seg = rng.standard_normal(n) * 0.6
    x[pos:pos + n] = seg[: len(x) - pos]
    pos += n
x *= np.linspace(1, 0.4, len(x))
save("glitch.wav", bandpass(x, 100, 9000), 0.45)

# Riser into the logo
d = 1.4
tt = t(d)
ris = bandpass(rng.standard_normal(len(tt)), 1500, 9000) * (tt / d) ** 2.5
ris += 0.5 * sweep(200, 1600, d, 2.0) * (tt / d) ** 2
save("riser.wav", ris, 0.6)

# Logo shimmer: sparkly partials with tremolo
d = 2.6
tt = t(d)
sh = np.zeros_like(tt)
for i, f in enumerate([1568, 2093, 2637, 3136, 3951, 4699]):
    start = i * 0.06
    tt2 = np.clip(tt - start, 0, None)
    sh += np.sin(2 * np.pi * f * tt2) * np.exp(-tt2 * 2.2) * (tt >= start) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt2))
sh += 0.4 * np.sin(2 * np.pi * 523 * tt) * np.exp(-tt * 1.4)
save("shimmer.wav", sh, 0.5)

print("sfx written to", os.path.abspath(OUT))
