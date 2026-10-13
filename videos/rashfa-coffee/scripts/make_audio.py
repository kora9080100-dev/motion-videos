"""Builds public/audio/track.wav: a chill 100 BPM groove with warm keys plus
UI sounds (clicks, typing, whooshes, chime) synced to the video (30fps).
Pure numpy synthesis, no external samples.

Run: python3 scripts/make_audio.py
"""
import os
import wave

import numpy as np

SR = 48000
DUR = 15.0
FPS = 30
BPM = 100
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(11)

music = np.zeros((N, 2))
sfx = np.zeros((N, 2))


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def add(buf, start_sec, sig, gain=1.0, pan=0.0):
    i = int(start_sec * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(sig), 0] += sig * l * 1.414
    buf[i : i + len(sig), 1] += sig * r * 1.414


def onepole_lp(x, cutoff):
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    z = 0.0
    for n in range(len(x)):
        z = (1 - a[n]) * x[n] + a[n] * z
        y[n] = z
    return y


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


# ---------------- instruments ----------------


def kick():
    t = t_(0.3)
    f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)


def snare():
    t = t_(0.2)
    n = rng.standard_normal(len(t))
    n = n - onepole_lp(n, 1200)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4
    return (n * np.exp(-t * 20) * 0.4 + body) * 0.8


def hat(open_=False):
    t = t_(0.14 if open_ else 0.04)
    n = rng.standard_normal(len(t))
    n = n - onepole_lp(n, 7000)
    return n * np.exp(-t * (20 if open_ else 80)) * 0.28


def keys(freq, dur):
    """Soft electric-piano: sine + bell partial with slow tremolo."""
    t = t_(dur)
    x = np.sin(2 * np.pi * freq * t + 0.6 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 6))
    x += 0.18 * np.sin(2 * np.pi * freq * 4.01 * t) * np.exp(-t * 9)
    env = np.minimum(1, t / 0.008) * np.exp(-t * 1.6)
    return x * env * (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)) * 0.22


def bass(freq, dur):
    t = t_(dur)
    x = np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(4 * np.pi * freq * t)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 2.5)
    return np.tanh(1.3 * x) * env * 0.5


# ---------------- music ----------------
# Fmaj7 – Em7 – Dm7 – Cmaj7, one chord per bar.
CHORDS = [
    (41, [57, 60, 64, 65]),
    (40, [55, 59, 62, 64]),
    (38, [53, 57, 60, 62]),
    (36, [52, 55, 59, 60]),
]
DRUMS_IN = 1.4
END_HIT = 13.5  # outro logo

bar_len = 4 * BEAT
for bar in range(int(DUR / bar_len) + 1):
    root, tones = CHORDS[bar % 4]
    b0 = bar * bar_len
    if b0 >= END_HIT:
        break
    # chord stabs on 1 and the "and" of 2
    for off, g in ((0, 1.0), (1.5 * BEAT, 0.7), (3 * BEAT, 0.5)):
        if b0 + off < END_HIT:
            for k, n in enumerate(tones):
                add(music, b0 + off + k * 0.008, keys(midi(n), 1.6), g, pan=(k - 1.5) * 0.2)
    for k in range(4):
        tt = b0 + k * BEAT
        if not (DRUMS_IN <= tt < END_HIT):
            if tt < DRUMS_IN:
                add(music, tt, hat(), 0.4, pan=0.3)
            continue
        if k in (0, 2):
            add(music, tt, kick(), 0.85)
        if k == 2:
            add(music, tt + BEAT * 0.75, kick(), 0.5)
        if k in (1, 3):
            add(music, tt, snare(), 0.5)
        for j in range(2):
            add(music, tt + j * BEAT / 2, hat(open_=(j == 1 and k == 3)), 0.5 if j else 0.3, pan=0.3)
        if k == 0:
            add(music, tt, bass(midi(root), BEAT * 1.8), 0.85)
        if k == 2:
            add(music, tt + BEAT / 2, bass(midi(root + 7), BEAT * 0.9), 0.6)

add(music, END_HIT, sum(keys(midi(n), 2.0) for n in (53, 57, 60, 64, 69)), 1.4)
add(music, END_HIT, bass(midi(41), 1.6), 0.9)

# ---------------- sfx ----------------


