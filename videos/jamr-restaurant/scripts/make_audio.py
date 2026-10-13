"""Builds public/audio/track.wav: a light 120 BPM beat plus SFX synced to the
video's frame timings (30fps). Pure numpy synthesis, no external samples.

Run: python3 scripts/make_audio.py
"""
import os
import wave

import numpy as np

SR = 48000
DUR = 20.0
FPS = 30
BPM = 120
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(7)

music = np.zeros((N, 2))
sfx = np.zeros((N, 2))


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def add(buf, start_sec, sig, gain=1.0, pan=0.0):
    i = int(start_sec * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(sig), 0] += sig * l * 1.414
    buf[i : i + len(sig), 1] += sig * r * 1.414


def onepole_lp(x, cutoff):
    """One-pole low-pass; cutoff may be an array (Hz) for sweeps."""
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
    t = t_(0.35)
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) + 0.15 * np.sin(ph * 2) * np.exp(-t * 30)


def clap():
    t = t_(0.22)
    n = rng.standard_normal(len(t))
    n = n - onepole_lp(n, 900)  # high-pass-ish
    env = np.exp(-t * 22) + 0.5 * np.exp(-((t - 0.012) ** 2) / 0.00002)
    return n * env * 0.5


def hat(open_=False):
    t = t_(0.18 if open_ else 0.05)
    n = rng.standard_normal(len(t))
    n = n - onepole_lp(n, 6000)
    return n * np.exp(-t * (18 if open_ else 70)) * 0.35


def pluck(freq, dur=0.45, bright=3500):
    t = t_(dur)
    saw = 2 * ((t * freq) % 1) - 1
    tri = 2 * np.abs(2 * ((t * freq * 1.003) % 1) - 1) - 1
    x = 0.6 * saw + 0.4 * tri
    cutoff = 300 + bright * np.exp(-t * 9)
    return onepole_lp(x, cutoff) * np.exp(-t * 6) * 0.5


def bass(freq, dur):
    t = t_(dur)
    x = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 2.2)
    return np.tanh(1.4 * x) * env * 0.55


def pad(freqs, dur):
    t = t_(dur)
    x = sum(np.sin(2 * np.pi * f * t + i) + 0.3 * np.sin(4 * np.pi * f * t) for i, f in enumerate(freqs))
    env = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.5)
    return x * env * 0.06


# ---------------- music ----------------
# Am – F – C – G, one chord per bar (2s).
CHORDS = [
    (57, [57, 60, 64, 69]),  # Am
    (53, [53, 57, 60, 65]),  # F
    (48, [55, 60, 64, 67]),  # C
    (55, [55, 59, 62, 67]),  # G
]
ARP = [0, 2, 1, 3, 2, 1, 3, 2]  # 8th-note pattern through chord tones

BREAK_START, BREAK_END = 10.4, 12.0  # drums drop out for "الكل في واحد"
DRUMS_IN = 1.5
END_HIT = 18.6

bar_len = 4 * BEAT
for bar in range(int(DUR / bar_len) + 1):
    root, tones = CHORDS[bar % 4]
    b0 = bar * bar_len
    if b0 >= END_HIT:
        break
    add(music, b0, pad([midi(n) for n in tones[:3]], bar_len + 0.3), 1.0)
    for k in range(8):
        tt = b0 + k * BEAT / 2
        if tt >= END_HIT:
            break
        note = tones[ARP[k]] + 12
        add(music, tt, pluck(midi(note), bright=2200 if tt < DRUMS_IN else 3800), 0.55, pan=0.25 if k % 2 else -0.25)
    for k in range(4):
        tt = b0 + k * BEAT
        drums = DRUMS_IN <= tt < END_HIT and not (BREAK_START <= tt < BREAK_END)
        if drums:
            add(music, tt, kick(), 0.9)
            if k in (1, 3):
                add(music, tt, clap(), 0.55)
            add(music, tt + BEAT / 2, hat(open_=(k == 3)), 0.6, pan=0.3)
            add(music, tt + BEAT / 4, hat(), 0.25, pan=-0.3)
            add(music, tt + 3 * BEAT / 4, hat(), 0.25, pan=-0.3)
        if tt >= DRUMS_IN and tt < END_HIT and not (BREAK_START <= tt < BREAK_END):
            if k in (0, 2):
                add(music, tt, bass(midi(root - 12), BEAT * 1.4), 0.8)
            else:
                add(music, tt + BEAT / 2, bass(midi(root - 12), BEAT * 0.45), 0.5)
        elif tt < DRUMS_IN:
            add(music, tt, hat(), 0.25, pan=0.3)

