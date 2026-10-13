import React from 'react';
import {
	AbsoluteFill,
	Easing,
	Freeze,
	interpolate,
	OffthreadVideo,
	random,
	Sequence,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {ARABIC_FONT, C, FPS, LOGO_FONT, T} from './theme';

export type ClipName = 'pour' | 'matcha' | 'dessert' | 'beans' | 'mural' | 'grinder' | 'cup' | 'closeup';
export type Tr = 'flash' | 'whipUp' | 'whipDown' | 'whipL' | 'whipR' | 'zoom' | 'spin' | 'glitch' | 'flip' | 'line' | 'iris' | 'push' | 'cut';

// [frames, playback rate] pieces, for speed ramps
type Speed = [number, number][];
type Layer = {clip: ClipName; start: number; pos?: string; speeds?: Speed};

type Shot = {
	from: number;
	to: number;
	kind: 'full' | 'phone' | 'card' | 'bands' | 'cols';
	clip?: ClipName;
	start?: number;
	speeds?: Speed;
	zoom?: [number, number];
	origin?: string;
	pos?: string;
	layers?: Layer[];
	rays?: boolean;
	toWhite?: boolean;
};

// Cuts sit on the reference track's beats (absolute frames @30fps)
export const SHOTS: Shot[] = [
	{from: 502, to: 532, kind: 'phone', clip: 'mural', start: 1.2},
	{from: 532, to: 561, kind: 'full', clip: 'beans', start: 4.3, speeds: [[29, 1.3]], zoom: [1.18, 1.05], origin: '50% 45%'},
	{from: 561, to: 593, kind: 'card', clip: 'grinder', start: 1.0},
	{from: 593, to: 622, kind: 'full', clip: 'pour', start: 0.7, speeds: [[10, 1.8], [19, 0.55]], zoom: [1.22, 1.1], origin: '50% 45%'},
	{from: 622, to: 666, kind: 'full', clip: 'mural', start: 1.6, speeds: [[44, 0.7]], zoom: [1.1, 1.28], origin: '62% 52%'},
	{
		from: 666,
		to: 720,
		kind: 'bands',
		layers: [
			{clip: 'closeup', start: 0.6, pos: '55% 50%'},
			{clip: 'closeup', start: 3.2, pos: '50% 60%'},
			{clip: 'closeup', start: 6.4, pos: '50% 55%'},
		],
	},
	{from: 720, to: 753, kind: 'full', clip: 'matcha', start: 0.3, speeds: [[33, 1.2]], zoom: [1.32, 1.15], origin: '50% 55%'},
	{from: 753, to: 783, kind: 'full', clip: 'dessert', start: 1.0, zoom: [1.28, 1.1], origin: '50% 62%'},
	{from: 783, to: 812, kind: 'card', clip: 'cup', start: 0.4},
	{from: 812, to: 841, kind: 'full', clip: 'beans', start: 6.0, zoom: [1.45, 1.25], origin: '50% 48%'},
	{
		from: 841,
		to: 871,
		kind: 'cols',
		layers: [
			{clip: 'matcha', start: 1.5, pos: '48% 50%'},
			{clip: 'mural', start: 3.0, pos: '62% 50%'},
			{clip: 'dessert', start: 2.6, pos: '50% 50%'},
		],
	},
	{from: 871, to: 915, kind: 'full', clip: 'mural', start: 5.0, zoom: [1.05, 1.2], origin: '60% 55%'},
	{from: 915, to: 944, kind: 'card', clip: 'cup', start: 2.0, rays: true},
	{from: 944, to: 958, kind: 'full', clip: 'closeup', start: 4.0, speeds: [[14, 2]], zoom: [1.2, 1.1], pos: '50% 50%'},
	{from: 958, to: T.logo, kind: 'full', clip: 'pour', start: 3.0, zoom: [1.1, 1.0], origin: '50% 55%', toWhite: true},
];

// Transition between SHOTS[i] and SHOTS[i + 1]
export const TRANSITIONS: Tr[] = ['flash', 'whipUp', 'glitch', 'line', 'zoom', 'push', 'spin', 'whipR', 'flip', 'glitch', 'whipDown', 'iris', 'glitch', 'cut'];

const OVERLAP: Partial<Record<Tr, number>> = {line: 8, iris: 10, push: 8};
const EDGE = 6;
const W = 1080;
const H = 1920;
const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);
const grade = 'contrast(1.1) saturate(1.12) brightness(1.03) sepia(0.06)';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const srcFrame = (start: number, f: number, speeds: Speed = [[9999, 1]]) => {
	let t = start * FPS;
	let left = Math.max(0, f);
	for (const [n, r] of speeds) {
		const k = Math.min(left, n);
		t += k * r;
		left -= k;
		if (left <= 0) break;
	}
	if (left > 0) t += left * speeds[speeds.length - 1][1];
	return Math.floor(t);
};