def whoosh(dur=0.4, lo=300, hi=5000):
    t = t_(dur)
    n = rng.standard_normal(len(t))
    x = t / dur
    sweep = lo + (hi - lo) * (np.sin(np.pi * x) ** 2)
    y = onepole_lp(n, sweep) - onepole_lp(n, sweep * 0.25)
    return y * (x ** 2 * 0.4 + np.sin(np.pi * x) ** 3) * 0.9


def pop(f0=900, f1=260, dur=0.09):
    t = t_(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.8


def click():
    t = t_(0.05)
    n = rng.standard_normal(len(t))
    n = n - onepole_lp(n, 2500)
    return (n * np.exp(-t * 160) * 0.6 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 120) * 0.4)


def key():
    t = t_(0.035)
    n = rng.standard_normal(len(t))
    n = onepole_lp(n, 5000 + rng.uniform(-1500, 1500)) - onepole_lp(n, 900)
    return n * np.exp(-t * 170) * 0.9


def motor(dur):
    t = t_(dur)
    f = 70 + 10 * np.sin(2 * np.pi * 0.7 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    x = onepole_lp(saw, 600)
    env = np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.3)
    return x * env * (1 + 0.3 * np.sin(2 * np.pi * 9 * t)) * 0.35


def chime():
    t = t_(1.2)
    a = np.sin(2 * np.pi * midi(88) * t) * np.exp(-t * 4)
    b = np.zeros_like(t)
    d = int(0.12 * SR)
    b[d:] = np.sin(2 * np.pi * midi(95) * t[: len(t) - d]) * np.exp(-t[: len(t) - d] * 3.5)
    return (a + b) * 0.25


def shimmer():
    t = t_(1.4)
    x = sum(np.sin(2 * np.pi * midi(n) * t) * a for n, a in ((81, 1), (88, 0.6), (93, 0.4), (100, 0.2)))
    return x * np.exp(-t * 3.2) * 0.18


F = lambda fr: fr / FPS  # noqa: E731

add(sfx, F(1), pop(700, 300), 0.4)
add(sfx, F(22), click(), 0.7)
add(sfx, F(28), whoosh(0.35, 500, 4000), 0.4)
for i in range(3):
    add(sfx, F(44 + i * 4), pop(900 + i * 120, 400, 0.06), 0.25)
for i in range(16):
    add(sfx, F(68 + i * 1.8), key(), 0.45, pan=rng.uniform(-0.2, 0.2))
add(sfx, F(98), whoosh(0.35, 300, 3000), 0.4)
add(sfx, F(110), click(), 0.7)
add(sfx, F(111), pop(500, 200, 0.12), 0.4)
add(sfx, F(115), whoosh(0.45, 300, 7000), 0.75)
add(sfx, F(126), pop(800, 300), 0.4)
add(sfx, F(148), whoosh(0.35, 400, 5000), 0.5, pan=0.4)
add(sfx, F(172), whoosh(0.35, 400, 5000), 0.5, pan=0.4)
add(sfx, F(190), whoosh(0.45, 200, 3000), 0.55)
for i in range(4):
    add(sfx, F(202 + i * 4), pop(1000 + i * 100, 400, 0.06), 0.25)
for i in range(3):
    add(sfx, F(226 + i * 5), pop(700, 260, 0.1), 0.35)
add(sfx, F(256), pop(1300, 900, 0.05), 0.3)
add(sfx, F(258), pop(), 0.4)
add(sfx, F(274), click(), 0.75)
add(sfx, F(278), whoosh(0.4, 300, 4000), 0.5)
for i in range(3):
    add(sfx, F(300 + i * 4), pop(900 + i * 150, 400, 0.06), 0.25)
add(sfx, F(298), motor(F(344) - F(298)), 0.6)
add(sfx, F(347), chime(), 1.0)
add(sfx, F(354), pop(600, 250, 0.1), 0.4)
for i in range(8):
    add(sfx, F(368 + i * 1.8), key(), 0.35)
add(sfx, F(396), whoosh(0.35, 200, 2500), 0.3)
add(sfx, F(406), pop(800, 260, 0.12), 0.5)
add(sfx, F(406), shimmer(), 1.0)
for i in range(14):
    add(sfx, F(416 + i * 1.2), key(), 0.25)

# ---------------- mix ----------------
mix = music * 0.6 + sfx * 0.85
fade = np.ones(N)
fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR))
mix *= fade[:, None]
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.6) * 0.89

out = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "track.wav")
pcm = (mix * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", os.path.abspath(out))