# final chord rings out under the logo
add(music, END_HIT, pad([midi(n) for n in (57, 60, 64, 69)], 1.4), 1.6)
add(music, END_HIT, bass(midi(45), 1.4), 0.9)

# ---------------- sfx ----------------


def whoosh(dur=0.4, lo=300, hi=5000, rev=False):
    t = t_(dur)
    n = rng.standard_normal(len(t))
    x = t / dur
    sweep = lo + (hi - lo) * (np.sin(np.pi * x) ** 2)
    y = onepole_lp(n, sweep) - onepole_lp(n, sweep * 0.25)
    env = (x ** 2.2 if not rev else (1 - x) ** 2.2) * 0.4 + np.sin(np.pi * x) ** 3
    return y * env * 0.9


def pop(f0=900, f1=260, dur=0.09):
    t = t_(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 60)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 40) * 0.8


def tick(f=2200):
    t = t_(0.04)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 120) * 0.5


def boing():
    t = t_(0.22)
    f = 380 + 420 * (1 - np.exp(-t * 18)) + 40 * np.sin(2 * np.pi * 22 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 12) * 0.5


def impact(dur=0.9):
    t = t_(dur)
    f = 42 + 90 * np.exp(-t * 14)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 4.5)
    n = rng.standard_normal(len(t))
    noise = onepole_lp(n, 1800) * np.exp(-t * 12) * 0.5
    return np.tanh(1.5 * (body + noise)) * 0.9


def riser(dur=1.1):
    t = t_(dur)
    n = rng.standard_normal(len(t))
    x = t / dur
    y = onepole_lp(n, 400 + 7000 * x ** 2) - onepole_lp(n, 200 + 2000 * x ** 2)
    return y * x ** 2.5 * 0.9


def shimmer():
    t = t_(1.4)
    x = sum(np.sin(2 * np.pi * midi(n) * t) * a for n, a in ((81, 1), (88, 0.6), (93, 0.4), (100, 0.2)))
    return x * np.exp(-t * 3.2) * 0.18


F = lambda fr: fr / FPS  # noqa: E731

add(sfx, F(2), pop(700, 300), 0.35)
add(sfx, F(14), pop(), 0.6)
add(sfx, F(31), whoosh(0.35, 400, 3000), 0.35)
add(sfx, F(48), whoosh(0.5, 150, 1500), 0.45)
add(sfx, F(70), tick(1600), 0.4)
add(sfx, F(91), whoosh(0.45, 300, 6000), 0.8, pan=-0.4)
add(sfx, F(100), whoosh(0.4, 300, 5000), 0.5, pan=0.4)
add(sfx, F(112), pop(600, 200, 0.12), 0.55)
for i in range(5):
    fr = 150 + i * 30
    add(sfx, F(fr), tick(2000 + i * 150), 0.5)
    add(sfx, F(fr + 4), pop(1100 + i * 80, 400, 0.07), 0.4)
add(sfx, F(298), whoosh(0.35, 200, 2500, rev=True), 0.35)
add(sfx, F(314), pop(800, 300), 0.35)
add(sfx, F(322), tick(1500), 0.35)
add(sfx, F(318), riser(F(350) - F(318) + 0.05), 0.6)
add(sfx, F(347), whoosh(0.4, 400, 7000), 0.8)
add(sfx, F(360), impact(), 0.9)
add(sfx, F(372), pop(), 0.55)
add(sfx, F(386), tick(1500), 0.4)
add(sfx, F(404), whoosh(0.3, 300, 2500, rev=True), 0.3)
add(sfx, F(420), whoosh(0.35, 500, 6000), 0.5, pan=0.2)
add(sfx, F(432), boing(), 0.55)
add(sfx, F(460), tick(1500), 0.35)
add(sfx, F(475), whoosh(0.45, 300, 6000), 0.8, pan=-0.4)
add(sfx, F(490), whoosh(0.3, 400, 4000), 0.35, pan=0.4)
add(sfx, F(516), pop(1000, 350), 0.6)
add(sfx, F(546), whoosh(0.35, 200, 2500, rev=True), 0.3)
add(sfx, F(556), impact(1.2), 0.7)
add(sfx, F(558), shimmer(), 1.0)

# ---------------- mix ----------------
mix = music * 0.55 + sfx * 0.8
fade = np.ones(N)
fade[-int(0.5 * SR):] = np.linspace(1, 0, int(0.5 * SR))
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
