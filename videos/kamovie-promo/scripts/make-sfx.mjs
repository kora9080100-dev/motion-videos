// Synthesizes the sound effects used in the video into public/sfx/*.wav
// Run: node scripts/make-sfx.mjs
import {writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 44100;
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx');
mkdirSync(outDir, {recursive: true});

// Deterministic noise so the sounds are identical on every run
let seed = 1234567;
const rand = () => {
	seed = (seed * 1664525 + 1013904223) >>> 0;
	return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;

const writeWav = (name, samples) => {
	let peak = 0;
	for (const s of samples) peak = Math.max(peak, Math.abs(s));
	const gain = peak > 0 ? 0.89 / peak : 1;
	const data = Buffer.alloc(samples.length * 2);
	samples.forEach((s, i) => {
		data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * gain)) * 32767), i * 2);
	});
	const header = Buffer.alloc(44);
	header.write('RIFF', 0);
	header.writeUInt32LE(36 + data.length, 4);
	header.write('WAVE', 8);
	header.write('fmt ', 12);
	header.writeUInt32LE(16, 16);
	header.writeUInt16LE(1, 20);
	header.writeUInt16LE(1, 22);
	header.writeUInt32LE(SR, 24);
	header.writeUInt32LE(SR * 2, 28);
	header.writeUInt16LE(2, 32);
	header.writeUInt16LE(16, 34);
	header.write('data', 36);
	header.writeUInt32LE(data.length, 40);
	writeFileSync(join(outDir, `${name}.wav`), Buffer.concat([header, data]));
	console.log('wrote', name);
};

// RBJ biquad band-pass with per-sample center frequency
const bandpass = (input, freqAt, q) => {
	const out = new Float32Array(input.length);
	let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
	for (let i = 0; i < input.length; i++) {
		const w0 = (2 * Math.PI * freqAt(i / SR)) / SR;
		const alpha = Math.sin(w0) / (2 * q);
		const a0 = 1 + alpha;
		const b0 = alpha / a0, b2 = -alpha / a0;
		const a1 = (-2 * Math.cos(w0)) / a0, a2 = (1 - alpha) / a0;
		const x = input[i];
		const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
		x2 = x1; x1 = x; y2 = y1; y1 = y;
		out[i] = y;
	}
	return out;
};

const highpass = (input, cutoff) => {
	const out = new Float32Array(input.length);
	const rc = 1 / (2 * Math.PI * cutoff);
	const a = rc / (rc + 1 / SR);
	let prevX = 0, prevY = 0;
	for (let i = 0; i < input.length; i++) {
		prevY = a * (prevY + input[i] - prevX);
		prevX = input[i];
		out[i] = prevY;
	}
	return out;
};

const buf = (seconds) => new Float32Array(Math.round(seconds * SR));
const noiseBuf = (seconds) => buf(seconds).map(() => noise());

// Swelling filtered-noise pass-by
const whoosh = (dur, f0, f1, peakAt, q = 1.2) => {
	const n = noiseBuf(dur);
	const f = bandpass(n, (t) => f0 * Math.pow(f1 / f0, t / dur), q);
	return f.map((s, i) => {
		const t = i / SR;
		const env = t < peakAt ? Math.pow(t / peakAt, 2) : Math.pow(1 - (t - peakAt) / (dur - peakAt), 2.2);
		return s * env;
	});
};

writeWav('whoosh', whoosh(0.55, 250, 2600, 0.32));
writeWav('whip', whoosh(0.28, 600, 5000, 0.12, 0.9));
writeWav('swoosh-soft', whoosh(0.7, 180, 1200, 0.4, 1.6));

