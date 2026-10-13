import React from 'react';
import {
	AbsoluteFill,
	Easing,
	interpolate,
	OffthreadVideo,
	random,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {C, FPS, T} from './theme';

type ClipName = 'pour' | 'matcha' | 'dessert';
type Fx = 'flash' | 'punch' | 'whipL' | 'whipR' | 'glitch' | 'spin' | 'toWhite';

type Seg = {
	from: number;
	dur: number;
	clip: ClipName;
	start: number; // seconds into the source clip
	rate?: number;
	fx: Fx;
	zoom: [number, number];
	origin?: string;
};

// Absolute frames; cut points copied from the reference video so the cuts land on its beat
export const SEGMENTS: Seg[] = [
	{from: 502, dur: 18, clip: 'pour', start: 0.9, fx: 'flash', zoom: [1.25, 1.12], origin: '50% 45%'},
	{from: 520, dur: 14, clip: 'matcha', start: 1.0, fx: 'punch', zoom: [1.45, 1.35], origin: '50% 55%'},
	{from: 534, dur: 14, clip: 'dessert', start: 0.8, fx: 'whipL', zoom: [1.2, 1.1], origin: '50% 65%'},
	{from: 548, dur: 15, clip: 'pour', start: 1.8, fx: 'glitch', zoom: [1.15, 1.05]},
	{from: 563, dur: 13, clip: 'matcha', start: 2.3, fx: 'spin', zoom: [1.15, 1.05]},
	{from: 576, dur: 16, clip: 'dessert', start: 2.9, fx: 'whipR', zoom: [1.3, 1.15], origin: '50% 70%'},
	// 592–657: triptych (see <Triptych />)
	{from: 657, dur: 89, clip: 'pour', start: 0.3, fx: 'punch', zoom: [1.0, 1.15], origin: '50% 45%'},
	{from: 746, dur: 13, clip: 'matcha', start: 1.6, fx: 'glitch', zoom: [1.3, 1.2]},
	{from: 759, dur: 14, clip: 'dessert', start: 1.2, fx: 'punch', zoom: [1.6, 1.45], origin: '45% 65%'},
	{from: 773, dur: 31, clip: 'matcha', start: 0.0, fx: 'whipL', zoom: [1.05, 1.15]},
	{from: 804, dur: 37, clip: 'dessert', start: 2.0, fx: 'whipR', zoom: [1.1, 1.0], origin: '50% 60%'},
	{from: 841, dur: 35, clip: 'pour', start: 2.9, fx: 'spin', zoom: [1.2, 1.05], origin: '50% 70%'},
	{from: 876, dur: 37, clip: 'matcha', start: 3.0, fx: 'punch', zoom: [1.0, 1.2]},
	{from: 913, dur: 17, clip: 'pour', start: 1.0, rate: 2, fx: 'flash', zoom: [1.2, 1.1]},
	{from: 930, dur: 15, clip: 'dessert', start: 3.5, rate: 2, fx: 'whipL', zoom: [1.25, 1.15]},
	{from: 945, dur: 13, clip: 'matcha', start: 2.0, rate: 2, fx: 'glitch', zoom: [1.3, 1.2]},
	{from: 958, dur: 19, clip: 'pour', start: 3.2, fx: 'toWhite', zoom: [1.1, 1.0]},
];

export const TRIPTYCH = {from: 592, dur: 65};

const clipSrc = (c: ClipName) => staticFile(`clips/${c}.mp4`);
const grade = 'contrast(1.08) saturate(1.15) brightness(1.02)';
const out = Easing.out(Easing.cubic);

const Footage: React.FC<{clip: ClipName; start: number; rate?: number; position?: string}> = ({clip, start, rate = 1, position}) => (
	<OffthreadVideo
		src={clipSrc(clip)}
		trimBefore={Math.round(start * FPS)}
		playbackRate={rate}
		muted
		style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: position}}
	/>
);

