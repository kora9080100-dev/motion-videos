import React from 'react';
import {
	AbsoluteFill,
	Easing,
	Img,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {ARABIC_FONT, C, T} from './theme';

type Msg = {
	id: string;
	side: 'out' | 'in';
	y: number;
	appear: number;
	hide?: number;
	kind: 'text' | 'photo' | 'typing';
	text?: string;
	strong?: boolean;
};

// World layout (px at camera scale 1). Sent bubbles hug the right edge, received the left.
const MSGS: Msg[] = [
	{id: 'hello', side: 'out', y: 300, appear: 4, kind: 'text', text: 'هلا 👋'},
	{id: 'ready', side: 'out', y: 436, appear: 16, kind: 'text', text: 'طلبك جاهز... ☕'},
	{id: 'photo', side: 'out', y: 572, appear: 34, kind: 'photo'},
	{id: 'think', side: 'out', y: 1162, appear: 60, kind: 'text', text: 'وش رايك فيه؟؟'},
	{id: 'typing', side: 'in', y: 1310, appear: 172, hide: 266, kind: 'typing'},
	{id: 'but', side: 'in', y: 1310, appear: 267, kind: 'text', text: 'حلو بس...'},
	{id: 'fire', side: 'in', y: 1446, appear: T.reply + 4, kind: 'text', text: 'ليش مبالغين كذا؟! 🔥🔥', strong: true},
];

const READ_AT = 165;

type Cam = {cx: number; cy: number; s: number; rx: number; ry: number; rz: number; blur: number};

const ease = Easing.inOut(Easing.cubic);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixCam = (a: Cam, b: Cam, t: number, peakBlur: number): Cam => ({
	cx: lerp(a.cx, b.cx, t),
	cy: lerp(a.cy, b.cy, t),
	s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)),
	rx: lerp(a.rx, b.rx, t),
	ry: lerp(a.ry, b.ry, t),
	rz: lerp(a.rz, b.rz, t),
	blur: Math.sin(Math.PI * t) * peakBlur,
});

// Scene 1: close camera that follows each new message down the chat
const camFollow = (f: number): Cam => {
	const cy = interpolate(f, [0, 14, 24, 34, 50, 60, 76, 157], [362, 362, 430, 430, 840, 860, 1000, 960], {
		easing: ease,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return {
		cx: interpolate(f, [0, 157], [800, 770]),
		cy,
		s: interpolate(f, [0, 157], [1.95, 1.62], {easing: Easing.out(Easing.quad)}),
		rx: interpolate(f, [0, 157], [7, 3]),
		ry: interpolate(f, [0, 157], [-10, 4]),
		rz: interpolate(f, [0, 157], [-2.5, 1]),
		blur: 0,
	};
};

// Scene 2: wide shot, then a slow tension push toward "حلو بس..."
const camWide = (f: number): Cam => ({
	cx: interpolate(f, [T.chatWide, 268, 376], [540, 535, 470], {easing: ease, extrapolateRight: 'clamp'}),
	cy: interpolate(f, [T.chatWide, 268, 376], [900, 930, 1080], {easing: ease, extrapolateRight: 'clamp'}),
	s: interpolate(f, [T.chatWide, 268, 376], [1.0, 1.04, 1.18], {easing: ease, extrapolateRight: 'clamp'}),
	rx: interpolate(f, [T.chatWide, 376], [4, 2]),
	ry: interpolate(f, [T.chatWide, 376], [3, -2]),
	rz: interpolate(f, [T.chatWide, 376], [0.8, -0.6]),
	blur: 0,
});

// Scene 3: close-up on the reply
const camReply = (f: number): Cam => ({
	cx: interpolate(f, [T.reply, 492], [368, 362], {extrapolateRight: 'clamp'}),
	cy: interpolate(f, [T.reply, 492], [1440, 1455], {extrapolateRight: 'clamp'}),
	s: interpolate(f, [T.reply, 492], [1.45, 1.6], {easing: Easing.out(Easing.quad), extrapolateRight: 'clamp'}),
	rx: interpolate(f, [T.reply, 492], [5, 2]),
	ry: interpolate(f, [T.reply, 492], [5, 1]),
	rz: interpolate(f, [T.reply, 492], [1.5, -1.5]),
	blur: 0,
});

const camera = (f: number): Cam => {
	if (f < 149) return camFollow(f);
	if (f < 159) {
		const t = ease(interpolate(f, [149, 159], [0, 1]));
		return mixCam(camFollow(149), camWide(159), t, 16);
	}
	if (f < 372) return camWide(f);
	if (f < 384) {
		const t = ease(interpolate(f, [372, 384], [0, 1]));
		return mixCam(camWide(372), camReply(384), t, 18);
	}
	if (f < 486) return camReply(f);
	// Zoom-through into the 🔥 emojis
	const t = Easing.in(Easing.quad)(interpolate(f, [486, T.montage], [0, 1], {extrapolateRight: 'clamp'}));
	const base = camReply(486);
	return {...base, cx: lerp(base.cx, 140, t), cy: lerp(base.cy, 1488, t), s: Math.exp(lerp(Math.log(base.s), Math.log(14), t)), blur: t * 22};
};

const Ticks: React.FC<{read: boolean}> = ({read}) => (
	<svg width="34" height="20" viewBox="0 0 34 20" style={{marginRight: 6}}>
		<path d="M2 11 L7 16 L18 4" fill="none" stroke={read ? C.tickRead : C.time} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
		<path d="M13 15 L14 16 L25 4" fill="none" stroke={read ? C.tickRead : C.time} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const Tail: React.FC<{side: 'out' | 'in'; color: string}> = ({side, color}) => (
	<svg
		width="30"
		height="30"
		viewBox="0 0 30 30"
		style={{
			position: 'absolute',
			bottom: 0,
			[side === 'out' ? 'right' : 'left']: -14,
			transform: side === 'in' ? 'scaleX(-1)' : undefined,
		}}
	>
		<path d="M0 0 C2 16 10 26 30 30 L0 30 Z" fill={color} />
	</svg>
);

const TimeRow: React.FC<{side: 'out' | 'in'; read: boolean; overlay?: boolean}> = ({side, read, overlay}) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'flex-start',
			direction: 'ltr',
			fontFamily: ARABIC_FONT,
			fontSize: 26,
			fontWeight: 500,
			color: overlay ? 'rgba(255,255,255,0.9)' : C.time,
			marginTop: overlay ? 0 : -4,
			gap: 2,
		}}
	>
		{side === 'out' ? <Ticks read={read} /> : null}
		<span>3:00 م</span>
	</div>
);