const Footage: React.FC<{clip: ClipName; frame: number; pos?: string; style?: React.CSSProperties}> = ({clip, frame, pos, style}) => (
	<Freeze frame={frame}>
		<OffthreadVideo
			src={staticFile(`clips/${clip}.mp4`)}
			muted
			style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, ...style}}
		/>
	</Freeze>
);

/* ---------- shot bodies ---------- */

const FullShot: React.FC<{s: Shot; f: number}> = ({s, f}) => {
	const dur = s.to - s.from;
	const t = interpolate(f, [0, dur], [0, 1], clamp);
	let scale = interpolate(t, [0, 1], s.zoom ?? [1.1, 1]);
	let blur = 0;
	let bright = 1;
	let white = 0;
	if (s.toWhite) {
		const k = Easing.in(Easing.quad)(t);
		scale += k * 1.8;
		blur = k * 26;
		bright = 1 + k * 3.2;
		white = interpolate(f, [dur - 7, dur], [0, 1], clamp);
	}
	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					transform: `scale(${scale})`,
					transformOrigin: s.origin ?? '50% 50%',
					filter: `${grade}${blur > 0.3 ? ` blur(${blur}px)` : ''}${bright !== 1 ? ` brightness(${bright})` : ''}`,
				}}
			>
				<Footage clip={s.clip!} frame={srcFrame(s.start!, f, s.speeds)} pos={s.pos} />
			</AbsoluteFill>
			{white > 0 ? <AbsoluteFill style={{background: '#fff8ec', opacity: white}} /> : null}
		</AbsoluteFill>
	);
};

const PhoneShot: React.FC<{s: Shot; f: number}> = ({s, f}) => {
	const enter = interpolate(f, [0, 12], [0, 1], {...clamp, easing: easeOut});
	const z = (1 - enter) * -1500;
	const ry = interpolate(f, [0, 12, 30], [-70, -26, -16], {...clamp, easing: easeOut});
	const rx = interpolate(f, [0, 30], [14, 7], clamp);
	const rz = interpolate(f, [0, 30], [-12, -6], clamp);
	const blur = (1 - enter) * 18;
	const word = 'Era Drip';
	const typed = Math.max(0, Math.min(word.length, Math.floor((f - 5) / 2)));
	const cursorOn = Math.floor(f / 4) % 2 === 0;
	const sheen = interpolate(f, [0, 30], [-60, 140]);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#0c0503'}}>
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(circle at 85% 30%, rgba(200,90,30,0.55), transparent 45%), radial-gradient(circle at 10% 85%, rgba(150,40,20,0.6), transparent 50%), radial-gradient(circle at 50% 60%, rgba(224,164,88,0.18), transparent 60%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 210,
					width: '100%',
					textAlign: 'center',
					fontFamily: LOGO_FONT,
					fontSize: 150,
					color: '#fff7e6',
					direction: 'ltr',
					textShadow: '0 0 18px rgba(255,240,210,0.9), 0 0 60px rgba(224,164,88,0.7)',
					transform: 'rotate(-4deg)',
				}}
			>
				{word.slice(0, typed)}
				<span style={{opacity: cursorOn && typed < word.length + 1 ? 1 : 0, marginLeft: 6, fontFamily: 'sans-serif', fontWeight: 200}}>|</span>
			</div>
			<AbsoluteFill style={{perspective: 1700, alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						position: 'relative',
						width: 560,
						height: 1160,
						marginTop: 380,
						borderRadius: 86,
						background: '#0b0b0b',
						padding: 16,
						transform: `translate3d(40px, 0, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg)`,
						filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
						boxShadow:
							'0 0 0 3px #2b2b2b, 0 0 0 6px rgba(200,200,200,0.25), 0 50px 140px rgba(0,0,0,0.7), 0 0 120px rgba(224,140,60,0.45)',
					}}
				>
					<div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 70, overflow: 'hidden', background: '#000'}}>
						<div style={{position: 'absolute', inset: 0, filter: grade}}>
							<Footage clip={s.clip!} frame={srcFrame(s.start!, f, s.speeds)} pos="60% 50%" />
						</div>
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: `linear-gradient(115deg, transparent ${sheen - 20}%, rgba(255,255,255,0.22) ${sheen}%, transparent ${sheen + 18}%)`,
							}}
						/>
						<div style={{position: 'absolute', top: 22, left: '50%', width: 150, height: 42, marginLeft: -75, borderRadius: 21, background: '#000'}} />
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const Rays: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill
		style={{
			mixBlendMode: 'screen',
			opacity: interpolate(f, [0, 6], [0, 1], clamp),
			background: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,226,170,0) 0deg 7deg, rgba(255,226,170,0.55) 9deg 11deg, rgba(255,226,170,0) 13deg 20deg)',
			WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 10%, transparent 62%)',
			maskImage: 'radial-gradient(circle at 50% 50%, black 10%, transparent 62%)',
			transform: `rotate(${f * 0.8}deg) scale(1.6)`,
			filter: 'blur(4px)',
		}}
	/>
);

