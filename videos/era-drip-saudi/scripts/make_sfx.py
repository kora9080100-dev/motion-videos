"""Generates the sound effects and the music bed used by the video into public/sfx (numpy only)."""
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

# ---------------- Era Drip Saudi additions ----------------


def lowpass(x, hi):
    return bandpass(x, 1, hi)


def env_ad(n, a, d):
    e = np.ones(n)
    na = max(1, int(SR * a))
    e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / SR / d)
    return e


# Jet fly-by: roaring noise swelling then fading, with a doppler-dropping whine
d = 3.0
tt = t(d)
peak = 1.1
env = 1 / (1 + ((tt - peak) / 0.38) ** 2)
roar = lowpass(rng.standard_normal(len(tt)), 1600) * env
roar += 0.6 * bandpass(rng.standard_normal(len(tt)), 1500, 6000) * env ** 1.6
f_whine = 2400 - 900 * (1 / (1 + np.exp(-(tt - peak) * 6)))
whine = np.sin(2 * np.pi * np.cumsum(f_whine) / SR) * env ** 2 * 0.25
rumble = sweep(70, 40, d, 1.0) * env * 0.8
save("jet.wav", roar + whine + rumble, 0.95)

# Sword drawn and raised: metallic shing
d = 1.1
tt = t(d)
scr = bandpass(rng.standard_normal(len(tt)), 3000, 9000) * np.exp(-tt * 9) * np.clip(tt / 0.02, 0, 1)
ring = np.zeros_like(tt)
for f0, a in [(2350, 1), (3720, 0.6), (5210, 0.45), (6890, 0.3)]:
    ring += a * np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 4.5)
save("sword.wav", scr * 0.8 + ring * 0.5, 0.6)

# Flag flutter
d = 1.2
tt = t(d)
flut = lowpass(rng.standard_normal(len(tt)), 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * tt)) * np.sin(np.pi * tt / d)
save("flap.wav", flut, 0.5)

# Falcon cry: piercing descending "kree"
d = 0.75
tt = t(d)
fc = 3100 - 700 * (tt / d) + 90 * np.sin(2 * np.pi * 28 * tt)
ph = 2 * np.pi * np.cumsum(fc) / SR
cry = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * env_ad(len(tt), 0.03, 0.25)
cry += 0.15 * bandpass(rng.standard_normal(len(tt)), 2500, 6000) * env_ad(len(tt), 0.01, 0.1)
save("falcon.wav", cry, 0.45)

# Wing beats
d = 0.9
x = np.zeros(int(SR * d))
for k in range(4):
    s0 = int(SR * k * 0.21)
    n = int(SR * 0.16)
    x[s0:s0 + n] += lowpass(rng.standard_normal(n), 700) * np.sin(np.pi * np.arange(n) / n) ** 2
save("wings.wav", x, 0.5)

# Falling whistle for the cup drop
d = 0.4
tt = t(d)
fall = sweep(1800, 500, d, 1.2) * np.clip(tt / 0.05, 0, 1) * 0.6
fall += 0.5 * bandpass(rng.standard_normal(len(tt)), 600, 4000) * (tt / d) ** 2
save("fall.wav", fall, 0.5)

# Deep boom with long tail
d = 2.2
tt = t(d)
boom2 = sweep(70, 30, d, 0.5) * np.exp(-tt * 1.8)
boom2 += 0.5 * lowpass(rng.standard_normal(len(tt)), 400) * np.exp(-tt * 4)
save("boom.wav", boom2, 0.95)

# Carpet roll: low swoosh
d = 0.8
tt = t(d)
roll = lowpass(rng.standard_normal(len(tt)), 500) * np.sin(np.pi * tt / d) ** 1.5
roll += 0.3 * bandpass(rng.standard_normal(len(tt)), 800, 3000) * np.sin(np.pi * tt / d) ** 3
save("roll.wav", roll, 0.6)


# ---------------- Music bed for the sound-effects version ----------------
# Same grid as the reference track: a beat every ~0.59s starting at 0.20s,
# silence at 5.54s, break hits, drop at 9.20s.

LEN = 554 / 30
N = int(SR * LEN)
bed = np.zeros(N)


def put(x, at, gain=1.0):
    s0 = int(SR * at)
    if s0 >= N:
        return
    n = min(len(x), N - s0)
    bed[s0:s0 + n] += x[:n] * gain


def taiko(dur=0.9):
    tt = t(dur)
    b = sweep(95, 42, dur, 0.35) * np.exp(-tt * 5)
    b += 0.35 * lowpass(rng.standard_normal(len(tt)), 1200) * np.exp(-tt * 30)
    return b


def kick808(dur=0.7, f0=52):
    tt = t(dur)
    k = sweep(160, f0, dur, 0.12) * np.exp(-tt * 3.2)
    k += 0.2 * bandpass(rng.standard_normal(len(tt)), 2000, 8000) * np.exp(-tt * 80)
    return np.tanh(k * 1.6)