const Bubble: React.FC<{m: Msg; frame: number; fps: number}> = ({m, frame, fps}) => {
	const local = frame - m.appear;
	if (local < 0) return null;
	if (m.hide !== undefined && frame >= m.hide) return null;
	const p = spring({frame: local, fps, config: {damping: 13, stiffness: 190, mass: 0.6}});
	const blur = interpolate(local, [0, 6], [12, 0], {extrapolateRight: 'clamp'});
	const opacity = interpolate(local, [0, 4], [0, 1], {extrapolateRight: 'clamp'});
	const color = m.side === 'out' ? C.sent : C.received;
	const read = frame >= READ_AT;
	const glow =
		m.side === 'out'
			? `0 0 34px ${C.sentGlow}, 0 10px 30px rgba(0,0,0,0.45)`
			: '0 0 30px rgba(220,230,235,0.12), 0 10px 30px rgba(0,0,0,0.45)';
	// The punchline flashes a warm glow as it lands
	const punchGlow = m.strong ? interpolate(local, [0, 5, 30], [0, 1, 0.35], {extrapolateRight: 'clamp'}) : 0;

	const textStyle: React.CSSProperties = {
		fontFamily: ARABIC_FONT,
		fontSize: m.strong ? 50 : 46,
		fontWeight: m.strong ? 800 : 700,
		color: C.text,
		direction: 'rtl',
		lineHeight: 1.45,
		whiteSpace: 'nowrap',
		textShadow: '0 0 14px rgba(255,255,255,0.55), 0 0 3px rgba(255,255,255,0.7)',
	};

	let content: React.ReactNode;
	if (m.kind === 'typing') {
		content = (
			<div style={{display: 'flex', gap: 12, padding: '10px 6px', direction: 'ltr'}}>
				{[0, 1, 2].map((i) => {
					const b = Math.sin((frame - m.appear) / 4.2 - i * 0.9);
					return (
						<div
							key={i}
							style={{
								width: 20,
								height: 20,
								borderRadius: 10,
								background: `rgba(230,235,238,${0.45 + 0.4 * Math.max(0, b)})`,
								transform: `translateY(${-Math.max(0, b) * 8}px)`,
							}}
						/>
					);
				})}
			</div>
		);
	} else if (m.kind === 'photo') {
		content = (
			<div style={{position: 'relative', width: 440, height: 560, borderRadius: 22, overflow: 'hidden'}}>
				<Img src={staticFile('img/matcha-still.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%'}} />
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 30%)'}} />
				<div style={{position: 'absolute', bottom: 12, left: 16}}>
					<TimeRow side={m.side} read={read} overlay />
				</div>
			</div>
		);
	} else {
		content = (
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
				<div style={textStyle}>{m.text}</div>
				<TimeRow side={m.side} read={read} />
			</div>
		);
	}

	return (
		<div
			style={{
				position: 'absolute',
				top: m.y,
				[m.side === 'out' ? 'right' : 'left']: 50,
				opacity,
				filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
				transform: `translateY(${(1 - p) * 40}px) scale(${0.55 + 0.45 * p})`,
				transformOrigin: m.side === 'out' ? '100% 100%' : '0% 100%',
			}}
		>
			<div
				style={{
					position: 'relative',
					background: color,
					borderRadius: 30,
					padding: m.kind === 'photo' ? 8 : m.kind === 'typing' ? '18px 30px' : '14px 30px 12px',
					boxShadow: m.strong
						? `${glow}, 0 0 ${60 * punchGlow}px rgba(255,160,60,${0.55 * punchGlow})`
						: glow,
				}}
			>
				<Tail side={m.side} color={color} />
				{content}
			</div>
		</div>
	);
};