const CardShot: React.FC<{s: Shot; f: number}> = ({s, f}) => {
	const dur = s.to - s.from;
	const fr = srcFrame(s.start!, f, s.speeds);
	const rx = interpolate(f, [0, dur], [12, 4], clamp);
	const ry = interpolate(f, [0, dur], [-18, 10], clamp);
	const sc = interpolate(f, [0, dur], [0.94, 1.04], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<AbsoluteFill style={{filter: 'blur(36px) brightness(0.6) saturate(1.25)', transform: 'scale(1.3)'}}>
				<Footage clip={s.clip!} frame={fr} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(224,164,88,0.25), transparent 60%)'}} />
			{s.rays ? <Rays f={f} /> : null}
			<AbsoluteFill style={{perspective: 1600, alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						width: 1040,
						height: 585,
						borderRadius: 34,
						overflow: 'hidden',
						transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
						boxShadow: '0 0 0 3px rgba(242,227,179,0.55), 0 40px 120px rgba(0,0,0,0.7), 0 0 90px rgba(224,164,88,0.35)',
						filter: grade,
					}}
				>
					<Footage clip={s.clip!} frame={fr} />
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const BandsShot: React.FC<{s: Shot; f: number}> = ({s, f}) => {
	const bandH = 630;
	const gap = 15;
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#140904'}}>
			{s.layers!.map((l, i) => {
				const p = interpolate(f, [i * 3, i * 3 + 9], [0, 1], {...clamp, easing: easeOut});
				const dir = i % 2 === 0 ? -1 : 1;
				const x = (1 - p) * W * 1.2 * dir;
				const mb = (1 - p) * 50;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							top: i * (bandH + gap),
							left: 0,
							width: W,
							height: bandH,
							overflow: 'hidden',
							transform: `translateX(${x}px)`,
							filter: `${grade}${mb > 0.5 ? ` blur(${mb * 0.4}px)` : ''}`,
							boxShadow: '0 0 0 2px rgba(242,227,179,0.35)',
						}}
					>
						<div style={{position: 'absolute', inset: 0, transform: `scale(${1.15 - 0.1 * p})`}}>
							<Footage clip={l.clip} frame={srcFrame(l.start, f, l.speeds)} pos={l.pos} />
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

const ColsShot: React.FC<{s: Shot; f: number}> = ({s, f}) => (
	<AbsoluteFill style={{overflow: 'hidden', background: C.brandBrown}}>
		{s.layers!.map((l, i) => {
			const p = interpolate(f, [i * 4, i * 4 + 9], [0, 1], {...clamp, easing: easeOut});
			const dir = i % 2 === 0 ? -1 : 1;
			const y = (1 - p) * H * dir;
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						top: 0,
						left: i * 360,
						width: 360,
						height: H,
						overflow: 'hidden',
						transform: `translateY(${y}px)`,
						borderLeft: i > 0 ? `6px solid ${C.brandCream}` : undefined,
						filter: `${grade}${p < 1 ? ` blur(${(1 - p) * 14}px)` : ''}`,
					}}
				>
					<div style={{position: 'absolute', inset: 0, transform: `scale(${1.2 - 0.12 * p})`}}>
						<Footage clip={l.clip} frame={srcFrame(l.start, f, l.speeds)} pos={l.pos} />
					</div>
				</div>
			);
		})}
	</AbsoluteFill>
);