def clap():
    n = int(SR * 0.3)
    x = np.zeros(n)
    for o in [0, 0.012, 0.024]:
        s0 = int(SR * o)
        m = n - s0
        x[s0:] += bandpass(rng.standard_normal(m), 900, 5000) * np.exp(-np.arange(m) / SR * 30)
    return x


def hat(open_=False):
    dur = 0.18 if open_ else 0.05
    tt = t(dur)
    return bandpass(rng.standard_normal(len(tt)), 7000, 15000) * np.exp(-tt * (18 if open_ else 90))


def pluck(freq, dur=0.6, bright=0.5):
    # Karplus-Strong, oud-like
    n = int(SR * dur)
    period = int(SR / freq)
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = 0.5 * (buf[i % period] + buf[(i + 1) % period]) * (0.994 - 0.004 * (1 - bright))
    return out * np.exp(-np.arange(n) / SR * 2.2)


def stab(freqs, dur=0.5):
    tt = t(dur)
    x = np.zeros_like(tt)
    for f0 in freqs:
        for det in (-0.004, 0.004):
            ph = (tt * f0 * (1 + det)) % 1
            x += 2 * ph - 1
    return lowpass(x, 1800) * env_ad(len(tt), 0.01, 0.18)


BEAT = 0.5897
beat = lambda k: 0.20 + k * BEAT
D2, F2, A2, C3, D3, F3, A3 = 73.42, 87.31, 110.0, 130.81, 146.83, 174.61, 220.0

# drone pad under the intro and build
tt = t(9.2)
pad = np.zeros_like(tt)
for f0, a in [(D2, 0.5), (A2, 0.35), (D3, 0.3), (F3, 0.22)]:
    pad += a * np.sin(2 * np.pi * f0 * tt + 0.3 * np.sin(2 * np.pi * 0.2 * tt))
pad *= np.clip(tt / 1.5, 0, 1) * (0.5 + 0.5 * np.clip((tt - 2) / 3.5, 0, 1))
pad[int(SR * 5.54):int(SR * 5.87)] = 0
put(pad * 0.16, 0)

# intro + build: taiko on the beat
for k in range(0, 10):
    put(taiko(), beat(k), 0.9 if k < 4 else 0.7)
# snare roll accelerating into the silence
pos = 2.6
gap = 0.3
while pos < 5.5:
    put(clap()[: int(SR * 0.12)], pos, 0.12 + 0.35 * (pos - 2.6) / 2.9)
    pos += gap
    gap = max(0.045, gap * 0.9)
tt = t(2.0)
put(bandpass(rng.standard_normal(len(tt)), 1500, 9000) * (tt / 2.0) ** 3, 3.54, 0.35)

# break hits
for at in [5.87, 6.56, 6.91, 7.60, 7.95, 8.66, 9.01]:
    put(taiko(1.2), at, 1.0)
    put(stab([D3, F3, A3]), at, 0.22)
tt = t(0.6)
put(bandpass(rng.standard_normal(len(tt)), 2000, 10000) * (tt / 0.6) ** 4, 8.62, 0.4)

# drop
DROP = 9.20
put(boom2, DROP, 0.9)
bass_notes = [D2, D2, F2, C3 / 2, D2, D2, A2 / 2, C3 / 2]
k0 = 16
for k in range(k0, 31):
    at = beat(k)
    if at < DROP:
        continue
    put(kick808(0.55, bass_notes[(k - k0) % 8]), at, 0.85)
    if (k - k0) % 2 == 1:
        put(clap(), at, 0.45)
    for h in range(2):
        put(hat(open_=(h == 1 and (k - k0) % 4 == 3)), at + h * BEAT / 2, 0.22)
    if (k - k0) % 4 == 2:
        for r in range(3):
            put(hat(), at + BEAT / 2 + (r + 1) * BEAT / 8, 0.15)
put(kick808(0.9, D2), DROP, 0.9)

# hijaz motif on a plucked string over the drop (D Eb F# G A)
Dm, Eb, Fs, G, A, C = 293.66, 311.13, 369.99, 392.0, 440.0, 523.25
motif = [(0, A), (0.5, G), (1, Fs), (1.5, Eb), (2, Dm), (3, Fs), (3.5, G), (4, A), (5, C), (5.5, A), (6, G), (6.5, Fs), (7, Eb), (7.5, Fs), (8, Dm)]
for rep in range(2):
    base = beat(18) + rep * 8 * BEAT
    for off, fr in motif:
        at = base + off * BEAT / 2
        put(pluck(fr, 0.5), at, 0.32)

# final hit on the logo
put(boom2, beat(28), 0.45)
put(stab([D3, F3, A3], 1.2), beat(28), 0.25)

bed = np.tanh(bed * 1.1)
fade = np.ones(N)
fade[-int(SR * 0.5):] = np.linspace(1, 0, int(SR * 0.5))
save("bed.wav", bed * fade, 0.92)

print("sfx written to", os.path.abspath(OUT))