// Mouse click: two tiny transients
writeWav('click', (() => {
	const b = buf(0.09);
	for (const [start, f] of [[0, 3200], [0.035, 2400]]) {
		for (let i = 0; i < b.length; i++) {
			const t = i / SR - start;
			if (t < 0) continue;
			b[i] += (Math.sin(2 * Math.PI * f * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 260);
		}
	}
	return b;
})());

// Pop: pitch-dropping sine blip
writeWav('pop', (() => {
	const b = buf(0.16);
	let phase = 0;
	for (let i = 0; i < b.length; i++) {
		const t = i / SR;
		const f = 180 + 820 * Math.exp(-t * 40);
		phase += (2 * Math.PI * f) / SR;
		b[i] = Math.sin(phase) * Math.exp(-t * 28) * Math.min(1, t * 2000);
	}
	return b;
})());

// Typing tick
writeWav('type', (() => {
	const b = buf(0.04);
	for (let i = 0; i < b.length; i++) {
		const t = i / SR;
		b[i] = (noise() * 0.7 + Math.sin(2 * Math.PI * 1800 * t) * 0.3) * Math.exp(-t * 320);
	}
	return highpass(b, 900);
})());

// Counter tick
writeWav('tick', (() => {
	const b = buf(0.05);
	for (let i = 0; i < b.length; i++) {
		const t = i / SR;
		b[i] = Math.sin(2 * Math.PI * 2600 * t) * Math.exp(-t * 180);
	}
	return b;
})());

// Low impact / slam
writeWav('impact', (() => {
	const b = buf(0.9);
	let phase = 0;
	for (let i = 0; i < b.length; i++) {
		const t = i / SR;
		const f = 42 + 90 * Math.exp(-t * 18);
		phase += (2 * Math.PI * f) / SR;
		const body = Math.tanh(Math.sin(phase) * 2.2) * Math.exp(-t * 5.5);
		const crack = noise() * Math.exp(-t * 60) * 0.55;
		b[i] = body + crack;
	}
	return b;
})());

// Paper rustle / fold
writeWav('paper', (() => {
	const b = noiseBuf(0.45);
	const hp = highpass(b, 2200);
	let grain = 0;
	return hp.map((s, i) => {
		const t = i / SR;
		if (i % 220 === 0) grain = rand() < 0.45 ? rand() : 0.08;
		const env = Math.sin(Math.PI * Math.min(1, t / 0.45));
		return s * grain * env;
	});
})());

// Sticker slap
writeWav('slap', (() => {
	const b = buf(0.2);
	for (let i = 0; i < b.length; i++) {
		const t = i / SR;
		b[i] = noise() * Math.exp(-t * 70) * 0.8 + Math.sin(2 * Math.PI * 160 * t) * Math.exp(-t * 35) * 0.6;
	}
	return b;
})());

// Arrow thud into target
writeWav('thud', (() => {
	const b = buf(0.35);
	let phase = 0;
	for (let i = 0; i < b.length; i++) {
		const t = i / SR;
		const f = 90 + 260 * Math.exp(-t * 50);
		phase += (2 * Math.PI * f) / SR;
		b[i] = Math.sin(phase) * Math.exp(-t * 14) + noise() * Math.exp(-t * 120) * 0.5 + Math.sin(2 * Math.PI * 420 * t) * Math.exp(-t * 9) * Math.sin(2 * Math.PI * 14 * t) * 0.25;
	}
	return b;
})());

// Bright ding for the final logo
writeWav('ding', (() => {
	const b = buf(1.6);
	for (let i = 0; i < b.length; i++) {
		const t = i / SR;
		b[i] =
			(Math.sin(2 * Math.PI * 1318.5 * t) * 0.6 +
				Math.sin(2 * Math.PI * 2637 * t) * 0.25 +
				Math.sin(2 * Math.PI * 3955 * t) * 0.1) *
			Math.exp(-t * 3.2) *
			Math.min(1, t * 800);
	}
	return b;
})());

// Rising tension before the CTA
writeWav('riser', (() => {
	const dur = 1.2;
	const n = noiseBuf(dur);
	const f = bandpass(n, (t) => 300 * Math.pow(12, t / dur), 2);
	let phase = 0;
	return f.map((s, i) => {
		const t = i / SR;
		phase += (2 * Math.PI * (110 * Math.pow(4, t / dur))) / SR;
		const env = Math.pow(t / dur, 2.4) * (t > dur - 0.03 ? (dur - t) / 0.03 : 1);
		return (s * 0.8 + Math.sin(phase) * 0.25) * env;
	});
})());