/* ---------- transitions ---------- */

const LightBurst: React.FC<{amount: number}> = ({amount}) =>
	amount <= 0.01 ? null : (
		<AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, rgba(255,250,235,${amount}) 0%, rgba(255,214,150,${amount * 0.8}) 25%, rgba(255,160,70,${amount * 0.35}) 55%, transparent 80%)`}} />
			<div
				style={{
					position: 'absolute',
					left: -200,
					right: -200,
					top: H / 2 - 18,
					height: 36,
					borderRadius: 18,
					background: `rgba(255,245,225,${amount})`,
					filter: 'blur(10px)',
					transform: `scaleX(${0.4 + amount})`,
				}}
			/>
		</AbsoluteFill>
	);

const GlitchBars: React.FC<{seed: string}> = ({seed}) => {
	const colors = [C.brandCream, C.caramel, '#3fd1c7', '#ff4f6d'];
	return (
		<AbsoluteFill style={{mixBlendMode: 'difference', pointerEvents: 'none'}}>
			{new Array(7).fill(0).map((_, i) => {
				const r = (k: string) => random(`${seed}-${i}-${k}`);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							top: r('y') * H,
							left: (r('x') - 0.3) * 600,
							width: 400 + r('w') * 900,
							height: 8 + r('h') * 70,
							background: colors[Math.floor(r('c') * colors.length)],
							opacity: 0.85,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

type Fx = {tx: number; ty: number; scale: number; rot: number; ry: number; blur: number; hBlur: number; vBlur: number; bright: number; rgb: number; opacity: number; clip?: string; burst: number; glitchSeed?: string; line?: number; ring?: number};

const computeFx = (f: number, dur: number, tin: Tr | null, tout: Tr | null, id: string): Fx => {
	const fx: Fx = {tx: 0, ty: 0, scale: 1, rot: 0, ry: 0, blur: 0, hBlur: 0, vBlur: 0, bright: 1, rgb: 0, opacity: 1, burst: 0};
	const inP = interpolate(f, [0, EDGE], [0, 1], {...clamp, easing: easeOut});
	const g = dur - f; // frames left
	const outP = easeIn(interpolate(g, [0, EDGE], [1, 0], clamp));

	switch (tin) {
		case 'flash':
			fx.burst = Math.max(fx.burst, interpolate(f, [0, 7], [1, 0], clamp));
			fx.scale *= interpolate(f, [0, 8], [1.15, 1], {...clamp, easing: easeOut});
			break;
		case 'whipUp':
			fx.ty += (1 - inP) * 1500;
			fx.vBlur += (1 - inP) * 70;
			break;
		case 'whipDown':
			fx.ty -= (1 - inP) * 1500;
			fx.vBlur += (1 - inP) * 70;
			break;
		case 'whipL':
			fx.tx += (1 - inP) * 1400;
			fx.hBlur += (1 - inP) * 70;
			break;
		case 'whipR':
			fx.tx -= (1 - inP) * 1400;
			fx.hBlur += (1 - inP) * 70;
			break;
		case 'zoom': {
			const p = interpolate(f, [0, 8], [0, 1], {...clamp, easing: easeOut});
			fx.scale *= 2.6 - 1.6 * p;
			fx.blur += (1 - p) * 20;
			fx.bright *= 1 + (1 - p) * 0.8;
			break;
		}
		case 'spin': {
			const p = interpolate(f, [0, 8], [0, 1], {...clamp, easing: easeOut});
			fx.rot += (1 - p) * -30;
			fx.scale *= 1 + (1 - p) * 0.7;
			fx.blur += (1 - p) * 16;
			break;
		}
		case 'glitch':
			if (f < 5) {
				fx.rgb = (random(`${id}-in-${f}`) - 0.5) * 90;
				fx.tx += (random(`${id}-inx-${f}`) - 0.5) * 90;
				fx.glitchSeed = `${id}-in-${f}`;
				if (f === 1) fx.opacity = 0.35;
			}
			break;
		case 'flip':
			fx.ry += (1 - inP) * -90;
			break;
		case 'line': {
			const p = interpolate(f, [-8, 0], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
			if (p < 1) {
				fx.clip = `inset(0 ${(1 - p) * 100}% 0 0)`;
				fx.line = p * W;
			}
			break;
		}
		case 'iris': {
			const p = interpolate(f, [-10, 0], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
			if (p < 1) {
				const r = p * 1250;
				fx.clip = `circle(${r}px at 50% 52%)`;
				fx.ring = r;
			}
			break;
		}
		case 'push': {
			const p = interpolate(f, [-8, 0], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
			fx.tx += (1 - p) * W;
			fx.hBlur += Math.sin(Math.PI * p) * 40;
			break;
		}
		default:
			break;
	}

	switch (tout) {
		case 'flash':
			fx.bright *= 1 + outP * 1.6;
			fx.scale *= 1 + outP * 0.1;
			break;
		case 'whipUp':
			fx.ty -= outP * 1500;
			fx.vBlur += outP * 70;
			break;
		case 'whipDown':
			fx.ty += outP * 1500;
			fx.vBlur += outP * 70;
			break;
		case 'whipL':
			fx.tx -= outP * 1400;
			fx.hBlur += outP * 70;
			break;
		case 'whipR':
			fx.tx += outP * 1400;
			fx.hBlur += outP * 70;
			break;
		case 'zoom':
			fx.scale *= 1 + outP * 2.6;
			fx.blur += outP * 20;
			fx.bright *= 1 + outP * 0.8;
			break;
		case 'spin':
			fx.rot += outP * 30;
			fx.scale *= 1 + outP * 0.7;
			fx.blur += outP * 16;
			break;
		case 'glitch':
			if (g <= 3) {
				fx.rgb = (random(`${id}-out-${g}`) - 0.5) * 70;
				fx.tx += (random(`${id}-outx-${g}`) - 0.5) * 60;
				fx.glitchSeed = `${id}-out-${g}`;
			}
			break;
		case 'flip':
			fx.ry += outP * 90;
			break;
		case 'push': {
			const p = Easing.inOut(Easing.cubic)(interpolate(g, [0, 8], [1, 0], clamp));
			fx.tx -= p * W;
			fx.hBlur += Math.sin(Math.PI * p) * 40;
			break;
		}
		default:
			break;
	}
	return fx;
};

const ShotView: React.FC<{s: Shot; tin: Tr | null; tout: Tr | null; pre: number}> = ({s, tin, tout, pre}) => {
	const f = useCurrentFrame() - pre;
	const dur = s.to - s.from;
	const id = `shot-${s.from}`;
	const fx = computeFx(f, dur, tin, tout, id);

	let body: React.ReactNode;
	if (s.kind === 'phone') body = <PhoneShot s={s} f={f} />;
	else if (s.kind === 'card') body = <CardShot s={s} f={f} />;
	else if (s.kind === 'bands') body = <BandsShot s={s} f={f} />;
	else if (s.kind === 'cols') body = <ColsShot s={s} f={f} />;
	else body = <FullShot s={s} f={f} />;

	const filters = [
		fx.hBlur > 0.5 || fx.vBlur > 0.5 ? `url(#${id}-mb)` : '',
		Math.abs(fx.rgb) > 0.5 ? `url(#${id}-rgb)` : '',
		fx.blur > 0.3 ? `blur(${fx.blur}px)` : '',
		fx.bright !== 1 ? `brightness(${fx.bright})` : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<AbsoluteFill style={{clipPath: fx.clip, WebkitClipPath: fx.clip}}>
			<svg width="0" height="0" style={{position: 'absolute'}}>
				<filter id={`${id}-mb`} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation={`${fx.hBlur} ${fx.vBlur}`} />
				</filter>
				<filter id={`${id}-rgb`} x="-10%" y="0" width="120%" height="100%" colorInterpolationFilters="sRGB">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={fx.rgb} dy="0" result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-fx.rgb} dy="0" result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<AbsoluteFill style={{perspective: 1600, background: fx.ry !== 0 ? '#120703' : undefined}}>
				<AbsoluteFill
					style={{
						transform: `translate(${fx.tx}px, ${fx.ty}px) rotateY(${fx.ry}deg) rotate(${fx.rot}deg) scale(${fx.scale})`,
						filter: filters || undefined,
						opacity: fx.opacity,
					}}
				>
					{body}
				</AbsoluteFill>
			</AbsoluteFill>
			{fx.glitchSeed ? <GlitchBars seed={fx.glitchSeed} /> : null}
			<LightBurst amount={fx.burst} />
			{fx.line !== undefined ? (
				<div
					style={{
						position: 'absolute',
						top: 0,
						bottom: 0,
						left: fx.line - 4,
						width: 8,
						background: '#fffaf0',
						boxShadow: '0 0 30px 12px rgba(255,214,150,0.9), 0 0 90px 40px rgba(224,140,60,0.6)',
					}}
				/>
			) : null}
			{fx.ring !== undefined ? (
				<div
					style={{
						position: 'absolute',
						left: W / 2 - fx.ring,
						top: H * 0.52 - fx.ring,
						width: fx.ring * 2,
						height: fx.ring * 2,
						borderRadius: '50%',
						boxShadow: '0 0 0 6px #fff4dc, 0 0 50px 20px rgba(255,200,120,0.85), inset 0 0 50px 20px rgba(255,200,120,0.6)',
					}}
				/>
			) : null}
		</AbsoluteFill>
	);
};