const SegmentView: React.FC<{seg: Seg}> = ({seg}) => {
	const f = useCurrentFrame();
	const id = `seg-${seg.from}`;
	const t = interpolate(f, [0, seg.dur], [0, 1], {extrapolateRight: 'clamp'});
	let scale = interpolate(t, [0, 1], seg.zoom);
	let tx = 0;
	let rot = 0;
	let blur = 0;
	let dirBlur = 0;
	let rgb = 0;
	let white = 0;
	let bright = 1;

	switch (seg.fx) {
		case 'flash':
			white = interpolate(f, [0, 5], [0.85, 0], {extrapolateRight: 'clamp'});
			scale += interpolate(f, [0, 6], [0.12, 0], {extrapolateRight: 'clamp', easing: out});
			break;
		case 'punch':
			scale += interpolate(f, [0, 6], [0.3, 0], {extrapolateRight: 'clamp', easing: out});
			blur = interpolate(f, [0, 6], [14, 0], {extrapolateRight: 'clamp'});
			break;
		case 'whipL':
		case 'whipR': {
			const dir = seg.fx === 'whipL' ? -1 : 1;
			tx = dir * interpolate(f, [0, 7], [760, 0], {extrapolateRight: 'clamp', easing: out});
			dirBlur = interpolate(f, [0, 7], [60, 0], {extrapolateRight: 'clamp'});
			break;
		}
		case 'glitch':
			rgb = f < 7 ? (random(`${id}-${f}`) - 0.5) * 70 : 0;
			tx = f < 6 ? (random(`${id}-x-${f}`) - 0.5) * 60 : 0;
			break;
		case 'spin':
			rot = interpolate(f, [0, 9], [-16, 0], {extrapolateRight: 'clamp', easing: out});
			scale += interpolate(f, [0, 9], [0.5, 0], {extrapolateRight: 'clamp', easing: out});
			blur = interpolate(f, [0, 8], [16, 0], {extrapolateRight: 'clamp'});
			break;
		case 'toWhite': {
			const k = Easing.in(Easing.quad)(t);
			scale += k * 1.6;
			blur = k * 26;
			bright = 1 + k * 3.5;
			white = interpolate(f, [seg.dur - 7, seg.dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
			break;
		}
	}

	const filters = [
		dirBlur > 0.5 ? `url(#${id}-mb)` : '',
		Math.abs(rgb) > 0.5 ? `url(#${id}-rgb)` : '',
		blur > 0.3 ? `blur(${blur}px)` : '',
		grade,
		bright !== 1 ? `brightness(${bright})` : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<svg width="0" height="0" style={{position: 'absolute'}}>
				<filter id={`${id}-mb`} x="-20%" y="0" width="140%" height="100%">
					<feGaussianBlur stdDeviation={`${dirBlur} 0`} />
				</filter>
				<filter id={`${id}-rgb`} x="-10%" y="0" width="120%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={rgb} dy="0" result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-rgb} dy="0" result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<AbsoluteFill
				style={{
					transform: `translateX(${tx}px) rotate(${rot}deg) scale(${scale})`,
					transformOrigin: seg.origin ?? '50% 50%',
					filter: filters,
				}}
			>
				<Footage clip={seg.clip} start={seg.start} rate={seg.rate} />
			</AbsoluteFill>
			{seg.fx === 'glitch' && f < 7 ? <GlitchBars seed={id} frame={f} /> : null}
			{white > 0 ? <AbsoluteFill style={{background: '#fff8ec', opacity: white}} /> : null}
		</AbsoluteFill>
	);
};

const GlitchBars: React.FC<{seed: string; frame: number}> = ({seed, frame}) => {
	const colors = [C.brandCream, C.caramel, '#3fd1c7', '#ff4f6d'];
	return (
		<AbsoluteFill style={{mixBlendMode: 'difference'}}>
			{new Array(6).fill(0).map((_, i) => {
				const r = (k: string) => random(`${seed}-${frame}-${i}-${k}`);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							top: r('y') * 1920,
							left: (r('x') - 0.3) * 600,
							width: 400 + r('w') * 900,
							height: 8 + r('h') * 60,
							background: colors[Math.floor(r('c') * colors.length)],
							opacity: 0.85,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// Three vertical strips sliding in, one per drink/dessert
const Triptych: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cols: {clip: ClipName; start: number; pos: string}[] = [
		{clip: 'pour', start: 1.2, pos: '45% 50%'},
		{clip: 'matcha', start: 0.5, pos: '48% 50%'},
		{clip: 'dessert', start: 1.5, pos: '50% 50%'},
	];
	const outT = interpolate(f, [TRIPTYCH.dur - 8, TRIPTYCH.dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	return (
		<AbsoluteFill style={{background: C.brandBrown}}>
			{cols.map((c, i) => {
				const p = spring({frame: f - i * 4, fps, config: {damping: 16, stiffness: 140}});
				const dir = i % 2 === 0 ? -1 : 1;
				const y = (1 - p) * 1920 * dir + outT * 1920 * -dir;
				return (
					<div
						key={c.clip}
						style={{
							position: 'absolute',
							top: 0,
							left: i * 360,
							width: 360,
							height: 1920,
							overflow: 'hidden',
							transform: `translateY(${y}px)`,
							borderLeft: i > 0 ? `6px solid ${C.brandCream}` : undefined,
						}}
					>
						<div style={{position: 'absolute', inset: 0, transform: `scale(${1.15 - 0.1 * p})`, filter: grade}}>
							<Footage clip={c.clip} start={c.start} position={c.pos} />
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// Beat grid of the reference track (≈122 BPM from the drop)
const BEAT0 = 17.72;
const BEAT = 0.49;

export const Montage: React.FC = () => {
	const frame = useCurrentFrame() + T.montage; // absolute frame
	const sec = frame / FPS;
	const k = Math.floor((sec - BEAT0) / BEAT);
	const since = sec - (BEAT0 + k * BEAT);
	const bump = k >= 0 ? 0.035 * Math.exp(-since * 12) : 0;

	return (
		<AbsoluteFill style={{background: '#000', transform: `scale(${1 + bump})`}}>
			{SEGMENTS.map((s) => (
				<Sequence key={s.from} from={s.from - T.montage} durationInFrames={s.dur}>
					<SegmentView seg={s} />
				</Sequence>
			))}
			<Sequence from={TRIPTYCH.from - T.montage} durationInFrames={TRIPTYCH.dur}>
				<Triptych />
			</Sequence>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
		</AbsoluteFill>
	);
};