// Faint coffee-themed doodles, like WhatsApp's chat wallpaper
const Doodles: React.FC = () => (
	<svg width="5200" height="5600" style={{position: 'absolute', left: -2000, top: -1800}}>
		<defs>
			<pattern id="doodle" width="320" height="320" patternUnits="userSpaceOnUse">
				<g fill="none" stroke="rgba(255,255,255,0.085)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
					{/* cup */}
					<g transform="translate(30 50)">
						<path d="M0 0 h48 v28 a24 24 0 0 1 -48 0 Z" />
						<path d="M48 6 a11 11 0 0 1 0 22" />
						<path d="M14 -8 q6 -7 0 -14 M30 -8 q6 -7 0 -14" />
					</g>
					{/* bean */}
					<g transform="translate(205 60) rotate(25)">
						<ellipse cx="0" cy="0" rx="16" ry="23" />
						<path d="M0 -20 q-9 20 0 40" />
					</g>
					{/* heart */}
					<path transform="translate(130 150)" d="M0 8 C-6 -4 -24 0 -16 14 L0 28 L16 14 C24 0 6 -4 0 8 Z" />
					{/* star */}
					<path transform="translate(260 200)" d="M0 -18 L5 -5 L19 -5 L8 3 L12 17 L0 9 L-12 17 L-8 3 L-19 -5 L-5 -5 Z" />
					{/* chat bubble */}
					<g transform="translate(40 220)">
						<rect x="0" y="0" width="60" height="40" rx="12" />
						<path d="M14 40 l-4 14 l16 -14" />
					</g>
					{/* croissant-ish swirl */}
					<path transform="translate(170 270)" d="M-24 0 q24 -26 48 0 M-14 -6 l4 12 M0 -10 v14 M14 -6 l-4 12" />
					{/* sparkle */}
					<path transform="translate(280 90)" d="M0 -12 v24 M-12 0 h24" />
					{/* dots */}
					<circle cx="120" cy="40" r="5" />
					<circle cx="230" cy="300" r="6" />
					{/* leaf */}
					<path transform="translate(110 260) rotate(-30)" d="M0 0 q14 -24 0 -40 q-14 16 0 40 M0 0 v-34" />
				</g>
			</pattern>
		</defs>
		<rect width="100%" height="100%" fill="url(#doodle)" />
	</svg>
);

export const Chat: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const cam = camera(frame);
	const tx = width / 2 - cam.cx * cam.s;
	const ty = height / 2 - cam.cy * cam.s;
	// fade the zoom-through into a warm white flash
	const flash = interpolate(frame, [497, T.montage], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
			<AbsoluteFill style={{perspective: 1800}}>
				<AbsoluteFill
					style={{
						transform: `rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)`,
						filter: cam.blur > 0.2 ? `blur(${cam.blur}px)` : undefined,
					}}
				>
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							width: 1080,
							height: 1700,
							transformOrigin: '0 0',
							transform: `translate(${tx}px, ${ty}px) scale(${cam.s})`,
						}}
					>
						<Doodles />
						{MSGS.map((m) => (
							<Bubble key={m.id} m={m} frame={frame} fps={fps} />
						))}
					</div>
				</AbsoluteFill>
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.7) 100%)'}} />
			<AbsoluteFill style={{background: '#fff4e0', opacity: flash}} />
		</AbsoluteFill>
	);
};