/* ---------- kinetic words ---------- */

type Word = {text: string; accent?: boolean};
export const WORDS: {from: number; dur: number; words: Word[]}[] = [
	{from: 535, dur: 26, words: [{text: 'من'}, {text: 'الحبة', accent: true}]},
	{from: 628, dur: 38, words: [{text: 'لين'}, {text: 'الكوب', accent: true}]},
];

const Kinetic: React.FC<{words: Word[]; dur: number}> = ({words, dur}) => {
	const f = useCurrentFrame();
	const outT = interpolate(f, [dur - 5, dur], [0, 1], clamp);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.45), transparent 60%)', opacity: 1 - outT}} />
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, direction: 'rtl'}}>
				{words.map((w, i) => {
					const local = f - i * 5;
					const p = interpolate(local, [0, 7], [0, 1], {...clamp, easing: easeOut});
					const chroma = (1 - p) * 26 + outT * 30;
					return (
						<div
							key={i}
							style={{
								fontFamily: ARABIC_FONT,
								fontWeight: 900,
								fontSize: w.accent ? 220 : 150,
								lineHeight: 1.05,
								color: w.accent ? '#ffd38a' : '#fff8ec',
								opacity: p * (1 - outT),
								transform: `scale(${1.35 - 0.35 * p + outT * 0.2}) translateY(${(1 - p) * 30}px)`,
								filter: `blur(${(1 - p) * 14 + outT * 10}px)`,
								textShadow: `${chroma}px 0 0 rgba(255,60,80,0.75), ${-chroma}px 0 0 rgba(60,220,210,0.75), 0 0 24px rgba(255,220,170,0.8), 0 6px 30px rgba(0,0,0,0.6)`,
							}}
						>
							{w.text}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

/* ---------- montage ---------- */

const BEAT0 = 17.72;
const BEAT = 0.49;

export const Montage: React.FC = () => {
	const frame = useCurrentFrame() + T.montage;
	const sec = frame / FPS;
	const k = Math.floor((sec - BEAT0) / BEAT);
	const since = sec - (BEAT0 + k * BEAT);
	const bump = k >= 0 ? 0.03 * Math.exp(-since * 12) : 0;

	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${1 + bump})`}}>
				{SHOTS.map((s, i) => {
					const tin = i > 0 ? TRANSITIONS[i - 1] : 'flash';
					const tout = i < SHOTS.length - 1 ? TRANSITIONS[i] : null;
					const pre = tin ? OVERLAP[tin] ?? 0 : 0;
					return (
						<Sequence key={s.from} from={s.from - pre - T.montage} durationInFrames={s.to - s.from + pre}>
							<ShotView s={s} tin={tin} tout={tout} pre={pre} />
						</Sequence>
					);
				})}
			</AbsoluteFill>
			{WORDS.map((w) => (
				<Sequence key={w.from} from={w.from - T.montage} durationInFrames={w.dur}>
					<Kinetic words={w.words} dur={w.dur} />
				</Sequence>
			))}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};
